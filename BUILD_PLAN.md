# Build Plan: Real-time Speech Transcription + Translation Tool
> Dành cho coding agent. Đọc toàn bộ trước khi bắt đầu code.

---

## Mục tiêu
Xây dựng web app chạy localhost giúp người dùng nghe giáo viên nói tiếng Anh (giọng Ấn Độ) và:
- Hiển thị phụ đề tiếng Anh (transcript realtime)
- Dịch sang tiếng Việt tự động sau mỗi câu
- Tóm tắt toàn bộ buổi học bằng AI khi kết thúc
- Lưu transcript + bản tóm tắt ra file

---

## Stack đề xuất
**React + Vite** — lý do:
- Web Speech API hoạt động tốt nhất trên Chrome/Edge (Windows)
- Dễ chạy localhost với `npm run dev`
- Không cần backend server riêng
- Translation gọi thẳng Anthropic API từ client

---

## Cấu trúc project

```
speech-translator/
├── index.html
├── vite.config.js
├── package.json
├── .env.example           # VITE_ANTHROPIC_API_KEY=
├── .gitignore
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── hooks/
    │   ├── useBrowserSTT.js          # Web Speech API logic
    │   ├── useTranslation.js         # Dịch realtime, nhận model làm param
    │   └── useSummarize.js           # Tóm tắt cuối buổi, nhận model làm param
    ├── components/
    │   ├── ControlBar.jsx            # Start/Stop/Clear/Tóm tắt buttons
    │   ├── StatusIndicator.jsx       # Dot + trạng thái
    │   ├── TranscriptPanel.jsx       # Danh sách segments
    │   ├── SegmentItem.jsx           # 1 đoạn EN + VI
    │   ├── SummaryModal.jsx          # Modal hiển thị tóm tắt + nút lưu
    │   └── ModelSelector.jsx         # 3 dropdown: STT engine / model dịch / model tóm tắt
    └── utils/
        ├── anthropic.js              # fetch wrapper cho Anthropic API
        ├── models.js                 # danh sách MODELS + default values
        └── exportFile.js             # logic xuất .md và .txt
```

---

## Chi tiết từng phần

### 1. `useBrowserSTT.js`
- Dùng `window.SpeechRecognition || window.webkitSpeechRecognition`
- Config: `lang = 'en-US'`, `continuous = true`, `interimResults = true`
- Expose:
  - `interimText` — câu đang nói (chưa xong)
  - `onFinalResult(text)` — callback khi một câu hoàn chỉnh
  - `start()`, `stop()`, `isListening`
- Tự restart khi `recognition.onend` nếu `isListening = true` (Chrome tự dừng sau ~60s im lặng)
- Xử lý lỗi `no-speech` → silent ignore, các lỗi khác → hiển thị toast

### 2. `useTranslation.js`
- Nhận `text` (tiếng Anh) và `model` (string) từ App.jsx, gọi Anthropic API, trả về tiếng Việt
- API key lấy từ `import.meta.env.VITE_ANTHROPIC_API_KEY`
- **Không hardcode model** — luôn dùng giá trị `model` được truyền vào
- System prompt:
  ```
  You are a translator. Translate English to Vietnamese.
  Output ONLY the Vietnamese translation. No explanation, no quotes, no preamble.
  ```
- `max_tokens: 500`
- Expose: `translate(text, model)` → Promise<string>

### 3. `utils/anthropic.js`
```js
export async function callClaude({ system, userMessage, model, maxTokens }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}
```

> **Lưu ý quan trọng:** Header `anthropic-dangerous-direct-browser-access: true` BẮT BUỘC phải có khi gọi API từ browser (CORS).

### 4. State management trong `App.jsx`
```js
// Mỗi segment có dạng:
{
  id: Date.now(),
  en: "What is the time complexity here?",
  vi: null,          // null = đang dịch, string = đã dịch
  error: false
}
```
- Khi `onFinalResult(text)` → thêm segment mới với `vi: null`
- Gọi `translate(text, translationModel)` → update `vi` khi xong
- Không giới hạn số segments trong bộ nhớ (buổi học 2 tiếng ≈ 900 segments, RAM không đáng kể)
- Chỉ giới hạn render: TranscriptPanel dùng virtual scroll hoặc chỉ render 200 segments gần nhất — nhưng `segments[]` trong state vẫn giữ đầy đủ để tóm tắt chính xác

### 5. UI/UX

**Layout:**
```
┌─────────────────────────────────────┐
│ ● Đang nghe...          [Stop][Clear]│
├─────────────────────────────────────┤
│                                     │
│  What is the time complexity here?  │  ← tiếng Anh (mờ, nhỏ hơn)
│  Độ phức tạp thời gian ở đây là gì? │  ← tiếng Việt (đậm, to hơn)
│                                     │
│  [đoạn tiếp theo...]                │
│                                     │
│  ████████ đang nói... (interim)     │  ← italic, mờ nhất
│                                     │
└─────────────────────────────────────┘
```

**Chi tiết UI:**
- Background tối (dark mode mặc định) — dễ nhìn khi chiếu lên màn hình
- Font size tiếng Việt: 18px
- Font size tiếng Anh: 13px, opacity 0.6
- Interim text: italic, opacity 0.4
- Status dot: xanh lá + pulse animation khi đang nghe
- Auto-scroll xuống segment mới nhất
- Khi `vi = null`: hiển thị skeleton loading (3 chấm nhảy)
- Responsive: hoạt động ở cả 1280px lẫn 800px

### 6. `.env.example`
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```
Hướng dẫn trong README: copy `.env.example` → `.env`, điền API key.

---

## Setup & Run

### `package.json` dependencies
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "marked": "^12.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^5.4.0"
  }
}
```

### Commands
```bash
npm install
cp .env.example .env   # điền API key
npm run dev            # chạy tại http://localhost:5173
```

---

## README.md — agent phải tạo file này

Nội dung README cần có:
1. Mô tả ngắn
2. Yêu cầu: Node.js 18+, Chrome/Edge
3. Hướng dẫn lấy Anthropic API key (link: https://console.anthropic.com)
4. Các bước cài đặt và chạy
5. Troubleshooting:
   - "Không nghe được" → kiểm tra quyền mic trong Chrome
   - "Lỗi API" → kiểm tra API key trong `.env`
   - "Dịch chậm" → bình thường, Haiku ~1-2 giây/câu

---

## Các edge case cần xử lý

| Tình huống | Xử lý |
|---|---|
| API key chưa set | Hiển thị banner cảnh báo, vẫn cho nghe/transcript |
| Mất kết nối internet | Segment hiện "(không dịch được)" màu đỏ nhạt |
| Text quá ngắn (<3 từ) | Bỏ qua, không gọi API dịch |
| Chrome tự dừng recognition | Auto restart (đã xử lý trong hook) |
| Nhiều câu nói cùng lúc | Queue translate — gọi API song song, không block nhau |

---

## Definition of Done

- [ ] `npm run dev` chạy không lỗi
- [ ] Nhấn "Bắt đầu" → mic hoạt động, text xuất hiện realtime
- [ ] Mỗi câu hoàn chỉnh → dịch sang tiếng Việt trong ~2 giây
- [ ] Interim text hiển thị trong khi đang nói
- [ ] Nút Stop dừng hẳn, nút Clear xóa transcript
- [ ] Dark mode mặc định, dễ đọc
- [ ] Không crash khi dùng liên tục 30 phút
- [ ] README đủ để người không biết code tự setup được

---

## Tính năng Tóm tắt & Lưu file

### `useSummarize.js` (hook mới)
- Nhận vào toàn bộ `segments[]` (đã có cả EN lẫn VI)
- Ghép thành 1 đoạn text lớn rồi gọi Anthropic API
- **Không hardcode model** — nhận `model` string từ App.jsx (mặc định `claude-sonnet-4-6`)
- `max_tokens: 2000`
- System prompt gửi lên:
```
You are an academic assistant helping a Vietnamese student review their lecture.
Produce a structured summary IN VIETNAMESE with these sections:

## Tóm tắt buổi học
[2-3 câu mô tả tổng quan]

## Các điểm chính
[Bullet list tối đa 8 ý quan trọng nhất]

## Thuật ngữ nổi bật
[Bảng: Thuật ngữ tiếng Anh | Nghĩa tiếng Việt — chỉ từ chuyên ngành]

## Câu hỏi cần ôn lại
[2-3 câu hỏi gợi ý để tự kiểm tra]
```
- Input gửi lên: ghép segments theo format:
```
[EN]: What is the time complexity here?
[VI]: Độ phức tạp thời gian ở đây là gì?

[EN]: We use a hash map to reduce it to O(n).
[VI]: Chúng ta dùng hash map để giảm xuống O(n).
```
- Expose: `summarize(segments, model)` → Promise<string>, `isSummarizing` boolean

### `SummaryModal.jsx`
- Trigger: nút **"Tóm tắt & Lưu"** trên ControlBar
- Disabled nếu segments rỗng
- Khi đang xử lý: spinner + text "AI đang đọc buổi học..."
- Khi xong: render markdown tóm tắt (dùng `marked` từ CDN hoặc tự render)
- 3 nút ở cuối:
  - **"Lưu .md"** — file markdown: tóm tắt + full transcript
  - **"Lưu .txt"** — file text thuần, strip markdown symbols
  - **"Đóng"** — đóng modal
- Tên file tự động: `lecture_2025-01-15_14-30.md`
- Implement overlay bằng div thuần, không dùng thư viện

### `utils/exportFile.js`
```js
export function saveAsMarkdown(summary, segments, sessionDate) {
  const content = `# Ghi chú buổi học — ${sessionDate}\n\n${summary}\n\n---\n\n## Transcript đầy đủ\n\n` +
    segments.map(s => `**[EN]** ${s.en}\n**[VI]** ${s.vi ?? '(chưa dịch)'}`).join('\n\n');
  downloadFile(`lecture_${sessionDate}.md`, content, 'text/markdown');
}

export function saveAsTxt(summary, segments, sessionDate) {
  const plain = summary.replace(/#{1,3} /g, '').replace(/\*\*/g, '');
  const content = `GHI CHÚ BUỔI HỌC — ${sessionDate}\n${'='.repeat(40)}\n\n${plain}\n\n${'='.repeat(40)}\nTRANSCRIPT ĐẦY ĐỦ\n\n` +
    segments.map(s => `[EN] ${s.en}\n[VI] ${s.vi ?? '(chưa dịch)'}`).join('\n\n');
  downloadFile(`lecture_${sessionDate}.txt`, content, 'text/plain');
}

function downloadFile(filename, content, mimeType) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type: mimeType })),
    download: filename
  });
  a.click();
}
```

### Cập nhật Definition of Done
- [ ] Nút "Tóm tắt & Lưu" xuất hiện trên ControlBar, disabled khi chưa có transcript
- [ ] Nhấn nút → modal mở, AI tóm tắt trong ~5-10 giây
- [ ] Tóm tắt hiển thị đủ 4 section: Tóm tắt / Điểm chính / Thuật ngữ / Câu hỏi
- [ ] Nút "Lưu .md" tải về file markdown đúng format
- [ ] Nút "Lưu .txt" tải về file text thuần, không có ký tự markdown
- [ ] Tên file chứa ngày giờ buổi học

---

## Tính năng chọn Model

### UI — Model Selector
- Đặt ở đầu trang, dạng 3 control liền nhau:
  ```
  Nhận diện: [Web Speech ▼]   Dịch: [Haiku ▼] [● Bật]   Tóm tắt: [Sonnet ▼]
  ```
- **STT dropdown**: chọn engine nhận diện (Web Speech API / Deepgram Nova-2)
- **Dịch dropdown + toggle**: chọn Claude model và bật/tắt dịch
- **Tóm tắt dropdown**: chọn Claude model cho tóm tắt cuối buổi

### Danh sách model (hardcode, không fetch API)
```js
export const MODELS = [
  {
    id: 'claude-haiku-4-5-20251001',
    label: 'Haiku 4.5',
    note: 'Nhanh nhất, rẻ nhất',
    recommended: ['translation'],
  },
  {
    id: 'claude-sonnet-4-6',
    label: 'Sonnet 4.6',
    note: 'Cân bằng tốc độ & chất lượng',
    recommended: ['translation', 'summary'],
  },
  {
    id: 'claude-opus-4-6',
    label: 'Opus 4.6',
    note: 'Chất lượng cao nhất, chậm hơn',
    recommended: ['summary'],
  },
// ⚠️ Model ID canon — agent PHẢI dùng đúng các string này, không tự suy ra:
// 'claude-haiku-4-5-20251001'   (Haiku)
// 'claude-sonnet-4-6'           (Sonnet)
// 'claude-opus-4-6'             (Opus)
];
```

### Default
- Dịch realtime: `claude-haiku-4-5-20251001` (ưu tiên tốc độ)
- Tóm tắt: `claude-sonnet-4-6`

### State trong `App.jsx`
```js
const [translationModel, setTranslationModel] = useState('claude-haiku-4-5-20251001');
const [summaryModel, setSummaryModel] = useState('claude-sonnet-4-6'); // khớp MODELS list
```
- Truyền `translationModel` vào `useTranslation`
- Truyền `summaryModel` vào `useSummarize`
- Lưu lựa chọn vào `localStorage` để giữ sau khi reload trang

### UX nhỏ
- Mỗi option trong dropdown hiển thị tên model + note mờ phía sau: `Haiku 4.5 — Nhanh nhất, rẻ nhất`
- Disable dropdown khi đang có request đang chạy (đang dịch hoặc đang tóm tắt)
- Thêm vào file lưu tên model đã dùng:
  ```
  Dịch bằng: Haiku 4.5 | Tóm tắt bằng: Sonnet 4.6
  ```

### Cập nhật Definition of Done
- [ ] 3 control (STT / dịch+toggle / tóm tắt) hiển thị đúng vị trí, không che transcript
- [ ] Thay model dịch → các câu tiếp theo dùng model mới (câu cũ không bị re-dịch)
- [ ] Thay model tóm tắt → lần tóm tắt tiếp theo dùng model mới
- [ ] Lựa chọn được giữ lại sau khi reload trang (localStorage)
- [ ] Tên model xuất hiện trong file lưu


---

## Phần 1 — Nhận diện giọng (STT)

Người dùng **chọn 1 trong 2** engine, không chạy song song:

| Option | Engine | Chi phí | Phù hợp khi |
|---|---|---|---|
| Web Speech API | Browser built-in | Miễn phí | Giọng thầy dễ nghe |
| Deepgram Nova-2 | AI model | Trả phí (free tier $200) | Giọng Ấn khó nghe |

> Không dùng OpenAI Whisper vì Whisper là batch-based, không streaming realtime — sẽ bị lag lớn trong lớp học.

### UI — STT Dropdown
```
Nhận diện: [ Web Speech API ▼ ]
            > Web Speech API (miễn phí)
            > Deepgram Nova-2 (giọng Ấn tốt hơn)
```

### Hooks STT
```
src/hooks/
  ├── useSTT.js           # abstraction: nhận engine prop, gọi đúng hook bên dưới
  ├── useBrowserSTT.js    # Web Speech API
  └── useDeepgramSTT.js   # Deepgram WebSocket
```
`useSTT.js` expose cùng interface cho cả 2 engine: `start()`, `stop()`, `isListening` — App.jsx chỉ gọi `useSTT`, không biết engine nào đang chạy.

### `useBrowserSTT.js`
- `window.SpeechRecognition || window.webkitSpeechRecognition`
- Config: `lang = 'en-US'`, `continuous = true`, `interimResults = true`
- Auto restart khi `recognition.onend` nếu `isListening = true`
- Lỗi `no-speech` → silent ignore

### `useDeepgramSTT.js`
- WebSocket tới `wss://api.deepgram.com/v1/listen`
- Params: `model=nova-2&language=en-IN&punctuate=true&interim_results=true`
- Auth: header `Authorization: Token ${VITE_DEEPGRAM_API_KEY}`
- Flow: `getUserMedia` → `MediaRecorder` chunks → WebSocket → parse `is_final`
- Auto reconnect khi WebSocket đóng bất ngờ

### State STT trong `App.jsx`
```js
const [sttEngine, setSttEngine] = useState(
  localStorage.getItem('sttEngine') || 'browser'
); // 'browser' | 'deepgram'
```
- Đổi engine → stop engine cũ, start engine mới, **không xóa transcript**
- Chọn Deepgram mà `VITE_DEEPGRAM_API_KEY` trống → hiện warning, không cho start

### Cập nhật `.env.example`
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_DEEPGRAM_API_KEY=        # chỉ cần nếu dùng Deepgram
```

### Definition of Done — STT
- [ ] Dropdown chọn engine hoạt động, lưu localStorage
- [ ] Web Speech API → transcript realtime bình thường
- [ ] Deepgram + có key → WebSocket kết nối, nhận diện giọng Ấn tốt hơn
- [ ] Deepgram + không có key → warning rõ, không crash
- [ ] Đổi engine giữa buổi → transcript tiếp tục, không mất câu cũ


---

## Tính năng bật/tắt dịch

### Mục đích
Khi giáo viên nói giọng dễ nghe, người dùng có thể tắt dịch để chỉ xem transcript tiếng Anh — không gọi Claude API, không tốn chi phí.

### UI
Thêm 1 toggle switch nhỏ trên ControlBar, cạnh dropdown model dịch:

```
STT: [Browser ▼]   Dịch: [Haiku ▼] [● Bật]   Tóm tắt: [Sonnet ▼]
```

- Khi **Bật**: toggle xanh, dropdown model dịch enabled, mỗi câu gọi API dịch bình thường
- Khi **Tắt**: toggle xám, dropdown model dịch disabled (mờ), không gọi API — chỉ hiện tiếng Anh

### State trong `App.jsx`
```js
const [translationEnabled, setTranslationEnabled] = useState(true);
```
- Lưu vào localStorage
- Khi toggle tắt giữa chừng: các segment đang chờ dịch → hủy, hiện "(dịch đã tắt)" mờ
- Khi toggle bật lại: **không re-dịch** các câu cũ — chỉ dịch các câu mới từ đó trở đi

### Logic trong `App.jsx`
```js
function handleFinalResult(text) {
  const seg = { id: Date.now(), en: text, vi: null, skipped: false };
  addSegment(seg);

  if (!translationEnabled) {
    updateSegment(seg.id, { vi: null, skipped: true }); // không gọi API
    return;
  }
  translate(text, translationModel).then(vi => updateSegment(seg.id, { vi }));
}
```

### Hiển thị trong `SegmentItem.jsx`
- `vi = null` và `skipped = false` → skeleton loading (đang dịch)
- `vi = null` và `skipped = true` → không hiện gì cả (chỉ tiếng Anh)
- `vi = string` → hiện bản dịch bình thường

### Tóm tắt khi dịch đã tắt
- Nếu một phần transcript không có bản dịch VI → `useSummarize` vẫn chạy được, chỉ dùng phần EN
- Trong input gửi lên API: bỏ qua dòng `[VI]` cho các segment bị skip, chỉ gửi `[EN]`

### Cập nhật Definition of Done
- [ ] Toggle bật/tắt dịch hiển thị rõ trạng thái (xanh/xám)
- [ ] Tắt dịch → không gọi API, chỉ hiện tiếng Anh
- [ ] Bật lại → chỉ dịch câu mới, không đụng câu cũ
- [ ] Dropdown model dịch bị mờ khi toggle tắt
- [ ] Tóm tắt vẫn hoạt động dù một phần transcript không có VI
