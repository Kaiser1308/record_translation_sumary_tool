import { getSpeakerLabel } from './speakerColors';

export function saveAsMarkdown(summary, segments, sessionDate, modelInfo, speakerNames = {}) {
  const modelLine = modelInfo
    ? `\nDịch bằng: ${modelInfo.translation} | Tóm tắt bằng: ${modelInfo.summary}\n`
    : '';
  const fullTable = buildMarkdownFullTable(segments, speakerNames);

  const content =
    `# Biên bản cuộc họp — ${sessionDate}\n${modelLine}\n${summary}\n\n---\n\n## Bảng ghi đầy đủ\n\n${fullTable}\n`;

  downloadFile(`bien-ban_${sessionDate}.md`, content, 'text/markdown');
}

export function saveAsTxt(summary, segments, sessionDate, modelInfo, speakerNames = {}) {
  const plain = summary
    .replace(/#{1,3} /g, '')
    .replace(/\*\*/g, '');
  const modelLine = modelInfo
    ? `Dịch bằng: ${modelInfo.translation} | Tóm tắt bằng: ${modelInfo.summary}`
    : '';
  const fullTable = buildTextFullTable(segments, speakerNames);

  const content =
    `BIEN BAN CUOC HOP — ${sessionDate}\n${'='.repeat(40)}\n${modelLine}\n\n${plain}\n\n${'='.repeat(
      40
    )}\nBANG GHI DAY DU\n\n${fullTable}\n`;

  downloadFile(`bien-ban_${sessionDate}.txt`, content, 'text/plain');
}

export function buildMarkdownFullTable(segments, speakerNames = {}) {
  const header = '| Thời gian | Người nói | EN | VI |\n|---|---|---|---|';
  const rows = (segments || []).map((s) => {
    const time = safeCell(s.timestamp || s.time || '[chưa rõ]');
    const speaker =
      s.speaker != null ? safeCell(getSpeakerLabel(s.speaker, speakerNames)) : '[chưa rõ]';
    const en = safeCell(s.en || '');
    const vi = safeCell(s.vi ?? '(chưa dịch)');
    return `| ${time} | ${speaker} | ${en} | ${vi} |`;
  });
  return [header, ...rows].join('\n');
}

export function buildTextFullTable(segments, speakerNames = {}) {
  const lines = ['| Thời gian | Người nói | EN | VI |', '|---|---|---|---|'];
  for (const s of segments || []) {
    const time = safeCell(s.timestamp || s.time || '[chưa rõ]');
    const speaker =
      s.speaker != null ? safeCell(getSpeakerLabel(s.speaker, speakerNames)) : '[chưa rõ]';
    const en = safeCell(s.en || '');
    const vi = safeCell(s.vi ?? '(chưa dịch)');
    lines.push(`| ${time} | ${speaker} | ${en} | ${vi} |`);
  }
  return lines.join('\n');
}

/** Markdown: tiêu đề + bảng transcript đầy đủ (dùng lưu kho / xem trước). */
export function buildFullTranscriptMarkdown(segments, speakerNames = {}) {
  if (!segments || segments.length === 0) {
    return '_(Không có đoạn transcript.)_\n';
  }
  return `## Bảng ghi đầy đủ\n\n${buildMarkdownFullTable(segments, speakerNames)}\n`;
}

/** Lấy nội dung full script từ record (tương thích bản cũ chỉ có segments). */
export function getRecordFullScript(record) {
  if (!record) return '';
  if (record.fullScript) return record.fullScript;
  return buildFullTranscriptMarkdown(record.segments || [], record.speakerNamesSnapshot || {});
}

function safeCell(text) {
  return String(text).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
}

function downloadFile(filename, content, mimeType) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type: mimeType })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

export function getSessionDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}`;
}
