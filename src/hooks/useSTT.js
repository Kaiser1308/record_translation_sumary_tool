import { useCallback, useEffect, useRef, useState } from 'react';
import useBrowserSTT from './useBrowserSTT';
import useDeepgramSTT from './useDeepgramSTT';
import useGroqSTT from './useGroqSTT';

const EMPTY_SET = new Set();

export default function useSTT(engine, onFinalResult, meetingLang) {
  const [sessionState, setSessionState] = useState('idle');
  const [sessionId, setSessionId] = useState(0);
  const sessionStateRef = useRef('idle');
  const shouldListenRef = useRef(false);
  const sessionSeqRef = useRef(0);
  const activeSessionIdRef = useRef(0);
  const operationLockRef = useRef(false);

  function updateSessionState(newState) {
    sessionStateRef.current = newState;
    setSessionState(newState);
  }
  const onFinalResultRef = useRef(onFinalResult);

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  const guardedOnFinalResult = useCallback((text, meta = {}) => {
    const incomingSessionId = meta.sessionId ?? activeSessionIdRef.current;
    if (!shouldListenRef.current) return;
    if (!incomingSessionId || incomingSessionId !== activeSessionIdRef.current) return;
    onFinalResultRef.current?.(text, { ...meta, sessionId: incomingSessionId });
  }, []);

  const browserSTT = useBrowserSTT(guardedOnFinalResult, meetingLang);
  const deepgramSTT = useDeepgramSTT(guardedOnFinalResult, meetingLang);
  const groqSTT = useGroqSTT(guardedOnFinalResult, meetingLang);

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

  useEffect(() => {
    if (shouldListenRef.current) {
      let cancelled = false;
      updateSessionState('starting');
      activeRef.current.stop().then(() => {
        if (!cancelled && shouldListenRef.current) {
          Promise.resolve(activeRef.current.start())
            .then(() => {
              if (!cancelled && shouldListenRef.current) updateSessionState('listening');
            })
            .catch(() => {
              if (!cancelled) updateSessionState('error');
            });
        }
      });
      return () => { cancelled = true; };
    }
  }, [meetingLang]);

  const start = useCallback(async () => {
    if (operationLockRef.current) return { ok: false, errorCode: 'OPERATION_LOCKED' };
    if (sessionStateRef.current === 'starting' || sessionStateRef.current === 'listening') {
      return { ok: false, errorCode: 'ALREADY_LISTENING' };
    }
    operationLockRef.current = true;
    updateSessionState('starting');
    shouldListenRef.current = true;
    const nextSessionId = ++sessionSeqRef.current;
    activeSessionIdRef.current = nextSessionId;
    setSessionId(nextSessionId);
    try {
      await Promise.resolve(activeRef.current.start());
      if (shouldListenRef.current && activeSessionIdRef.current === nextSessionId) {
        updateSessionState('listening');
        return { ok: true, sessionId: nextSessionId };
      }
      updateSessionState('idle');
      return { ok: false, errorCode: 'START_CANCELLED' };
    } catch (err) {
      updateSessionState('error');
      shouldListenRef.current = false;
      return { ok: false, errorCode: err?.message || 'ENGINE_START_FAIL' };
    } finally {
      operationLockRef.current = false;
    }
  }, []);

  const stop = useCallback(async () => {
    if (operationLockRef.current) return { ok: false, errorCode: 'OPERATION_LOCKED' };
    if (sessionStateRef.current === 'idle' || sessionStateRef.current === 'stopping') return { ok: false, errorCode: 'ALREADY_STOPPED' };
    operationLockRef.current = true;
    updateSessionState('stopping');
    shouldListenRef.current = false;
    activeSessionIdRef.current = 0;
    setSessionId(0);
    try {
      await Promise.resolve(activeRef.current.stop());
      updateSessionState('idle');
      return { ok: true };
    } catch {
      updateSessionState('error');
      return { ok: false, errorCode: 'STOP_FAIL' };
    } finally {
      operationLockRef.current = false;
    }
  }, []);

  return {
    start,
    stop,
    sessionState,
    sessionId,
    isListening: active.isListening,
    interimText: active.interimText,
    detectedSpeakers: active.detectedSpeakers || EMPTY_SET,
    resetSpeakers: active.resetSpeakers || (() => {}),
    audioLevel: active.audioLevel ?? 0,
  };
}
