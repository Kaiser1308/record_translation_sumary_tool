import { useRef, useEffect, useMemo } from 'react';
import SegmentItem from './SegmentItem';
import './TranscriptPanel.css';

const MAX_RENDER = 200;

/** Nối hai trường transcript (có thể null) — tránh `${null}` → chuỗi "null". */
function mergeSegmentTextField(a, b) {
  const parts = [a, b]
    .filter((x) => x != null && String(x).trim() !== '')
    .map((x) => String(x).trim());
  if (parts.length === 0) return null;
  return parts.join(' ');
}

/**
 * Gộp các segments liên tiếp cùng speaker thành 1 block hiển thị dạng đoạn văn.
 * Chỉ gộp khi cả 2 segment cùng speaker VÀ cùng trạng thái dịch (cả hai đều có vi hoặc đều không).
 */
function mergeConsecutiveSpeakerSegments(segments) {
  if (segments.length === 0) return [];

  const merged = [];
  let current = null;

  for (const seg of segments) {
    const targetField = seg.meetingLang === 'vi' ? 'en' : 'vi';
    const currentTargetField = current?.meetingLang === 'vi' ? 'en' : 'vi';
    const hasTargetText = (item, field) => !!item?.[field];
    const canMerge =
      current &&
      current.meetingLang === seg.meetingLang &&
      current.speaker === seg.speaker &&
      // Chỉ merge khi cùng trạng thái dịch ở ngôn ngữ đích của phiên họp.
      hasTargetText(current, currentTargetField) === hasTargetText(seg, targetField) &&
      current.skipped === seg.skipped &&
      !current.error &&
      !seg.error;

    if (canMerge) {
      current.en = mergeSegmentTextField(current.en, seg.en);
      current.vi = mergeSegmentTextField(current.vi, seg.vi);
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
