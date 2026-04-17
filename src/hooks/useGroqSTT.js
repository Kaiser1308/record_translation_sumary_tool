import { useState, useRef, useCallback, useEffect } from 'react';
import useAudioLevel from './useAudioLevel';

const RECORD_INTERVAL = 4000; // Ghi âm từng đoạn 4 giây

export default function useGroqSTT(onFinalResult, meetingLang = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [detectedSpeakers, setDetectedSpeakers] = useState(new Set());
  const [meterStream, setMeterStream] = useState(null);
  const shouldListenRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);
  const meetingLangRef = useRef(meetingLang);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const fileReaderRef = useRef(null);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    meetingLangRef.current = meetingLang;
  }, [meetingLang]);

  const audioLevel = useAudioLevel(meterStream);

  const sendAudioToGroq = async (blob) => {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) return;
    
    const formData = new FormData();
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3-turbo');
    // Chỉ force tiếng việt nếu chọn vi, whisper tự động cũng rất tốt
    if (meetingLangRef.current === 'vi') {
        formData.append('language', 'vi');
    }
    formData.append('response_format', 'json');
    formData.append('temperature', '0.0');

    try {
      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`
        },
        body: formData
      });
      if (!res.ok) {
        console.error('[GroqSTT] API Error:', res.statusText);
        return;
      }
      const data = await res.json();
      if (data.text && data.text.trim()) {
        const text = data.text.trim();
        const lower = text.toLowerCase();
        // Ignore generic whisper hallucinations for pure silence or noise
        if (
          lower === 'phụ đề thuộc về htv3' ||
          lower.includes('âm nhạc') ||
          lower.includes('tiếng nhạc') ||
          lower === 'the end' ||
          lower.length < 3
        ) {
          return;
        }
        
        console.log('[GroqSTT]', text);
        // Groq doesn't provide diarization in standard whisper API
        onFinalResultRef.current?.(text, { speaker: null });
        setInterimText('');
      }
    } catch (err) {
      console.error('[GroqSTT] send error:', err);
    }
  };

  const startNextChunk = () => {
    if (!shouldListenRef.current || !streamRef.current) return;
    
    let mimeType = 'audio/webm'; // fallback
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=vp8')) {
      mimeType = 'audio/webm;codecs=vp8';
    } 

    try {
        const recorder = new MediaRecorder(streamRef.current, { mimeType });
        mediaRecorderRef.current = recorder;
        let chunks = [];
        
        recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.onstop = () => {
          if (chunks.length > 0 && shouldListenRef.current) {
              const blob = new Blob(chunks, { type: mimeType });
              sendAudioToGroq(blob);
          }
        };
        
        recorder.start();
        setInterimText('...'); // show thinking state
        
        setTimeout(() => {
            if (recorder.state === 'recording') {
                recorder.stop();
            }
            if (shouldListenRef.current) {
                startNextChunk(); // loop next chunk immediately
            }
        }, RECORD_INTERVAL);

    } catch (error) {
        console.error("MediaRecorder init bug:", error);
    }
  };

  const start = useCallback(async () => {
    const key = import.meta.env.VITE_GROQ_API_KEY;
    if (!key) {
       alert('Chưa cấu hình VITE_GROQ_API_KEY trong file .env');
       return;
    }
    shouldListenRef.current = true;
    
    try {
      // Đảm bảo audio có chất lượng đủ tốt
      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      setMeterStream(streamRef.current);
      setIsListening(true);
      startNextChunk();
    } catch (err) {
      console.error('[GroqSTT] Mic error:', err);
      shouldListenRef.current = false;
      alert("Không thể truy cập Microphone cho Groq.");
    }
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      shouldListenRef.current = false;
      setIsListening(false);
      setInterimText('');
      setMeterStream(null);
      
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch {}
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      
      resolve();
    });
  }, []);

  const resetSpeakers = useCallback(() => {
      setDetectedSpeakers(new Set());
  }, []);

  return { start, stop, isListening, interimText, detectedSpeakers, resetSpeakers, audioLevel };
}
