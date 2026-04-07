import './ModelSelector.css';
import { GROUPED_MODELS, STT_ENGINES } from '../utils/models';

export default function ModelSelector({
  sttEngine,
  setSttEngine,
  translationModel,
  setTranslationModel,
  summaryModel,
  setSummaryModel,
  translationEnabled,
  setTranslationEnabled,
  isTranslating,
  isSummarizing,
  meetingLang,
  setMeetingLang,
}) {
  const handleSttChange = (e) => {
    setSttEngine(e.target.value);
  };

  const handleTranslationModelChange = (e) => {
    setTranslationModel(e.target.value);
  };

  const handleSummaryModelChange = (e) => {
    setSummaryModel(e.target.value);
  };

  const toggleTranslation = () => {
    setTranslationEnabled((prev) => !prev);
  };

  const isVi = meetingLang === 'vi';
  const effectiveEnabled = translationEnabled && !isVi;

  return (
    <div className="model-selector">
      <div className="selector-group">
        <label className="selector-label">Ngôn ngữ họp</label>
        <select
          value={meetingLang}
          onChange={(e) => setMeetingLang(e.target.value)}
          className="selector-dropdown"
        >
          <option value="en">Tiếng Anh</option>
          <option value="vi">Tiếng Việt</option>
        </select>
      </div>

      <div className="selector-group">
        <label className="selector-label">Nhận diện</label>
        <select
          value={sttEngine}
          onChange={handleSttChange}
          className="selector-dropdown"
        >
          {STT_ENGINES.map(engine => (
            <option key={engine.id} value={engine.id}>{engine.label}</option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label className="selector-label">Dịch</label>
        <select
          value={translationModel}
          onChange={handleTranslationModelChange}
          className="selector-dropdown"
          disabled={isTranslating}
        >
          {GROUPED_MODELS.map(group => (
            <optgroup key={group.provider} label={group.label}>
              {group.options.map(model => (
                <option key={model.id} value={model.id}>{model.label} — {model.note}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          className={`toggle-btn ${effectiveEnabled ? 'toggle-on' : 'toggle-off'}`}
          onClick={toggleTranslation}
          title={effectiveEnabled ? 'Tắt tự dịch' : 'Bật tự dịch'}
          disabled={isVi}
        >
          <span className="toggle-dot" />
          {effectiveEnabled ? 'Tự dịch' : 'Thủ công'}
        </button>
      </div>

      <div className="selector-group">
        <label className="selector-label">Tóm tắt</label>
        <select
          value={summaryModel}
          onChange={handleSummaryModelChange}
          className="selector-dropdown"
          disabled={isSummarizing}
        >
          {GROUPED_MODELS.map(group => (
            <optgroup key={group.provider} label={group.label}>
              {group.options.map(model => (
                <option key={model.id} value={model.id}>{model.label} — {model.note}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}
