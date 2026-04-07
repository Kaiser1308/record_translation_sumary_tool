export function saveAsMarkdown(summary, segments, sessionDate, modelInfo) {
  const modelLine = modelInfo
    ? `\nDịch bằng: ${modelInfo.translation} | Tóm tắt bằng: ${modelInfo.summary}\n`
    : '';
  const fullTable = buildMarkdownFullTable(segments);

  const content =
    `# Biên bản cuộc họp — ${sessionDate}\n${modelLine}\n${summary}\n\n---\n\n## Bảng ghi đầy đủ\n\n${fullTable}\n`;

  downloadFile(`bien-ban_${sessionDate}.md`, content, 'text/markdown');
}

export function saveAsTxt(summary, segments, sessionDate, modelInfo) {
  const plain = summary
    .replace(/#{1,3} /g, '')
    .replace(/\*\*/g, '');
  const modelLine = modelInfo
    ? `Dịch bằng: ${modelInfo.translation} | Tóm tắt bằng: ${modelInfo.summary}`
    : '';
  const fullTable = buildTextFullTable(segments);

  const content =
    `BIEN BAN CUOC HOP — ${sessionDate}\n${'='.repeat(40)}\n${modelLine}\n\n${plain}\n\n${'='.repeat(
      40
    )}\nBANG GHI DAY DU\n\n${fullTable}\n`;

  downloadFile(`bien-ban_${sessionDate}.txt`, content, 'text/plain');
}

function buildMarkdownFullTable(segments) {
  const header = '| Thời gian | Người nói | EN | VI |\n|---|---|---|---|';
  const rows = segments.map((s) => {
    const time = safeCell(s.timestamp || s.time || '[chưa rõ]');
    const speaker = s.speaker != null ? `S${s.speaker}` : '[chưa rõ]';
    const en = safeCell(s.en || '');
    const vi = safeCell(s.vi ?? '(chưa dịch)');
    return `| ${time} | ${speaker} | ${en} | ${vi} |`;
  });
  return [header, ...rows].join('\n');
}

function buildTextFullTable(segments) {
  const lines = ['| Thời gian | Người nói | EN | VI |', '|---|---|---|---|'];
  for (const s of segments) {
    const time = safeCell(s.timestamp || s.time || '[chưa rõ]');
    const speaker = s.speaker != null ? `S${s.speaker}` : '[chưa rõ]';
    const en = safeCell(s.en || '');
    const vi = safeCell(s.vi ?? '(chưa dịch)');
    lines.push(`| ${time} | ${speaker} | ${en} | ${vi} |`);
  }
  return lines.join('\n');
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
