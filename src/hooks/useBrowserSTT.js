import { useState, useRef, useCallback, useEffect } from 'react';
import useAudioLevel from './useAudioLevel';

const VI_RESTART_TIMEOUT = 10000;
const MAX_CONSECUTIVE_RESTARTS = 999;

export default function useBrowserSTT(onFinalResult, meetingLang = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [meterStream, setMeterStream] = useState(null);
  const meterStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);
  const stopResolveRef = useRef(null);
  const meetingLangRef = useRef(meetingLang);
  const lastResultTimeRef = useRef(0);
  const viRestartTimerRef = useRef(null);
  const consecutiveRestartsRef = useRef(0);
  const viWarningShownRef = useRef(false);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    meetingLangRef.current = meetingLang;
  }, [meetingLang]);

  const audioLevel = useAudioLevel(meterStream);

  const clearViRestartTimer = useCallback(() => {
    if (viRestartTimerRef.current) {
      clearTimeout(viRestartTimerRef.current);
      viRestartTimerRef.current = null;
    }
  }, []);

  const scheduleViRestart = useCallback((recognition) => {
    clearViRestartTimer();
    if (meetingLangRef.current !== 'vi') return;

    viRestartTimerRef.current = setTimeout(() => {
      const elapsed = Date.now() - lastResultTimeRef.current;
      if (elapsed >= VI_RESTART_TIMEOUT - 500 && shouldListenRef.current && recognitionRef.current === recognition) {
        consecutiveRestartsRef.current += 1;
        console.log('[BrowserSTT] VI auto-restart attempt', consecutiveRestartsRef.current);

        if (consecutiveRestartsRef.current >= MAX_CONSECUTIVE_RESTARTS) {
          if (!viWarningShownRef.current) {
            viWarningShownRef.current = true;
            console.warn('[BrowserSTT] VI not supported well by Web Speech API. Recommend Deepgram.');
            alert('Web Speech API không nhận diện tốt tiếng Việt. Vui lòng chuyển sang Deepgram (Nhận diện → Deepgram Nova-2).');
          }
          shouldListenRef.current = false;
          recognitionRef.current = null;
          setIsListening(false);
          if (meterStreamRef.current) {
            meterStreamRef.current.getTracks().forEach((t) => t.stop());
            meterStreamRef.current = null;
          }
          setMeterStream(null);
          clearViRestartTimer();
          try { recognition.abort(); } catch {}
          return;
        }

        try {
          recognition.abort();
        } catch (err) {
          console.error('[BrowserSTT] abort error:', err);
        }
      }
    }, VI_RESTART_TIMEOUT);
  }, [clearViRestartTimer]);

  const start = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt không hỗ trợ Web Speech API. Dùng Chrome hoặc Edge.');
      return;
    }

    shouldListenRef.current = true;
    lastResultTimeRef.current = Date.now();
    consecutiveRestartsRef.current = 0;
    viWarningShownRef.current = false;

    const isVi = meetingLangRef.current === 'vi';
    const recognition = new SpeechRecognition();
    recognition.lang = isVi ? 'vi-VN' : 'en-US';
    recognition.continuous = !isVi;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    console.log('[BrowserSTT] start, lang =', recognition.lang, 'continuous =', recognition.continuous);

    recognition.onresult = (event) => {
      lastResultTimeRef.current = Date.now();
      consecutiveRestartsRef.current = 0;
      scheduleViRestart(recognition);

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          const text = transcript.trim();
          if (text) {
            onFinalResultRef.current?.(text, { speaker: null });
          }
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      console.log('[BrowserSTT] error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        alert('Lỗi: Chưa cấp quyền sử dụng Microphone!');
      } else if (event.error === 'network') {
        alert('Lỗi mạng: Web Speech API yêu cầu kết nối Internet.');
      }
    };

    recognition.onend = () => {
      console.log('[BrowserSTT] onend, shouldListen:', shouldListenRef.current, 'isCurrent:', recognitionRef.current === recognition);
      if (stopResolveRef.current) {
        stopResolveRef.current();
        stopResolveRef.current = null;
        return;
      }
      if (shouldListenRef.current && recognitionRef.current === recognition) {
        try {
          recognition.start();
          scheduleViRestart(recognition);
        } catch (err) {
          console.error('[BrowserSTT] restart error:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    let recognitionStarted = false;
    const tryStartRecognition = () => {
      if (recognitionStarted) return;
      if (!shouldListenRef.current) return;
      if (recognitionRef.current !== recognition) return;
      recognitionStarted = true;
      try {
        recognition.start();
        scheduleViRestart(recognition);
        setIsListening(true);
      } catch (err) {
        console.error('[BrowserSTT] start error:', err);
      }
    };

    // Mở mic cho meter trước, rồi mới SpeechRecognition (tránh xung đột trên một số trình duyệt).
    // Timer dự phòng: nếu getUserMedia treo hoặc lỗi, vẫn gọi recognition.start() sau tối đa 2.5s.
    const fallbackTimer = setTimeout(() => tryStartRecognition(), 2500);

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (!shouldListenRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        meterStreamRef.current = stream;
        setMeterStream(stream);
      })
      .catch((err) => {
        console.warn('[BrowserSTT] Meter stream:', err?.message || err);
      })
      .finally(() => {
        clearTimeout(fallbackTimer);
        tryStartRecognition();
      });
  }, [scheduleViRestart]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      shouldListenRef.current = false;
      clearViRestartTimer();
      if (meterStreamRef.current) {
        meterStreamRef.current.getTracks().forEach((t) => t.stop());
        meterStreamRef.current = null;
      }
      setMeterStream(null);
      const rec = recognitionRef.current;
      recognitionRef.current = null;
      setIsListening(false);
      setInterimText('');

      if (rec) {
        stopResolveRef.current = resolve;
        try {
          rec.stop();
        } catch {
          stopResolveRef.current = null;
          resolve();
        }
        setTimeout(() => {
          if (stopResolveRef.current) {
            stopResolveRef.current = null;
            resolve();
          }
        }, 1000);
      } else {
        resolve();
      }
    });
  }, [clearViRestartTimer]);

  return { start, stop, isListening, interimText, audioLevel };
}
