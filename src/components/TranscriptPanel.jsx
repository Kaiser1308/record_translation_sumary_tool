import { useRef, useEffect, useMemo } from 'react';
import SegmentItem from './SegmentItem';
import './TranscriptPanel.css';

const MAX_RENDER = 200;

/**
 * Gộp các segments liên tiếp cùng speaker thành 1 block hiển thị dạng đoạn văn.
 * Chỉ gộp khi cả 2 segment cùng speaker VÀ cùng trạng thái dịch (cả hai đều có vi hoặc đều không).
 */
function mergeConsecutiveSpeakerSegments(segments) {
  if (segments.length === 0) return [];

  const merged = [];
  let current = null;

  for (const seg of segments) {
    const canMerge =
      current &&
      current.speaker === seg.speaker &&
      // Chỉ merge khi cùng trạng thái dịch
      !!current.vi === !!seg.vi &&
      current.skipped === seg.skipped &&
      !current.error &&
      !seg.error;

    if (canMerge) {
      // Gộp text EN vào đoạn văn
      current.en = `${current.en} ${seg.en}`;
      // Gộp text VI
      if (current.vi && seg.vi) {
        current.vi = `${current.vi} ${seg.vi}`;
      }
      // Theo dõi các segment ID gốc (để count words chính xác)
      current._mergedIds.push(seg.id);
    } else {
      // Tạo block mới
      current = { ...seg, _mergedIds: [seg.id] };
      merged.push(current);
    }
  }

  return merged;
}

export default function TranscriptPanel({ segments, interimText, onTranslate, speakerNames }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [segments, interimText]);

  const visibleSegments = segments.slice(-MAX_RENDER);

  // Gộp segments liên tiếp cùng speaker thành đoạn văn
  const displaySegments = useMemo(
    () => mergeConsecutiveSpeakerSegments(visibleSegments),
    [visibleSegments]
  );

  return (
    <div className="transcript-panel">
      {segments.length === 0 && !interimText && (
        <div className="transcript-empty">
          Nhấn <strong>Bắt đầu</strong> để bắt đầu nghe và dịch
        </div>
      )}
      {displaySegments.map((seg) => (
        <SegmentItem
          key={seg.id}
          segment={seg}
          onTranslate={onTranslate}
          speakerNames={speakerNames}
        />
      ))}
      {interimText && (
        <div className="interim-text">{interimText}</div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
