import { useState, useEffect, useRef } from 'react';

/**
 * Theo dõi mức âm thanh từ MediaStream (0–1), dùng cho thanh meter.
 */
export default function useAudioLevel(stream) {
  const [level, setLevel] = useState(0);
  const smoothRef = useRef(0);

  useEffect(() => {
    if (!stream) {
      smoothRef.current = 0;
      setLevel(0);
      return;
    }

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.65;
    source.connect(analyser);

    const freq = new Uint8Array(analyser.frequencyBinCount);
    let raf = 0;
    /** Tránh setState mỗi frame — re-render App liên tục có thể làm Web Speech API / STT lỗi. */
    let lastUiEmit = 0;
    const UI_INTERVAL_MS = 66;

    const tick = async () => {
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch {
          /* ignore */
        }
      }
      analyser.getByteFrequencyData(freq);
      let sum = 0;
      for (let i = 0; i < freq.length; i++) sum += freq[i];
      const raw = (sum / freq.length / 255) ** 0.65;
      const boosted = Math.min(1, raw * 2.2);
      smoothRef.current = smoothRef.current * 0.72 + boosted * 0.28;
      const now = performance.now();
      if (now - lastUiEmit >= UI_INTERVAL_MS) {
        lastUiEmit = now;
        setLevel(smoothRef.current);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      try {
        source.disconnect();
        analyser.disconnect();
      } catch {
        /* ignore */
      }
      audioCtx.close().catch(() => {});
      smoothRef.current = 0;
      setLevel(0);
    };
  }, [stream]);

  return level;
}
