import { getSpeakerColor, getSpeakerLabel } from '../utils/speakerColors';
import './SegmentItem.css';

export default function SegmentItem({ segment, onTranslate, speakerNames }) {
  const { id, en, vi, skipped, error, speaker, meetingLang = 'en' } = segment;

  const isEn = meetingLang === 'en';
  const srcText = isEn ? en : vi;
  const tgtText = isEn ? vi : en;

  return (
    <div className="segment-item">
      <div className="segment-row">
        <p className={`segment-${isEn ? 'en' : 'vi'}`}>
          {speaker != null && (
            <span
              className="speaker-badge"
              style={{
                '--badge-color': getSpeakerColor(speaker),
              }}
              title={getSpeakerLabel(speaker, speakerNames)}
            >
              {getSpeakerLabel(speaker, speakerNames)}
            </span>
          )}
          {srcText}
        </p>
        {!tgtText && (skipped || error) && (
          <button
            className="btn-translate-inline"
            onClick={() => onTranslate(id, srcText, meetingLang)}
          >
            Dịch
          </button>
        )}
      </div>
      {tgtText && <p className={`segment-${isEn ? 'vi' : 'en'}`}>{tgtText}</p>}
      {!tgtText && !skipped && !error && (
        <div className="segment-loading">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      )}
      {error && <p className="segment-error">(không dịch được)</p>}
    </div>
  );
}

