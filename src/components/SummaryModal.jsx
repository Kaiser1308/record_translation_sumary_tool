import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { saveAsMarkdown, saveAsTxt, getSessionDate, buildFullTranscriptMarkdown } from '../utils/exportFile';
import { MODELS } from '../utils/models';
import './SummaryModal.css';

export default function SummaryModal({
  isOpen,
  onClose,
  summary,
  isSummarizing,
  segments,
  speakerNames = {},
  translationModel,
  summaryModel,
  onSaveRecord,
  onOpenVault,
}) {
  const [renderedSummary, setRenderedSummary] = useState('');
  const [renderedFull, setRenderedFull] = useState('');
  const [modalTab, setModalTab] = useState('summary');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordDescription, setRecordDescription] = useState('');
  const [saveNotice, setSaveNotice] = useState('');

  useEffect(() => {
    if (summary) {
      try {
        const parsed = marked.parse(summary);
        if (parsed instanceof Promise) {
          parsed.then(setRenderedSummary);
        } else {
          setRenderedSummary(parsed);
        }
      } catch (err) {
        console.error('Markdown parse error:', err);
        setRenderedSummary('<p>Lỗi render văn bản markdown.</p>');
      }
    }
  }, [summary]);

  useEffect(() => {
    const md = buildFullTranscriptMarkdown(segments, speakerNames);
    try {
      const parsed = marked.parse(md);
      if (parsed instanceof Promise) {
        parsed.then(setRenderedFull);
      } else {
        setRenderedFull(parsed);
      }
    } catch (err) {
      console.error('Full script render error:', err);
      setRenderedFull('<p>Không hiển thị được bản ghi đầy đủ.</p>');
    }
  }, [segments, speakerNames]);

  useEffect(() => {
    if (!isOpen) return;
    const defaultTitle = `Biên bản ${getSessionDate()}`;
    setRecordTitle(defaultTitle);
    setRecordDescription('');
    setSaveNotice('');
    setModalTab('summary');
  }, [isOpen, summary]);

  if (!isOpen) return null;

  const handleSaveMd = () => {
    const date = getSessionDate();
    const transLabel = MODELS.find((m) => m.id === translationModel)?.label || translationModel;
    const sumLabel = MODELS.find((m) => m.id === summaryModel)?.label || summaryModel;
    saveAsMarkdown(summary, segments, date, {
      translation: transLabel,
      summary: sumLabel,
    }, speakerNames);
  };

  const handleSaveTxt = () => {
    const date = getSessionDate();
    const transLabel = MODELS.find((m) => m.id === translationModel)?.label || translationModel;
    const sumLabel = MODELS.find((m) => m.id === summaryModel)?.label || summaryModel;
    saveAsTxt(summary, segments, date, {
      translation: transLabel,
      summary: sumLabel,
    }, speakerNames);
  };

  const handleSaveRecord = () => {
    const title = recordTitle.trim();
    if (!title || !summary) return;

    onSaveRecord?.({
      title,
      description: recordDescription.trim(),
      summary,
      segments,
      speakerNames,
      translationModel,
      summaryModel,
    });
    setSaveNotice('Đã lưu vào kho biên bản.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Biên bản cuộc họp</h2>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {isSummarizing && (
            <div className="modal-loading">
              <div className="modal-spinner" />
              <p>AI đang tạo biên bản tiếng Việt...</p>
            </div>
          )}
          {!isSummarizing && summary && (
            <>
              <div className="modal-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'summary'}
                  className={`modal-tab ${modalTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setModalTab('summary')}
                >
                  Tóm tắt (AI)
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={modalTab === 'full'}
                  className={`modal-tab ${modalTab === 'full' ? 'active' : ''}`}
                  onClick={() => setModalTab('full')}
                >
                  Full script
                </button>
              </div>
              {modalTab === 'summary' ? (
                <div
                  className="summary-content"
                  dangerouslySetInnerHTML={{ __html: renderedSummary }}
                />
              ) : (
                <div
                  className="summary-content modal-full-script"
                  dangerouslySetInnerHTML={{ __html: renderedFull }}
                />
              )}
            </>
          )}
        </div>

        {!isSummarizing && summary && (
          <div className="modal-footer">
            <input
              className="record-input"
              value={recordTitle}
              onChange={(e) => setRecordTitle(e.target.value)}
              placeholder="Tên biên bản"
            />
            <input
              className="record-input"
              value={recordDescription}
              onChange={(e) => setRecordDescription(e.target.value)}
              placeholder="Mô tả ngắn (tùy chọn)"
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveRecord}
              disabled={!recordTitle.trim()}
              title="Lưu cả bản tóm tắt AI và bản ghi đầy đủ (bảng)"
            >
              Lưu vào kho
            </button>
            <button className="btn btn-secondary" onClick={onOpenVault}>
              Mở kho
            </button>
            <button className="btn btn-secondary" onClick={handleSaveMd}>
              Lưu .md
            </button>
            <button className="btn btn-secondary" onClick={handleSaveTxt}>
              Lưu .txt
            </button>
            <button className="btn btn-ghost" onClick={onClose}>
              Đóng
            </button>
          </div>
        )}
        {!isSummarizing && saveNotice && (
          <div className="save-notice">{saveNotice}</div>
        )}
      </div>
    </div>
  );
}
