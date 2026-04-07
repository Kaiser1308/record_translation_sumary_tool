import { useState, useCallback, useEffect, useRef } from 'react';
import useSTT from './hooks/useSTT';
import useTranslation from './hooks/useTranslation';
import useSummarize from './hooks/useSummarize';
import ModelSelector from './components/ModelSelector';
import StatusIndicator from './components/StatusIndicator';
import ControlBar from './components/ControlBar';
import TranscriptPanel from './components/TranscriptPanel';
import SummaryModal from './components/SummaryModal';
import RecordVault from './components/RecordVault';
import SpeakerFilter from './components/SpeakerFilter';
import { DEFAULT_TRANSLATION_MODEL, DEFAULT_SUMMARY_MODEL, MODELS } from './utils/models';

const SESSION_SEGMENTS_KEY = 'sessionSegments';
const SESSION_SUMMARY_KEY = 'sessionSummaryText';
const SESSION_LOGS_KEY = 'sessionLogs';
const SESSION_RECORDS_KEY = 'savedRecords';
const SESSION_SPEAKER_NAMES_KEY = 'speakerNames';

function getStoredValue(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function getStoredModel(key, fallback) {
  const stored = getStoredValue(key, fallback);
  const model = MODELS.find((m) => m.id === stored);
  if (!model) return fallback;
  const envMap = {
    anthropic: 'VITE_ANTHROPIC_API_KEY',
    gemini: 'VITE_GEMINI_API_KEY',
    openai: 'VITE_OPENAI_API_KEY',
    deepseek: 'VITE_DEEPSEEK_API_KEY',
    groq: 'VITE_GROQ_API_KEY',
    glm: 'VITE_GLM_API_KEY',
  };
  const envKey = envMap[model.provider];
  if (envKey && !import.meta.env[envKey]) return fallback;
  return stored;
}

function getStoredJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function timestamp() {
  const d = new Date();
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function App() {
  const [sttEngine, setSttEngine] = useState(() =>
    getStoredValue('sttEngine', 'browser')
  );
  const [translationModel, setTranslationModel] = useState(() =>
    getStoredModel('translationModel', DEFAULT_TRANSLATION_MODEL)
  );
  const [summaryModel, setSummaryModel] = useState(() =>
    getStoredModel('summaryModel', DEFAULT_SUMMARY_MODEL)
  );
  const [translationEnabled, setTranslationEnabled] = useState(() => {
    const stored = localStorage.getItem('translationEnabled');
    return stored !== null ? stored === 'true' : true;
  });

  const [segments, setSegments] = useState(() =>
    getStoredJSON(SESSION_SEGMENTS_KEY, [])
  );
  const [meetingLang, setMeetingLang] = useState(() =>
    getStoredValue('meetingLang', 'en')
  );
  const [showSummary, setShowSummary] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [summaryText, setSummaryText] = useState(() =>
    getStoredValue(SESSION_SUMMARY_KEY, '')
  );
  const [apiKeyWarning, setApiKeyWarning] = useState(false);
  const [logs, setLogs] = useState(() =>
    getStoredJSON(SESSION_LOGS_KEY, [])
  );
  const [records, setRecords] = useState(() =>
    getStoredJSON(SESSION_RECORDS_KEY, [])
  );

  // ★ Speaker diarization state
  const [speakerFilter, setSpeakerFilter] = useState(null); // null = all, Set<number> = selected
  const [speakerNames, setSpeakerNames] = useState(() =>
    getStoredJSON(SESSION_SPEAKER_NAMES_KEY, {})
  );

  const { translate } = useTranslation();
  const { summarize, isSummarizing } = useSummarize();

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const addLog = useCallback((type, message) => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), type, message, time: timestamp() }]);
  }, []);

  const updateSegment = useCallback((id, updates) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  // Refs để handleFinalResult luôn đọc giá trị mới nhất
  const translationEnabledRef = useRef(translationEnabled);
  translationEnabledRef.current = translationEnabled;
  const translationModelRef = useRef(translationModel);
  translationModelRef.current = translationModel;
  const translateRef = useRef(translate);
  translateRef.current = translate;
  const speakerFilterRef = useRef(speakerFilter);
  speakerFilterRef.current = speakerFilter;

  // ★ Callback ổn định — bổ sung speaker metadata
  const handleFinalResult = useCallback((text, meta = {}) => {
    const id = Date.now() + Math.random();
    const speaker = meta.speaker ?? null;
    const isEn = meetingLang === 'en';
    const seg = {
      id,
      en: isEn ? text : null,
      vi: !isEn ? text : null,
      skipped: false,
      error: false,
      speaker,
      timestamp: timestamp(),
      meetingLang,
    };

    // Option B: Filter chỉ áp dụng cho segments MỚI
    const filter = speakerFilterRef.current;
    if (filter !== null && speaker != null && !filter.has(speaker)) {
      // Speaker bị lọc → bỏ qua hoàn toàn, không thêm vào segments
      return;
    }

    setSegments((prev) => [...prev, seg]);
    addLog('stt', `${speaker != null ? `[S${speaker}] ` : ''}${isEn ? 'EN' : 'VI'}: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);

    if (!translationEnabledRef.current || meetingLang === 'vi') {
      updateSegment(id, { [isEn ? 'vi' : 'en']: null, skipped: true });
      return;
    }

    const currentModel = translationModelRef.current;
    const modelLabel = MODELS.find((m) => m.id === currentModel)?.label || currentModel;
    addLog('translate', `Dịch bằng ${modelLabel}...`);

    translateRef.current(text, currentModel, meetingLang)
      .then((tgt) => {
        updateSegment(id, { [isEn ? 'vi' : 'en']: tgt || null, error: !tgt });
        if (tgt) addLog('success', `${isEn ? 'VI' : 'EN'}: "${tgt.slice(0, 50)}${tgt.length > 50 ? '...' : ''}"`);
        else addLog('error', 'Dịch trả về rỗng');
      })
      .catch((err) => {
        updateSegment(id, { [isEn ? 'vi' : 'en']: null, error: true });
        addLog('error', `Lỗi dịch: ${err.message?.slice(0, 80)}`);
      });
  }, [addLog, updateSegment, meetingLang]);

  const stt = useSTT(sttEngine, handleFinalResult, meetingLang);

  // Lưu localStorage
  useEffect(() => { localStorage.setItem('sttEngine', sttEngine); }, [sttEngine]);
  useEffect(() => { localStorage.setItem('meetingLang', meetingLang); }, [meetingLang]);
  useEffect(() => { localStorage.setItem('translationModel', translationModel); }, [translationModel]);
  useEffect(() => { localStorage.setItem('summaryModel', summaryModel); }, [summaryModel]);
  useEffect(() => { localStorage.setItem('translationEnabled', String(translationEnabled)); }, [translationEnabled]);
  useEffect(() => { localStorage.setItem(SESSION_SEGMENTS_KEY, JSON.stringify(segments)); }, [segments]);
  useEffect(() => { localStorage.setItem(SESSION_SUMMARY_KEY, summaryText); }, [summaryText]);
  useEffect(() => { localStorage.setItem(SESSION_LOGS_KEY, JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem(SESSION_SPEAKER_NAMES_KEY, JSON.stringify(speakerNames)); }, [speakerNames]);

  // Kiểm tra API key theo provider
  useEffect(() => {
    if (!translationEnabled) { setApiKeyWarning(false); return; }
    const model = MODELS.find(m => m.id === translationModel);
    let keyMissing = false;
    let envName = '';
    if (model) {
      if (model.provider === 'anthropic') { envName = 'VITE_ANTHROPIC_API_KEY'; keyMissing = !import.meta.env.VITE_ANTHROPIC_API_KEY; }
      else if (model.provider === 'gemini') { envName = 'VITE_GEMINI_API_KEY'; keyMissing = !import.meta.env.VITE_GEMINI_API_KEY; }
      else if (model.provider === 'openai') { envName = 'VITE_OPENAI_API_KEY'; keyMissing = !import.meta.env.VITE_OPENAI_API_KEY; }
      else if (model.provider === 'deepseek') { envName = 'VITE_DEEPSEEK_API_KEY'; keyMissing = !import.meta.env.VITE_DEEPSEEK_API_KEY; }
      else if (model.provider === 'groq') { envName = 'VITE_GROQ_API_KEY'; keyMissing = !import.meta.env.VITE_GROQ_API_KEY; }
      else if (model.provider === 'glm') { envName = 'VITE_GLM_API_KEY'; keyMissing = !import.meta.env.VITE_GLM_API_KEY; }
    }
    setApiKeyWarning(keyMissing);
    if (keyMissing) addLog('warn', `Chưa cấu hình ${envName}`);
    else addLog('info', `API key cho ${model?.provider} đã sẵn sàng`);
  }, [translationModel, translationEnabled, addLog]);

  useEffect(() => {
    if (stt.isListening) addLog('stt', `Bắt đầu nghe (${sttEngine === 'deepgram' ? 'Deepgram' : 'Web Speech'})`);
  }, [stt.isListening]);

  const handleStart = useCallback(() => {
    stt.start();
  }, [stt]);

  const handleStop = useCallback(() => {
    stt.stop();
    addLog('stt', 'Đã dừng nghe');
  }, [stt, addLog]);

  const handleClear = useCallback(() => {
    setSegments([]);
    setSummaryText('');
    setLogs([]);
    setSpeakerFilter(null);
    stt.resetSpeakers?.();
    localStorage.removeItem(SESSION_SEGMENTS_KEY);
    localStorage.removeItem(SESSION_SUMMARY_KEY);
    localStorage.removeItem(SESSION_LOGS_KEY);
  }, [stt]);

  // ★ Tóm tắt chỉ segments hiển thị (theo filter) — Option A
  const handleSummarize = useCallback(async () => {
    setShowSummary(true);
    setSummaryText('');
    const modelLabel = MODELS.find((m) => m.id === summaryModel)?.label || summaryModel;
    addLog('summary', `Đang tạo biên bản bằng ${modelLabel}...`);
    try {
      // Filter segments theo speaker filter trước khi tóm tắt
      let segsToSummarize = segmentsRef.current;
      if (speakerFilter !== null) {
        segsToSummarize = segsToSummarize.filter(
          (s) => s.speaker == null || speakerFilter.has(s.speaker)
        );
      }
      const result = await summarize(segsToSummarize, summaryModel);
      setSummaryText(result);
      addLog('success', 'Đã tạo biên bản');
    } catch (err) {
      setSummaryText('Lỗi khi tạo biên bản: ' + err.message);
      addLog('error', `Lỗi tạo biên bản: ${err.message?.slice(0, 80)}`);
    }
  }, [summarize, summaryModel, addLog, speakerFilter]);

  const handleCloseSummary = useCallback(() => {
    setShowSummary(false);
  }, []);

  const handleOpenVault = useCallback(() => {
    setShowVault(true);
  }, []);

  const handleCloseVault = useCallback(() => {
    setShowVault(false);
  }, []);

  const handleSaveRecord = useCallback((payload) => {
    const now = new Date().toISOString();
    const record = {
      id: Date.now() + Math.random(),
      title: payload.title,
      description: payload.description || '',
      summary: payload.summary,
      segments: payload.segments || [],
      translationModel: payload.translationModel,
      summaryModel: payload.summaryModel,
      createdAt: now,
      updatedAt: now,
    };
    setRecords((prev) => [record, ...prev]);
    addLog('success', `Đã lưu biên bản: ${record.title}`);
  }, [addLog]);

  const handleDeleteRecord = useCallback((id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    addLog('info', 'Đã xóa 1 biên bản khỏi kho');
  }, [addLog]);

  const handleUpdateRecord = useCallback((id, updates) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, ...updates, updatedAt: new Date().toISOString() }
          : r
      )
    );
    addLog('info', 'Đã cập nhật biên bản');
  }, [addLog]);

  const handleTranslateSegment = useCallback((id, text, lang) => {
    const isEn = lang === 'en';
    // Reset state để hiện loading
    updateSegment(id, { [isEn ? 'vi' : 'en']: null, skipped: false, error: false });
    const modelLabel = MODELS.find((m) => m.id === translationModel)?.label || translationModel;
    addLog('translate', `Dịch lại bằng ${modelLabel}...`);

    translate(text, translationModel, lang)
      .then((tgt) => {
        updateSegment(id, { [isEn ? 'vi' : 'en']: tgt || null, error: !tgt });
        if (tgt) addLog('success', `${isEn ? 'VI' : 'EN'}: "${tgt.slice(0, 50)}${tgt.length > 50 ? '...' : ''}"`);
      })
      .catch((err) => {
        updateSegment(id, { [isEn ? 'vi' : 'en']: null, error: true });
        addLog('error', `Lỗi dịch: ${err.message?.slice(0, 80)}`);
      });
  }, [translationModel, translate, updateSegment, addLog]);

  // Chỉ hiện SpeakerFilter khi dùng Deepgram
  const showSpeakerFilter = sttEngine === 'deepgram';

  return (
    <div className="app">
      <div className="app-main">
        <header className="app-header">
          <div className="header-top">
            <div className="brand">
              <h1 className="brand-title">Speech Translator</h1>
              <span className="brand-sub">Transcript & dịch realtime</span>
            </div>
            <StatusIndicator isListening={stt.isListening} />
          </div>
          <ModelSelector
            sttEngine={sttEngine}
            setSttEngine={setSttEngine}
            translationModel={translationModel}
            setTranslationModel={setTranslationModel}
            summaryModel={summaryModel}
            setSummaryModel={setSummaryModel}
            translationEnabled={translationEnabled}
            setTranslationEnabled={setTranslationEnabled}
            isTranslating={stt.isListening}
            isSummarizing={isSummarizing}
            meetingLang={meetingLang}
            setMeetingLang={setMeetingLang}
          />
        </header>

        {apiKeyWarning && translationEnabled && (
          <div className="api-warning">
            Chưa cấu hình API key. Chạy transcript vẫn hoạt động, nhưng dịch sẽ lỗi.{' '}
            <span className="api-warning-hint">
              Copy <code>.env.example</code> → <code>.env</code> và điền key.
            </span>
          </div>
        )}

        {showSpeakerFilter && (
          <SpeakerFilter
            detectedSpeakers={stt.detectedSpeakers}
            speakerFilter={speakerFilter}
            setSpeakerFilter={setSpeakerFilter}
            speakerNames={speakerNames}
            setSpeakerNames={setSpeakerNames}
            segments={segments}
          />
        )}

        <ControlBar
          isListening={stt.isListening}
          onStart={handleStart}
          onStop={handleStop}
          onClear={handleClear}
          onSummarize={handleSummarize}
          onOpenVault={handleOpenVault}
          segmentCount={segments.length}
          recordCount={records.length}
        />

        <TranscriptPanel 
          segments={segments} 
          interimText={stt.interimText} 
          onTranslate={handleTranslateSegment}
          speakerNames={speakerNames}
        />
      </div>

      <SummaryModal
        isOpen={showSummary}
        onClose={handleCloseSummary}
        summary={summaryText}
        isSummarizing={isSummarizing}
        segments={segments}
        translationModel={translationModel}
        summaryModel={summaryModel}
        onSaveRecord={handleSaveRecord}
        onOpenVault={handleOpenVault}
      />
      <RecordVault
        isOpen={showVault}
        onClose={handleCloseVault}
        records={records}
        onDelete={handleDeleteRecord}
        onUpdate={handleUpdateRecord}
      />
    </div>
  );
}
