# Speech Translator — Tổng quan dự án, mục tiêu & hướng phát triển

Tài liệu này tóm tắt **bức tranh sản phẩm–kỹ thuật** và **việc nên làm tiếp**. Chi tiết cài đặt xem `README.md`; luồng code xem `ARCHITECTURE.md`; backlog vấn đề STT xem `Issue.md`.

---

## 1. Tổng quan dự án

### 1.1 Sản phẩm là gì

**Speech Translator** là ứng dụng web (SPA **React + Vite**), chạy trên trình duyệt, hướng tới **cuộc họp / buổi nói chuyện trực tiếp trong phòng** (một máy thu mic, không phụ thuộc Zoom/Google Meet như nguồn âm):

- Thu **âm thanh từ microphone**
- **Nhận dạng giọng nói (STT)** realtime qua một trong ba engine
- **Dịch** sang ngôn ngữ còn lại (Anh ↔ Việt) khi bật dịch
- **Tóm tắt / biên bản** cuối phiên bằng LLM
- **Lưu cục bộ** (localStorage), **kho biên bản**, **xuất** `.md` / `.txt`; có thêm **tải transcript `.md`** riêng (phục vụ mang sang công cụ khác, ví dụ NotebookLM)

### 1.2 Stack & ràng buộc kỹ thuật

| Thành phần | Ghi chú |
|------------|---------|
| Frontend | React, Vite, client-only |
| STT | Web Speech API (miễn phí, chất lượng hạn chế) / Groq Whisper / Deepgram |
| Dịch & tóm tắt | `callLLM` — nhiều provider (Anthropic, Gemini, OpenAI, …) qua biến môi trường |
| Lưu trữ phiên | `localStorage` (segments, logs, records, cấu hình) |

### 1.3 Điểm mạnh hiện tại

- Một codebase **ba engine STT** thống nhất qua `useSTT`
- **Deepgram**: diarization khi họp tiếng Anh
- **Audio meter** để người dùng biết mic có tín hiệu
- **Export linh hoạt**: biên bản đầy đủ + transcript-only `.md`

---

## 2. Mục tiêu

### 2.1 Mục tiêu sản phẩm (người dùng)

1. **Ghi nhận nội dung nói** trong phòng họp / lớp với độ trễ chấp nhận được.
2. **Song ngữ Anh–Việt**: xem transcript và bản dịch song song khi cần.
3. **Sinh biên bản nhanh** sau buổi, có thể lưu và xuất để chia sẻ hoặc đưa vào quy trình khác.
4. **Ưu tiên use case họp trực tiếp**: một máy “trung tâm”, không bắt buộc tích hợp bot Zoom.

### 2.2 Mục tiêu kỹ thuật

1. **Ổn định pipeline**: mic → STT → segment → (dịch) → UI → export/vault.
2. **Minh bạch giới hạn Web Speech** (nhất là tiếng Việt) và **khuyến nghị engine trả phí** khi cần độ chính xác.
3. **Giữ app chạy local / client-first**, chỉ gửi dữ liệu ra ngoài khi người dùng cấu hình API (trừ Web Speech phụ thuộc dịch vụ trình duyệt).

---

## 3. Hướng xây dựng tiếp theo

Thứ tự gợi ý theo **impact / effort**; có thể song song tùy nguồn lực.

### Giai đoạn ngắn (polish & niềm tin người dùng)

1. **Onboarding & UI cảnh báo**  
   Khi chọn **Web Speech + tiếng Việt** (và có thể cả “họp phòng đông người”): banner/tooltip ngắn — hạn chế engine, gợi ý **Groq / Deepgram** và **mic gần người nói**.

2. **Tài liệu “họp trực tiếp”** (một mục trong README hoặc block ngắn)  
   Gợi ý: mic USB họp, tránh xa mic, giảm nhiễu phòng — **cùng engine**, âm thanh sạch hơn thì chữ tốt hơn rõ rệt.

3. **Theo dõi lỗi đã biết** (`Issue.md`)  
   Tiếp tục ưu tiên **Groq/Deepgram** cho tiếng Việt chất lượng cao; Web Speech giữ vai trò “0 key / demo”.

### Giai đoạn trung hạn (chất lượng & tính năng)

4. **Đo so sánh engine (nội bộ)**  
   Cùng một đoạn đọc / họp mẫu: Web Speech vs Groq vs Deepgram → chốt **copy marketing** và **mặc định gợi ý** trong UI.

5. **Hậu xử lý transcript (tuỳ chọn)**  
   Nút một lần: “Gợi ý sửa chính tả / thuật ngữ” trên toàn bộ bảng ghi (LLM), có prompt an toàn và preview trước khi áp dụng.

6. **Từ vựng tùy chỉnh / glossary (nếu API hỗ trợ)**  
   Tên riêng, từ tiếng Anh chuyên ngành — giảm lỗi nhận dạng khi dùng Deepgram/Groq (tùy roadmap API).

### Giai đoạn dài (nếu mở rộng sản phẩm)

7. **Cảnh báo quyền riêng tư / chế độ “chỉ local”**  
   Rõ ràng khi nào audio/text gửi lên nhà cung cấp nào.

8. **Tùy chọn backend proxy** (tuỳ nhu cầu doanh nghiệp)  
   Ẩn key phía client, kiểm soát log — chỉ khi có yêu cầu triển khai thật.

---

## 4. Liên kết nhanh

| File | Nội dung |
|------|----------|
| `README.md` | Cài đặt, env, cách dùng, troubleshooting |
| `ARCHITECTURE.md` | Luồng dữ liệu, hooks, segment model, cost ước lượng |
| `Issue.md` | Vấn đề Web Speech, hướng giải pháp & backlog gợi ý |

---

*Cập nhật theo trạng thái codebase và thảo luận sản phẩm (họp trực tiếp, không ưu tiên bot Zoom).*
