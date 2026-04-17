import { useCallback, useEffect, useRef } from 'react';
import useBrowserSTT from './useBrowserSTT';
import useDeepgramSTT from './useDeepgramSTT';
import useGroqSTT from './useGroqSTT';

const EMPTY_SET = new Set();

export default function useSTT(engine, onFinalResult, meetingLang) {
  const browserSTT = useBrowserSTT(onFinalResult, meetingLang);
  const deepgramSTT = useDeepgramSTT(onFinalResult, meetingLang);
  const groqSTT = useGroqSTT(onFinalResult, meetingLang);

  useEffect(() => {
    if (engine === 'deepgram') {
      browserSTT.stop();
      groqSTT.stop();
    } else if (engine === 'groq') {
      browserSTT.stop();
      deepgramSTT.stop();
    } else {
      deepgramSTT.stop();
      groqSTT.stop();
    }
  }, [engine]);

  const active = engine === 'deepgram' ? deepgramSTT : (engine === 'groq' ? groqSTT : browserSTT);
  const activeRef = useRef(active);
  activeRef.current = active;

  const shouldListenRef = useRef(false);

  useEffect(() => {
    if (shouldListenRef.current) {
      let cancelled = false;
      activeRef.current.stop().then(() => {
        if (!cancelled && shouldListenRef.current) {
          activeRef.current.start();
        }
      });
      return () => { cancelled = true; };
    }
  }, [meetingLang]);

  const start = useCallback(() => {
    shouldListenRef.current = true;
    activeRef.current.start();
  }, []);

  const stop = useCallback(() => {
    shouldListenRef.current = false;
    activeRef.current.stop();
  }, []);

  return {
    start,
    stop,
    isListening: active.isListening,
    interimText: active.interimText,
    detectedSpeakers: active.detectedSpeakers || EMPTY_SET,
    resetSpeakers: active.resetSpeakers || (() => {}),
    audioLevel: active.audioLevel ?? 0,
  };
}
