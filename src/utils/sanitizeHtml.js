import DOMPurify from 'dompurify';

export function sanitizeHtml(dirty) {
  if (!dirty) return '';
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins',
      'a', 'code', 'pre', 'blockquote',
      'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'colspan', 'rowspan', 'align'],
    ALLOW_DATA_ATTR: false,
  });
}
