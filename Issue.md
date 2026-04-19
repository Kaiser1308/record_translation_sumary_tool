# Vấn đề cần cải thiện

## Web Speech — nghe kém, nhiều từ sai

**Hiện trạng:** Với engine Web Speech (nhất là tiếng Việt), transcript đôi khi không rõ, nhiều từ nhận diện sai so với lời nói thực tế.

**Bối cảnh kỹ thuật (ngắn):** Web Speech dùng dịch vụ nhận dạng của trình duyệt/Google, không kiểm soát được model; tiếng Việt thường kém ổn định hơn tiếng Anh.

---

## Ít nhất 3 hướng giải pháp (ưu / nhược)

### 1. Chuyển sang STT trên cloud (đã có trong app: Groq Whisper, Deepgram)

| Ưu điểm | Nhược điểm |
|--------|-------------|
| Độ chính xác cao hơn Web Speech cho tiếng Việt và nhiều accent | Cần API key / có chi phí hoặc giới hạn quota (tùy nhà cung cấp) |
| Ổn định hơn giữa các phiên bản trình duyệt | Phụ thuộc mạng; audio gửi lên server (cần lưu ý bảo mật / chính sách nội bộ) |
| Deepgram hỗ trợ diarization (tách người nói) khi họp tiếng Anh | Cấu hình thêm so với “bật mic là chạy” của Web Speech |

### 2. Giữ Web Speech nhưng cải thiện điều kiện thu và cấu hình client

| Ưu điểm | Nhược điểm |
|--------|-------------|
| Không thêm API; phù hợp demo hoặc môi trường hạn chế gửi audio ra ngoài | Không sửa được “gốc” độ chính xác của model trình duyệt |
| Mic tốt, ít nhiễu, nói rõ ràng giúp giảm lỗi thực tế | Vẫn còn trần chất lượng thấp so với Whisper / ASR chuyên dụng |
| Có thể kết hợp chỉnh `lang`, continuous/restart (đã có logic riêng cho `vi`) — cần test thêm | Chrome/Edge khác nhau; hành vi Web Speech khó dự đoán 100% |

### 3. Bước hậu xử lý transcript (sửa tay hoặc “làm sạch” bằng LLM một lần)

| Ưu điểm | Nhược điểm |
|--------|-------------|
| Sửa được đoạn đã ghi sai mà không đổi engine STT | Sửa tay tốn thời gian; LLM có thể đoán sai ngữ cảnh nếu audio quá sai |
| Có thể xuất `.md` rồi chỉnh trong NotebookLM / editor (đã có tải transcript `.md`) | LLM tốn token / key; cần prompt và giới hạn để không đổi nội dung họp một cách tùy tiện |
| Phù hợp biên bản cuối phiên, không cần realtime từng từ | Không giải quyết realtime nếu vẫn chỉ dùng Web Speech thu trực tiếp |

### 4. (Tuỳ chọn thêm) Kết hợp: Web Speech interim + xác nhận bằng cloud theo chunk

| Ưu điểm | Nhược điểm |
|--------|-------------|
| Có thể cân bằng độ trễ và chất lượng theo từng chế độ | Phức tạp hơn về UX và code; cần thiết kế rõ (khi nào gửi chunk, overlap, v.v.) |

---

## Việc nên làm tiếp theo (gợi ý)

1. **Mặc định gợi ý / cảnh báo trong UI** khi chọn Web Speech + ngôn ngữ họp tiếng Việt: nêu rõ hạn chế và khuyến nghị Groq/Deepgram nếu cần độ chính xác cao.
2. **Đo thực tế:** cùng một đoạn audio/nội dung đọc, so sánh Web Speech vs Groq vs Deepgram (WER hoặc so sánh chủ quan) để chốt messaging cho người dùng.
3. **Backlog sản phẩm (tuỳ ưu tiên):** nút “Gợi ý sửa transcript” (một lần, không realtime) gọi LLM trên toàn bộ bảng ghi — chỉ khi có nhu cầu và đã có policy API.

---

## Ước tính chi phí STT cloud (tham chiếu nhanh)

Giả định: **30 giờ/tháng** \(= 1800 phút\). Dưới đây là con số **ước tính** để giúp ra quyết định roadmap (chưa tính dịch/tóm tắt LLM).

### Deepgram (Streaming/WSS)

- **Nova‑3 (Monolingual)**: $0.0077/phút → **$13.86/tháng**
- **Nova‑3 (Multilingual)**: $0.0092/phút → **$16.56/tháng**
- **Nova‑1 & 2**: $0.0058/phút → **$10.44/tháng**
- **Add‑on Speaker Diarization**: +$0.0020/phút → **+$3.60/tháng** (nếu bật)

Gợi ý dùng:
- **100% tiếng Anh**: Nova‑3 Monolingual (nếu cần diarization thì cộng thêm +$3.60/tháng)
- **100% tiếng Việt**: ưu tiên Nova‑3 Multilingual (ổn định hơn trong môi trường phòng họp / far‑field)

### Groq Whisper (upload chunk)

- Model `whisper-large-v3-turbo`: **$0.04/giờ**.
- Lưu ý: Groq có **minimum billed length 10 giây / request**. Code hiện tại đang gửi chunk **4 giây** nên chi phí bị đội.

Ước tính theo code hiện tại:
- Billed time ≈ \(30h × 10/4\) = **75h**
- Cost ≈ 75 × $0.04 = **$3.00/tháng**

Nếu tối ưu chunk ≥ 10s (ví dụ 12–15s, có overlap nhẹ để tránh mất chữ ở biên): chi phí sẽ gần về **~$1.20/tháng** (30h × $0.04/h).
