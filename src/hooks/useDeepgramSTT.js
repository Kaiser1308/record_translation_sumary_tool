import { useState, useRef, useCallback, useEffect } from 'react';

export default function useDeepgramSTT(onFinalResult, meetingLang = 'en') {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [detectedSpeakers, setDetectedSpeakers] = useState(new Set());
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const shouldListenRef = useRef(false);
  const onFinalResultRef = useRef(onFinalResult);
  const lastFinalTextRef = useRef('');
  const stopResolveRef = useRef(null);
  const meetingLangRef = useRef(meetingLang);
  const processedUtteranceIdsRef = useRef(new Set());

  useEffect(() => {
    onFinalResultRef.current = onFinalResult;
  }, [onFinalResult]);

  useEffect(() => {
    meetingLangRef.current = meetingLang;
  }, [meetingLang]);

  const getSpeakerFromWords = useCallback((words) => {
    if (!words || words.length === 0) return null;
    const counts = {};
    for (const w of words) {
      if (w.speaker != null) {
        counts[w.speaker] = (counts[w.speaker] || 0) + 1;
      }
    }
    const entries = Object.entries(counts);
    if (entries.length === 0) return null;
    entries.sort((a, b) => b[1] - a[1]);
    return Number(entries[0][0]);
  }, []);

  const buildWsUrl = useCallback(() => {
    const lang = meetingLangRef.current;
    const langCode = lang === 'vi' ? 'vi' : 'en-US';
    const isVi = lang === 'vi';

    const params = new URLSearchParams({
      model: 'nova-2',
      language: langCode,
      punctuate: 'true',
      interim_results: 'true',
      smart_format: 'true',
    });

    if (!isVi) {
      params.set('diarize', 'true');
      params.set('utterances', 'true');
      params.set('utt_split', '0.8');
      params.set('min_speakers', '2');
      params.set('max_speakers', '5');
    }

    console.log('[DeepgramSTT] connect, lang =', langCode, 'diarize =', !isVi);
    return `wss://api.deepgram.com/v1/listen?${params.toString()}`;
  }, []);

  const stop = useCallback(() => {
    return new Promise((resolve) => {
      shouldListenRef.current = false;
      const ws = wsRef.current;
      const recorder = mediaRecorderRef.current;
      const stream = streamRef.current;

      wsRef.current = null;
      mediaRecorderRef.current = null;
      streamRef.current = null;
      setIsListening(false);
      setInterimText('');

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (recorder && recorder.state !== 'inactive') {
        try { recorder.stop(); } catch {}
      }
      if (ws) {
        stopResolveRef.current = resolve;
        try { ws.close(); } catch {
          stopResolveRef.current = null;
          resolve();
        }
        setTimeout(() => {
          if (stopResolveRef.current) {
            stopResolveRef.current = null;
            resolve();
          }
        }, 2000);
      } else {
        resolve();
      }
    });
  }, []);

  const handleUtteranceResults = useCallback((utterances) => {
    if (!utterances || utterances.length === 0) return;

    for (const utt of utterances) {
      const text = utt.transcript?.trim();
      if (!text) continue;

      const uttId = `${utt.start}-${utt.end}`;
      if (processedUtteranceIdsRef.current.has(uttId)) continue;
      processedUtteranceIdsRef.current.add(uttId);

      const speaker = utt.speaker != null ? Number(utt.speaker) : null;

      if (speaker != null) {
        setDetectedSpeakers((prev) => {
          if (prev.has(speaker)) return prev;
          const next = new Set(prev);
          next.add(speaker);
          return next;
        });
      }

      console.log('[DeepgramSTT] utterance speaker:', speaker, 'text:', text.slice(0, 40));
      onFinalResultRef.current?.(text, { speaker });
    }
  }, []);

  const start = useCallback(() => {
    const apiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
    if (!apiKey) {
      alert('Chưa cấu hình VITE_DEEPGRAM_API_KEY trong file .env');
      return;
    }

    shouldListenRef.current = true;
    processedUtteranceIdsRef.current = new Set();

    const connect = () => {
      const wsUrl = buildWsUrl();
      const ws = new WebSocket(wsUrl, ['token', apiKey]);

      ws.onopen = async () => {
        console.log('[DeepgramSTT] WebSocket connected');
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          streamRef.current = stream;

          const recorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
          });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0 && ws.readyState === WebSocket.OPEN) {
              ws.send(e.data);
            }
          };

          recorder.start(250);
          setIsListening(true);
        } catch (err) {
          console.error('[DeepgramSTT] Mic error:', err);
          ws.close();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'Results' && data.channel?.alternatives) {
            const isVi = meetingLangRef.current === 'vi';

            if (!isVi && data.utterances) {
              handleUtteranceResults(data.utterances);
              setInterimText('');
              return;
            }

            const alt = data.channel.alternatives[0];
            if (!alt) return;

            if (data.is_final && alt.transcript?.trim()) {
              const text = alt.transcript.trim();
              if (text === lastFinalTextRef.current) return;
              lastFinalTextRef.current = text;

              const speaker = getSpeakerFromWords(alt.words);

              if (speaker != null) {
                setDetectedSpeakers((prev) => {
                  if (prev.has(speaker)) return prev;
                  const next = new Set(prev);
                  next.add(speaker);
                  return next;
                });
              }

              console.log('[DeepgramSTT] final, speaker:', speaker, 'text:', text.slice(0, 40));
              onFinalResultRef.current?.(text, { speaker });
              setInterimText('');
            } else {
              const alt = data.channel.alternatives[0];
              if (alt) setInterimText(alt.transcript ?? '');
            }
          }
        } catch (err) {
          console.error('[DeepgramSTT] parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[DeepgramSTT] WebSocket closed, code:', event.code);
        const isCurrent = wsRef.current === ws;
        if (stopResolveRef.current) {
          stopResolveRef.current();
          stopResolveRef.current = null;
          return;
        }
        if (shouldListenRef.current && isCurrent) {
          setTimeout(connect, 1000);
        }
      };

      ws.onerror = (event) => {
        console.error('[DeepgramSTT] WebSocket error:', event);
      };

      wsRef.current = ws;
    };

    connect();
  }, [getSpeakerFromWords, buildWsUrl, handleUtteranceResults]);

  const resetSpeakers = useCallback(() => {
    setDetectedSpeakers(new Set());
  }, []);

  return { start, stop, isListening, interimText, detectedSpeakers, resetSpeakers };
}
