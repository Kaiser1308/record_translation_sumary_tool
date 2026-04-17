import './AudioMeter.css';

export default function AudioMeter({ isActive, level = 0 }) {
  const pct = Math.round(Math.min(100, Math.max(0, level * 100)));

  return (
    <div className="audio-meter" aria-label="Mức tín hiệu microphone">
      <div className="audio-meter-track">
        <div
          className="audio-meter-fill"
          style={{ width: `${isActive ? pct : 0}%` }}
        />
      </div>
      <span className="audio-meter-label">
        {isActive ? 'Đang nhận âm thanh' : 'Mic tắt'}
      </span>
    </div>
  );
}
