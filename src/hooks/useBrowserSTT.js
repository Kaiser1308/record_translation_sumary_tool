import { useState, useRef, useCallback, useEffect } from 'react';

const VI_RESTART_TIMEOUT = 5000;
const MAX_CONSECUTIVE_RESTARTS = 3;

export default function useBrowserSTT(onFinalResult, meetingLang = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
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

    const recognition = new SpeechRecognition();
    recognition.lang = meetingLangRef.current === 'vi' ? 'vi-VN' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    console.log('[BrowserSTT] start, lang =', recognition.lang);

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
    recognition.start();
    scheduleViRestart(recognition);
    setIsListening(true);
  }, [scheduleViRestart]);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      shouldListenRef.current = false;
      clearViRestartTimer();
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

  return { start, stop, isListening, interimText };
}
