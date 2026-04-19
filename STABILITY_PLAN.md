# Stability Plan — Speech Translator

Mục tiêu tài liệu này là biến yêu cầu "nhấn là chạy" thành checklist kỹ thuật có thể triển khai theo sprint.

---

## 1) Mục tiêu chất lượng (SLO)

- Start thành công >= `99%` trong test nội bộ (100 lần bấm liên tiếp).
- Thời gian từ `Bắt đầu` đến transcript đầu tiên <= `3s` (P95).
- Stop luôn dừng sạch mic + engine, không treo state.
- Không có trạng thái "listening giả" (UI báo đang nghe nhưng engine đã chết).

---

## 2) Vấn đề hiện tại cần khóa

- Lifecycle start/stop chưa đồng nhất giữa 3 engine.
- Callback async có thể trả kết quả trễ từ phiên cũ.
- Retry/reconnect chưa có chuẩn chung theo lỗi mạng / rate limit.
- Thiếu telemetry chuẩn hóa để biết chính xác vì sao "lúc được lúc không".

---

## 3) Kế hoạch triển khai theo pha

## Pha 1 — Ổn định lifecycle Start/Stop (P0)

1. **Thêm state machine cho phiên STT**
   - Trạng thái: `idle -> starting -> listening -> stopping -> idle` (+ `error`).
   - Chặn click lặp khi đang `starting/stopping`.
   - Mỗi phiên có `sessionId`; callback không khớp `sessionId` thì bỏ qua.

2. **Chuẩn hóa Start handshake**
   - Trình tự: `getUserMedia -> engine start -> engine ready -> set isListening`.
   - Chỉ set `isListening=true` khi engine thật sự ready.
   - Timeout rõ ràng (4-5s), timeout thì fail có mã lỗi cụ thể.

3. **Stop idempotent**
   - Gọi `stop()` nhiều lần vẫn an toàn.
   - Luôn dọn timer/socket/stream trong mọi nhánh thành công/thất bại.

## Pha 2 — Hardening theo engine (P1)

4. **Web Speech**
   - Retry ngắn có backoff cho lỗi tạm thời.
   - Tách thông báo theo nhóm lỗi: permission/network/no-speech.
   - Giữ filter dữ liệu rác nhưng có log đếm tần suất.

5. **Groq**
   - Queue upload chunk để tránh đè request khi mạng chậm.
   - Retry cho `429/5xx` với jitter.
   - Circuit breaker ngắn: lỗi liên tiếp thì pause và hướng dẫn người dùng.

6. **Deepgram**
   - Reconnect có exponential backoff + giới hạn số lần.
   - Heartbeat/health-check để phát hiện socket treo.

## Pha 3 — Quan sát và đo được (P1/P2)

7. **Telemetry local chuẩn hóa**
   - Event: `start_clicked`, `mic_granted`, `engine_ready`, `first_result_ms`, `start_failed`, `stop_done`.
   - Chuẩn mã lỗi: `MIC_DENIED`, `ENGINE_TIMEOUT`, `NETWORK_FAIL`, `RATE_LIMIT`, `SOCKET_CLOSED`.

8. **Debug panel (dev only)**
   - Hiển thị engine, sessionId, last error, first-result latency.
   - Mục tiêu: giảm thời gian debug lỗi ngắt quãng.

---

## 4) Test plan bắt buộc trước release

1. **Soak test**: `Start -> nói 5s -> Stop` lặp 100 lần.
2. **Switch test**: đổi engine liên tục giữa các phiên.
3. **Permission test**: deny mic rồi allow lại.
4. **Network test**: bật/tắt mạng khi đang nghe.
5. **Long run**: chạy 30-60 phút để bắt leak/timer treo.

Tiêu chí pass:
- Start success >= 99%
- Không treo UI
- Không còn callback từ session cũ ghi đè session mới

---

## 5) Kế hoạch sprint đề xuất

### Sprint 1 (ưu tiên tuyệt đối)
- State machine + sessionId guard.
- Start handshake + timeout chuẩn.
- Stop idempotent.
- Unit test logic state chuyển đổi.

### Sprint 2
- Retry/backoff/circuit breaker cho từng engine.
- Telemetry event và mã lỗi chuẩn.
- Dashboard debug (dev mode).

### Sprint 3
- Chạy benchmark ổn định nội bộ (100-run, long-run).
- Tối ưu UX khi fail: nút `Thử lại`, gợi ý đổi engine.
- Chốt default engine theo dữ liệu thực nghiệm.

---

## 6) Deliverables

- `STABILITY_PLAN.md` (tài liệu này)
- Checklist test release (`docs/release-checklist.md` nếu cần tách riêng)
- Bảng kết quả benchmark theo engine (CSV/Markdown)
- Quyết định default engine + thông điệp UI chính thức

