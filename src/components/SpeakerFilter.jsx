import { useState } from 'react';
import { getSpeakerColor, getSpeakerLabel } from '../utils/speakerColors';
import './SpeakerFilter.css';

export default function SpeakerFilter({
  detectedSpeakers,
  speakerFilter,
  setSpeakerFilter,
  speakerNames,
  setSpeakerNames,
  segments,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const speakers = Array.from(detectedSpeakers).sort((a, b) => a - b);

  if (speakers.length === 0) return null;

  // Count words per speaker from segments
  const wordCounts = {};
  for (const seg of segments) {
    if (seg.speaker != null) {
      const count = seg.en?.split(/\s+/).length || 0;
      wordCounts[seg.speaker] = (wordCounts[seg.speaker] || 0) + count;
    }
  }

  const isSpeakerActive = (id) => {
    if (speakerFilter === null) return true; // null = all active
    return speakerFilter.has(id);
  };

  const toggleSpeaker = (id) => {
    if (speakerFilter === null) {
      // Currently all selected → create filter with all EXCEPT this one
      const newFilter = new Set(speakers.filter((s) => s !== id));
      setSpeakerFilter(newFilter);
    } else {
      const next = new Set(speakerFilter);
      if (next.has(id)) {
        next.delete(id);
        // If nothing selected, keep the empty set (filter all)
      } else {
        next.add(id);
      }
      // If all speakers re-selected → reset to null
      if (next.size === speakers.length) {
        setSpeakerFilter(null);
      } else {
        setSpeakerFilter(next);
      }
    }
  };

  const selectAll = () => setSpeakerFilter(null);
  const selectNone = () => setSpeakerFilter(new Set());

  const startRename = (e, id) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(speakerNames[id] || '');
  };

  const commitRename = () => {
    if (editingId != null) {
      const name = editValue.trim();
      setSpeakerNames((prev) => {
        const next = { ...prev };
        if (name) {
          next[editingId] = name;
        } else {
          delete next[editingId];
        }
        return next;
      });
    }
    setEditingId(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') setEditingId(null);
  };

  return (
    <div className="speaker-filter">
      <div className="speaker-filter-header">
        <span className="speaker-filter-title">
          <span className="icon">🎙</span> Người nói ({speakers.length})
        </span>
        <div className="speaker-filter-actions">
          <button onClick={selectAll}>Tất cả</button>
          <button onClick={selectNone}>Không</button>
        </div>
      </div>

      <div className="speaker-list">
        {speakers.map((id) => {
          const color = getSpeakerColor(id);
          const active = isSpeakerActive(id);
          const label = getSpeakerLabel(id, speakerNames);
          const count = wordCounts[id] || 0;

          return (
            <div
              key={id}
              className={`speaker-chip ${active ? 'active' : ''}`}
              style={{ '--speaker-color': color }}
              onClick={() => toggleSpeaker(id)}
            >
              <span className="speaker-dot" style={{ background: color }} />
              {editingId === id ? (
                <input
                  className="speaker-rename-input"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  placeholder="Tên..."
                />
              ) : (
                <>
                  <span className="speaker-chip-label">{label}</span>
                  <button
                    className="speaker-rename-btn"
                    onClick={(e) => startRename(e, id)}
                    title="Đổi tên"
                  >
                    ✏️
                  </button>
                </>
              )}
              <span className="speaker-word-count">{count}w</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
