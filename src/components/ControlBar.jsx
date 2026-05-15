import './ControlBar.css';

export default function ControlBar({
  isListening,
  sttSessionState = 'idle',
  onStart,
  onStop,
  onClear,
  onSummarize,
  onExportTranscriptMd,
  onOpenVault,
  segmentCount,
  recordCount,
}) {
  const isStarting = sttSessionState === 'starting';
  const isStopping = sttSessionState === 'stopping';
  const disableStart = isListening || isStarting || isStopping;
  const disableStop = !isListening || isStarting || isStopping;

  return (
    <div className="control-bar">
      <div className="control-left">
        {!isListening ? (
          <button className="btn btn-primary" onClick={onStart} disabled={disableStart}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {isStarting ? 'Đang khởi động...' : 'Bắt đầu'}
          </button>
        ) : (
          <button className="btn btn-stop" onClick={onStop} disabled={disableStop}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            {isStopping ? 'Đang dừng...' : 'Dừng'}
          </button>
        )}
      </div>

      <div className="control-right">
        <button
          className="btn btn-ghost"
          onClick={onClear}
          disabled={segmentCount === 0}
        >
          Xóa
        </button>
        <button
          className="btn btn-secondary"
          onClick={onSummarize}
          disabled={segmentCount === 0}
        >
          Tạo biên bản
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          onClick={onExportTranscriptMd}
          disabled={segmentCount === 0}
          title="Tải full transcript .md (toàn bộ đoạn ghi, không theo bộ lọc speaker)"
        >
          Tải full transcript .md
        </button>
        <button className="btn btn-ghost" onClick={onOpenVault}>
          Kho biên bản ({recordCount})
        </button>
      </div>
    </div>
  );
}
