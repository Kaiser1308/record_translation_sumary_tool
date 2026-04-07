import './StatusIndicator.css';

export default function StatusIndicator({ isListening }) {
  return (
    <div className={`status-indicator ${isListening ? 'status-active' : 'status-idle'}`}>
      <span className="status-dot" />
      <span className="status-text">
        {isListening ? 'Đang nghe...' : 'Sẵn sàng'}
      </span>
    </div>
  );
}
