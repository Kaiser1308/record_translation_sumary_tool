# Speech Translator — Hướng Dẫn Sử Dụng

Ứng dụng web chạy local để ghi âm cuộc họp/lớp học, chuyển thành transcript realtime, dịch tự động và tạo biên bản.

## Tính năng chính

- Transcript realtime tiếng Anh hoặc tiếng Việt
- Dịch tự động sang ngôn ngữ còn lại
- Phân loại người nói (khi dùng Deepgram + English)
- Tạo biên bản AI và lưu theo 2 mẫu:
  - `Tóm tắt (AI)`
  - `Full script` (bảng transcript đầy đủ)
- Audio meter realtime để kiểm tra mic đang nhận âm thanh
- Xuất file `.md` / `.txt` hoặc lưu vào kho local

## So sánh nhanh STT engine

| Engine | Ưu điểm | Lưu ý |
|--------|---------|-------|
| `Web Speech API` | Không cần API key, setup nhanh | Chất lượng tiếng Việt không ổn định, phù hợp demo |
| `Groq Whisper V3` | Tốc độ cao, chi phí thấp | Không có speaker diarization mặc định |
| `Deepgram Nova-2` | Ổn định cho realtime, hỗ trợ speaker diarization | Cần API key, tính phí theo phút |

## Yêu cầu

- `Node.js` 18+
- Chrome hoặc Edge
- Ít nhất 1 API key cho dịch/tóm tắt

## Cài đặt nhanh

```bash
cd translation-tool
npm install
cp .env.example .env
npm run dev
```

Mở `http://localhost:5173`.

## Cấu hình API key

Điền vào file `.env` (chỉ cần key bạn dùng):

- `VITE_ANTHROPIC_API_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_OPENAI_API_KEY`
- `VITE_DEEPSEEK_API_KEY`
- `VITE_GROQ_API_KEY`
- `VITE_GLM_API_KEY`
- `VITE_DEEPGRAM_API_KEY`

Gợi ý tối thiểu:
- Muốn phân loại người nói: thêm `VITE_DEEPGRAM_API_KEY`
- Muốn tiết kiệm chi phí: dùng Web Speech + model miễn phí

## Cách dùng

1. Chọn STT engine:
   - `Web Speech API` (free, không cần key)
   - `Groq Whisper V3` (nhanh, cần key Groq)
   - `Deepgram Nova-2` (chuẩn, có speaker diarization)
2. Chọn ngôn ngữ họp (`English` hoặc `Vietnamese`)
3. Nhấn `Bắt đầu` và cấp quyền microphone
4. Theo dõi:
   - Transcript realtime
   - Audio meter (dao động khi có âm thanh)
5. Nhấn `Tạo biên bản`
6. Trong modal biên bản:
   - Tab `Tóm tắt (AI)`
   - Tab `Full script`
7. Lưu vào kho hoặc export `.md` / `.txt`

Lưu ý:
- Nút `Tải full transcript .md` xuất **toàn bộ** transcript (không theo bộ lọc speaker).
- Speaker diarization hoạt động tốt nhất khi dùng Deepgram và cuộc họp tiếng Anh.

## Troubleshooting

- Không ra transcript: chờ 1-3 giây sau khi bấm `Bắt đầu`, kiểm tra lại quyền mic.
- Web Speech tiếng Việt yếu: chuyển sang `Deepgram` hoặc `Groq`.
- Deepgram lỗi kết nối: kiểm tra `VITE_DEEPGRAM_API_KEY`.
- Audio meter không chạy: kiểm tra mic có đang được cấp quyền.

## Tài liệu kỹ thuật

- Kiến trúc dev: xem `ARCHITECTURE.md`
- Thiết kế UI: xem `DESIGN.md`
- Tổng quan sản phẩm + roadmap: xem `PROJECT_OVERVIEW.md`
- Kế hoạch cải thiện STT + chi phí cloud: xem `Issue.md`
- Kế hoạch ổn định (nhấn là chạy): xem `STABILITY_PLAN.md`
