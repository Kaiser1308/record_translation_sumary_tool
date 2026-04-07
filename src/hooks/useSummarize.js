import { useState, useCallback } from 'react';
import { callLLM } from '../utils/llm';

const REQUIRED_HEADINGS = [
  '## Biên bản tóm tắt',
  '## Nội dung đã thảo luận (chi tiết)',
  '## Quyết định và thống nhất',
  '## Hành động tiếp theo',
  '## Rủi ro / vướng mắc',
  '## Thuật ngữ và từ khóa quan trọng',
  '## Câu hỏi mở cần theo dõi',
];

const SUMMARY_TEMPLATE = `## Biên bản tóm tắt
- [4-6 gạch đầu dòng, mỗi ý 1 dòng, nêu bối cảnh + mục tiêu + kết quả]

## Nội dung đã thảo luận (chi tiết)
### Chủ đề 1: [Tên chủ đề]
- [HH:mm:ss] Vấn đề/câu hỏi:
- [HH:mm:ss] Ý kiến/quan điểm chính:
- [HH:mm:ss] Kết luận tạm thời:

### Chủ đề 2: [Tên chủ đề]
- [HH:mm:ss] Vấn đề/câu hỏi:
- [HH:mm:ss] Ý kiến/quan điểm chính:
- [HH:mm:ss] Kết luận tạm thời:

## Quyết định và thống nhất
- [HH:mm:ss] [Quyết định 1]
- [HH:mm:ss] [Quyết định 2]

## Hành động tiếp theo
| Việc cần làm | Người phụ trách | Hạn chót | Trạng thái | Mốc thời gian |
|---|---|---|---|---|
| [Việc cần làm] | [Tên/[chưa rõ]] | [Ngày/[chưa rõ]] | [Chưa làm/Đang làm/Hoàn thành] | [HH:mm:ss/[chưa rõ]] |
| [Việc cần làm] | [Tên/[chưa rõ]] | [Ngày/[chưa rõ]] | [Chưa làm/Đang làm/Hoàn thành] | [HH:mm:ss/[chưa rõ]] |

## Rủi ro / vướng mắc
- [HH:mm:ss] [Rủi ro/vướng mắc 1] - Tác động:
- [HH:mm:ss] [Rủi ro/vướng mắc 2] - Tác động:

## Thuật ngữ và từ khóa quan trọng
| Thuật ngữ | Giải thích ngắn |
|---|---|
| [Thuật ngữ] | [Giải thích] |
| [Thuật ngữ] | [Giải thích] |

## Câu hỏi mở cần theo dõi
- [HH:mm:ss] [Câu hỏi mở 1]
- [HH:mm:ss] [Câu hỏi mở 2]`;

const SUMMARY_SYSTEM = `You are a meeting-note assistant.
Write detailed Vietnamese meeting notes from transcript snippets.

Important rules:
- Keep ALL content in Vietnamese.
- Be faithful to transcript content; do not invent facts.
- If information is unclear, mark it as "[chưa rõ]".
- Prefer completeness over brevity.
- Use concise markdown, readable and scannable.
- If a transcript item has time, include timestamp in related notes.
- For each bullet in "Nội dung đã thảo luận (chi tiết)", prepend time in format [HH:mm:ss] when available.
- For decisions and action items, add timestamp evidence in parentheses when available.
- Output ONLY markdown. No intro sentence before headings.
- Always keep bullet/list style. Avoid long paragraph blocks.
- Minimum coverage:
  - "Biên bản tóm tắt": at least 4 bullets.
  - "Nội dung đã thảo luận (chi tiết)": at least 8 bullets across >= 2 topics.
  - "Quyết định và thống nhất": at least 2 bullets (or state "Chưa chốt" explicitly).
  - "Rủi ro / vướng mắc": at least 2 bullets.
  - "Câu hỏi mở cần theo dõi": at least 2 bullets.

Output with exactly these sections:

## Biên bản tóm tắt
- Mô tả mục tiêu buổi họp và bối cảnh chính (4-6 câu).
- Nêu kết quả tổng quan và trạng thái hiện tại.

## Nội dung đã thảo luận (chi tiết)
- Liệt kê theo nhóm chủ đề.
- Mỗi chủ đề gồm:
  - Vấn đề/câu hỏi được nêu.
  - Ý kiến/quan điểm chính từ các bên.
  - Kết luận tạm thời (nếu có).
- Ưu tiên đầy đủ ý quan trọng, không giới hạn cứng số bullet.

## Quyết định và thống nhất
- Ghi rõ các quyết định đã chốt.
- Nếu chưa chốt thì ghi "Chưa chốt" và nêu phương án đang nghiêng về.

## Hành động tiếp theo
| Việc cần làm | Người phụ trách | Hạn chót | Trạng thái | Mốc thời gian |
|---|---|---|---|---|
- Điền từ transcript nếu có.
- Thiếu thông tin thì ghi "[chưa rõ]".

## Rủi ro / vướng mắc
- Liệt kê các blocker, phụ thuộc, điểm mơ hồ.
- Nêu tác động ngắn gọn cho từng mục.

## Thuật ngữ và từ khóa quan trọng
| Thuật ngữ | Giải thích ngắn |
|---|---|

## Câu hỏi mở cần theo dõi
- Liệt kê các câu hỏi còn bỏ ngỏ cần xử lý ở buổi sau.`;

function stripCodeFence(text) {
  return String(text || '')
    .replace(/^```(?:markdown|md)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function countBullets(text) {
  const m = String(text || '').match(/^\s*-\s+/gm);
  return m ? m.length : 0;
}

function isStructuredSummary(text) {
  if (!text) return false;
  for (const heading of REQUIRED_HEADINGS) {
    if (!text.includes(heading)) return false;
  }
  if (!text.includes('| Việc cần làm | Người phụ trách | Hạn chót | Trạng thái | Mốc thời gian |')) {
    return false;
  }
  return countBullets(text) >= 16;
}

function buildFallbackSummary(raw) {
  const cleaned = stripCodeFence(raw);
  return `## Biên bản tóm tắt
- [chưa rõ] AI chưa trả đúng format chuẩn.
- Nội dung thô đã được lưu ở phần "Nội dung đã thảo luận (chi tiết)" để không mất dữ liệu.
- Vui lòng bấm tóm tắt lại nếu muốn bản đẹp hơn.
- Giữ nguyên thông tin từ transcript, không tự suy diễn.

## Nội dung đã thảo luận (chi tiết)
### Chủ đề 1: Nội dung thô từ AI
- [chưa rõ] ${cleaned || 'Không có nội dung trả về.'}
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]
- [chưa rõ] [chưa rõ]

## Quyết định và thống nhất
- Chưa chốt.
- Chưa chốt.

## Hành động tiếp theo
| Việc cần làm | Người phụ trách | Hạn chót | Trạng thái | Mốc thời gian |
|---|---|---|---|---|
| [chưa rõ] | [chưa rõ] | [chưa rõ] | Chưa làm | [chưa rõ] |
| [chưa rõ] | [chưa rõ] | [chưa rõ] | Chưa làm | [chưa rõ] |

## Rủi ro / vướng mắc
- [chưa rõ] Chưa xác định đủ rủi ro từ nội dung hiện có - Tác động: [chưa rõ]
- [chưa rõ] Thiếu dữ liệu có cấu trúc - Tác động: khó theo dõi quyết định/action.

## Thuật ngữ và từ khóa quan trọng
| Thuật ngữ | Giải thích ngắn |
|---|---|
| [chưa rõ] | [chưa rõ] |
| [chưa rõ] | [chưa rõ] |

## Câu hỏi mở cần theo dõi
- [chưa rõ] Cần xác nhận lại quyết định chính trong buổi họp.
- [chưa rõ] Cần gán người phụ trách và hạn chót cho từng việc cần làm.`;
}

export default function useSummarize() {
  const [isSummarizing, setIsSummarizing] = useState(false);

  const summarize = useCallback(async (segments, model) => {
    if (!segments || segments.length === 0) return '';

    const input = segments
      .map((s) => {
        const lines = [];
        if (s.timestamp || s.time) lines.push(`[TIME]: ${s.timestamp || s.time}`);
        if (s.speaker != null) lines.push(`[SPEAKER]: S${s.speaker}`);
        
        // s.meetingLang tells us which field has the source transcript
        const isEn = s.meetingLang !== 'vi';
        
        if (isEn) {
          lines.push(`[EN]: ${s.en || ''}`);
          if (s.vi && !s.skipped) lines.push(`[VI]: ${s.vi}`);
        } else {
          lines.push(`[VI]: ${s.vi || ''}`);
          if (s.en && !s.skipped) lines.push(`[EN]: ${s.en}`);
        }
        
        return lines.join('\n');
      })
      .join('\n\n');
    const userPrompt = `Hãy tạo biên bản cuộc họp CHI TIẾT bằng tiếng Việt từ transcript sau.
Tuân thủ nghiêm ngặt template markdown bên dưới và không thêm phần mở đầu/kết thúc.

${SUMMARY_TEMPLATE}

Transcript:
${input}`;

    setIsSummarizing(true);
    try {
      const firstPass = await callLLM({
        system: SUMMARY_SYSTEM,
        userMessage: userPrompt,
        model,
        maxTokens: 3200,
      });
      const cleanedFirstPass = stripCodeFence(firstPass);
      if (isStructuredSummary(cleanedFirstPass)) return cleanedFirstPass;

      const repairPrompt = `Bạn đã trả sai format. Hãy trả lại CHỈ markdown theo đúng template, không thêm câu mở đầu.
Giữ đầy đủ ý từ transcript, liệt kê rõ ràng từng gạch đầu dòng.

Template bắt buộc:
${SUMMARY_TEMPLATE}

Transcript:
${input}`;
      const secondPass = await callLLM({
        system: SUMMARY_SYSTEM,
        userMessage: repairPrompt,
        model,
        maxTokens: 3200,
      });
      const cleanedSecondPass = stripCodeFence(secondPass);
      if (isStructuredSummary(cleanedSecondPass)) return cleanedSecondPass;

      return buildFallbackSummary(cleanedSecondPass || cleanedFirstPass);
    } finally {
      setIsSummarizing(false);
    }
  }, []);

  return { summarize, isSummarizing };
}
