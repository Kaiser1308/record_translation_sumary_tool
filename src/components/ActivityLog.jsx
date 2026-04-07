import { useEffect, useRef } from 'react';
import './ActivityLog.css';

export default function ActivityLog({ logs }) {
  const logBodyRef = useRef(null);

  useEffect(() => {
    const el = logBodyRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs]);

  return (
    <aside className="activity-log">
      <div className="log-header">
        <span className="log-title">Trạng thái</span>
        <span className="log-count">{logs.length}</span>
      </div>
      <div ref={logBodyRef} className="log-body">
        {logs.length === 0 && (
          <div className="log-empty">Chưa có hoạt động</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`log-entry log-${log.type}`}>
            <span className="log-time">{log.time}</span>
            <span className={`log-dot log-dot-${log.type}`} />
            <span className="log-msg">{log.message}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}
