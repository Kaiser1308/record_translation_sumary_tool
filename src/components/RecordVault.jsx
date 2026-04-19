import { useMemo, useState, useEffect } from 'react';
import { marked } from 'marked';
import { getRecordFullScript } from '../utils/exportFile';
import './RecordVault.css';

function formatDateTime(iso) {
  try {
    return new Date(iso).toLocaleString('vi-VN');
  } catch {
    return iso;
  }
}

export default function RecordVault({
  isOpen,
  onClose,
  records,
  onDelete,
  onUpdate,
}) {
  const [activeId, setActiveId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [vaultTab, setVaultTab] = useState('summary');
  const [renderedSummaryHtml, setRenderedSummaryHtml] = useState('');
  const [renderedFullHtml, setRenderedFullHtml] = useState('');

  const activeRecord = useMemo(() => {
    if (!records.length) return null;
    const targetId = activeId ?? records[0].id;
    return records.find((r) => r.id === targetId) || records[0];
  }, [records, activeId]);

  useEffect(() => {
    if (!activeRecord?.summary) {
      setRenderedSummaryHtml('');
      return;
    }
    try {
      const parsed = marked.parse(activeRecord.summary);
      if (parsed instanceof Promise) {
        parsed.then(setRenderedSummaryHtml);
      } else {
        setRenderedSummaryHtml(parsed);
      }
    } catch {
      setRenderedSummaryHtml('<p>Lỗi render markdown.</p>');
    }
  }, [activeRecord]);

  useEffect(() => {
    if (!activeRecord) {
      setRenderedFullHtml('');
      return;
    }
    const md = getRecordFullScript(activeRecord);
    try {
      const parsed = marked.parse(md);
      if (parsed instanceof Promise) {
        parsed.then(setRenderedFullHtml);
      } else {
        setRenderedFullHtml(parsed);
      }
    } catch {
      setRenderedFullHtml('<p>Lỗi hiển thị bản ghi đầy đủ.</p>');
    }
  }, [activeRecord]);

  useEffect(() => {
    if (activeRecord) setVaultTab('summary');
  }, [activeRecord?.id]);

  if (!isOpen) return null;

  const beginEdit = (record) => {
    setEditingId(record.id);
    setTitleDraft(record.title || '');
    setDescriptionDraft(record.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitleDraft('');
    setDescriptionDraft('');
  };

  const saveEdit = (id) => {
    const title = titleDraft.trim();
    if (!title) return;
    onUpdate(id, {
      title,
      description: descriptionDraft.trim(),
    });
    cancelEdit();
  };

  return (
    <div className="vault-overlay" onClick={onClose}>
      <div className="vault-content" onClick={(e) => e.stopPropagation()}>
        <div className="vault-header">
          <h2 className="vault-title">Kho biên bản</h2>
          <button className="vault-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="vault-body">
          <div className="vault-list">
            {records.length === 0 && (
              <div className="vault-empty">Chưa có biên bản nào được lưu.</div>
            )}

            {records.map((record) => (
              <div
                key={record.id}
                className={`vault-item ${activeRecord?.id === record.id ? 'active' : ''}`}
                onClick={() => setActiveId(record.id)}
              >
                {editingId === record.id ? (
                  <div className="vault-edit">
                    <input
                      className="vault-input"
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      placeholder="Tên biên bản"
                    />
                    <textarea
                      className="vault-textarea"
                      rows={3}
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      placeholder="Mô tả ngắn"
                    />
                    <div className="vault-item-actions">
                      <button className="btn btn-secondary" onClick={() => saveEdit(record.id)}>
                        Lưu
                      </button>
                      <button className="btn btn-ghost" onClick={cancelEdit}>
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="vault-item-top">
                      <h3>{record.title}</h3>
                      <span>{formatDateTime(record.createdAt)}</span>
                    </div>
                    {record.description && <p className="vault-desc">{record.description}</p>}
                    <div className="vault-item-actions">
                      <button className="btn btn-secondary" onClick={() => beginEdit(record)}>
                        Sửa
                      </button>
                      <button className="btn btn-ghost vault-delete" onClick={() => onDelete(record.id)}>
                        Xóa
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="vault-preview">
            {!activeRecord && <div className="vault-empty">Chọn biên bản để xem chi tiết.</div>}
            {activeRecord && (
              <>
                <div className="vault-preview-meta">
                  <h3>{activeRecord.title}</h3>
                  {activeRecord.description && <p>{activeRecord.description}</p>}
                </div>
                <div className="vault-preview-tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={vaultTab === 'summary'}
                    className={`vault-tab ${vaultTab === 'summary' ? 'active' : ''}`}
                    onClick={() => setVaultTab('summary')}
                  >
                    Tóm tắt (AI)
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={vaultTab === 'full'}
                    className={`vault-tab ${vaultTab === 'full' ? 'active' : ''}`}
                    onClick={() => setVaultTab('full')}
                  >
                    Full script
                  </button>
                </div>
                <div
                  className="vault-preview-summary"
                  dangerouslySetInnerHTML={{
                    __html: vaultTab === 'summary' ? renderedSummaryHtml : renderedFullHtml,
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
