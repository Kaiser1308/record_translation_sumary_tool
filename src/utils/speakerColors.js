// Speaker color palette — 8 distinct, accessible colors
export const SPEAKER_COLORS = [
  '#f54e00',  // orange-red
  '#1f8a65',  // teal green
  '#6366f1',  // indigo
  '#ec4899',  // pink
  '#f59e0b',  // amber
  '#06b6d4',  // cyan
  '#8b5cf6',  // violet
  '#84cc16',  // lime
];

export function getSpeakerColor(speakerId) {
  if (speakerId == null) return '#999';
  return SPEAKER_COLORS[speakerId % SPEAKER_COLORS.length];
}

export function getSpeakerLabel(speakerId, speakerNames) {
  if (speakerId == null) return 'Chưa rõ';
  return speakerNames?.[speakerId] || `Người nói ${speakerId}`;
}
