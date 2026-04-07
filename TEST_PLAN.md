# Kế Hoạch Kiểm Thử (TEST PLAN) - Tool Dịch Thuật & Tóm Tắt Real-time

> **Tài liệu hướng dẫn nghiệm thu và kiểm thử các tính năng sau khi code xong, dựa trên `BUILD_PLAN.md`.**

---

## 1. Môi trường kiểm thử
- **Trình duyệt**: Chỉ test trên Google Chrome hoặc Microsoft Edge (phiên bản mới nhất).
- **Hệ điều hành**: Windows hoặc macOS.
- **Phần cứng**: Phải có Microphone hoạt động tốt.
- **Mạng**: Chạy trên `localhost`, yêu cầu có kết nối Internet ổn định để gọi Anthropic và Deepgram API.

---

## 2. Các kịch bản kiểm thử (Test Cases)

### 2.1. Module Nhận diện giọng nói (STT Engines)
- **STT-1 (Web Speech API cơ bản):** 
  - Chọn Engine "Web Speech API" ở Model Selector.
  - Nhấp "Start" -> Cho phép quyền truy cập Mic -> Trạng thái đèn LED xanh/pulse.
  - Đọc 1 câu tiếng Anh chuẩn (Ví dụ: "Hello, what is your name?"). 
  - **Kết quả mong đợi:** Transcript tiếng Anh hiện ra realtime và cập nhật chính xác.
- **STT-2 (Silence/Tự động khởi động lại):** 
  - Bật nhận diện, sau đó giữ im lặng khoảng 60-90 giây (Chrome sẽ tự động dừng).
  - **Kết quả mong đợi:** Microphone không bị tắt hoàn toàn, cơ chế auto-restart trong hook tự động bật lại mic và chờ câu tiếp theo.
- **STT-3 (Deepgram API - Thành công):** 
  - Đổi engine sang Deepgram. Đảm bảo file `.env` đã có `VITE_DEEPGRAM_API_KEY`.
  - Mở một đoạn audio có giọng tiếng Anh - Ấn Độ (Indian English accent).
  - **Kết quả mong đợi:** Text hiển thị chính xác hơn so với Web Speech API, interim text (đoạn chưa hoàn thiện) nhấp nháy liên tục nhưng chốt câu rất nhanh.
- **STT-4 (Deepgram nhưng thiếu API Key):** 
  - Xóa hoặc làm rỗng biến `VITE_DEEPGRAM_API_KEY`, sau đó chọn Deepgram.
  - **Kết quả mong đợi:** Hiển thị cảnh báo rõ ràng (Toast/Alert) cho người dùng, không bị crash ứng dụng trắng trang.

### 2.2. Module Dịch thuật (Translation)
- **TR-1 (Dịch thành công với Haiku):** 
  - Chọn model "Haiku 4.5", bật toggle Dịch. Đọc 1 câu hoàn chỉnh.
  - **Kết quả mong đợi:** Trong lúc nói hiển thị "(3 chấm) đang dịch...", sau khoảng 1-2s sau khi dứt câu, bản dịch tiếng Việt xuất hiện to và đậm ở dưới câu tiếng Anh tương ứng.
- **TR-2 (Chuyển đổi Model an toàn):** 
  - Đang ở "Haiku 4.5", tạo ra 2 câu (đã dịch xong). Giữa chừng chuyển sang "Sonnet 4.6" và nói câu thứ 3.
  - **Kết quả mong đợi:** Câu thứ 3 được dịch bình thường, các câu 1 và 2 cũ KHÔNG bị dịch lại.
- **TR-3 (Toggle Tắt/Bật dịch):** 
  - Kéo công tắc Dịch sang Tắt. Đọc 1 câu tiếng Anh.
  - **Kết quả mong đợi:** Layout chỉ hiện tiếng Anh, không hiển thị tiếng Việt, app không gọi API lên Anthropic giúp tiết kiệm token. Bật lại dịch thì câu cũ bị bỏ qua, chỉ dịch các câu trong tương lai.
- **TR-4 (Câu quá ngắn):** 
  - Dùng mic ho một tiếng, hoặc nói những từ vô nghĩa < 3 chữ như "Uhm", "Okay".
  - **Kết quả mong đợi:** Bỏ qua không gọi API dịch (Theo như rule mô tả trong plan để tránh tốn token vô ích).

### 2.3. Module Tóm Tắt & Lưu File (Summarize & Export)
- **EXP-1 (Nút Tóm tắt bị block khi rỗng):** 
  - Mở app mới lên, không có đoạn hội thoại nào.
  - **Kết quả mong đợi:** Nút "Tóm tắt & Lưu" bị mờ (disabled).
- **EXP-2 (Quy trình Tóm tắt hoàn chỉnh):** 
  - Có khoảng 5-10 segment trên màn hình, bao gồm cả câu có dịch và câu không được dịch. Nhấn "Tóm tắt & Lưu".
  - **Kết quả mong đợi:** Hiển thị Modal/Overlay Loading (Spiner: "AI đang đọc buổi học..."). Sau ~5-10s hiển thị Bảng tóm tắt Tiếng Việt với 4 đề mục rõ ràng: Tổng quan, Điểm chính, Thuật ngữ (bảng), Câu hỏi ôn lại.
- **EXP-3 (Tải file Markdown & Text):** 
  - Nhấp tải file `.md` và `.txt` từ Modal.
  - **Kết quả mong đợi:** Tải xuống thành công với cấu trúc tên `lecture_YYYY-MM-DD_HH-mm`. Mở thử phần mềm Notepad/Obsidian text hiển thị đầy đủ tóm tắt ở trên, transcript ở dưới (strip đúng các markdown ở bản .txt).

### 2.4. Trạng thái và UX / UI / Edge Cases
- **UI-1 (Kiểm tra giao diện khung hiển thị):**
  - Text tiếng Việt to (18px), text tiếng Anh nhỏ, mờ hơn (13px, opacity 0.6). Interim mờ nhất.
- **UI-2 (Performance Render & Auto-scroll):**
  - Liên tục thả copy/paste khoảng 200 đoạn văn (mô phỏng cuộc nói chuyện dài) vào state của React.
  - **Kết quả mong đợi:** Khung Transcript Panel cuộn mượt mà, khung cuộn tự động ghim xuống dòng mới nhất. Trình duyệt không bị treo/lag cứng lại (Xác nhận Virtual Scroll hoặc giới hạn hiển thị DOM hoạt động tốt).
- **ERR-1 (Test Mạng / Rate-Limit):**
  - Ngắt kết nối mạng ngay khi vừa kết thúc lời nói.
  - **Kết quả mong đợi:** Báo lỗi "(không dịch được)" chữ màu đỏ nhạt, ứng dụng không sụp đổ hoàn toàn.
- **ST-1 (Lưu State vào LocalStorage):**
  - Chọn model, engine sau đó F5 (Reload) trang web.
  - **Kết quả mong đợi:** Vẫn giữ nguyên tuỳ chọn cũ đã chọn trước đó. Nút "Clear" xóa sạch Transcript cũ để sẵn sàng bài học mới.

---
**✅ Tiêu chí hoàn thành chung**: Hoàn thành 100% tất cả các case sẽ đảm bảo công cụ có thể sẵn sàng sử dụng thực tế cho lớp học trên 2 tiếng mà không có lỗi làm tuột cảm xúc.
