# Speech Translator — Transcript & Dịch Realtime

Web app chạy localhost giúp nghe giảng/cuộc họp và:
- Hiển thị transcript realtime (tiếng Anh hoặc tiếng Việt)
- Dịch tự động sang ngôn ngữ kia sau mỗi câu
- Phân loại người nói (Speaker Diarization) khi dùng Deepgram
- Tóm tắt toàn bộ buổi họp bằng AI thành biên bản cấu trúc
- Hiển thị thanh audio meter realtime để biết mic có nhận tín hiệu
- Lưu biên bản theo 2 mẫu: bản tóm tắt AI + bản full script
- Xuất ra file (.md / .txt) hoặc lưu vào kho localStorage

---

## Yêu cầu

- **Node.js** 18+
- **Chrome** hoặc **Edge** (Web Speech API chỉ hỗ trợ 2 browser này)
- Ít nhất **1 API key** cho dịch/tóm tắt (xem bên dưới)

---

## Cài đặt & Chạy

```bash
# 1. Clone hoặc tải project
cd translation-tool

# 2. Cài dependencies
npm install

# 3. Tạo file .env từ template
cp .env.example .env
# Mở .env và điền API key (xem hướng dẫn bên dưới)

# 4. Chạy
npm run dev
# Mở http://localhost:5173 trên Chrome/Edge
```

---

## API Keys

Điền vào file `.env` — chỉ cần điền key của service bạn muốn dùng:

| Biến | Service | Lấy key tại | Ghi chú |
|------|---------|-------------|---------|
| `VITE_ANTHROPIC_API_KEY` | Claude (Anthropic) | [console.anthropic.com](https://console.anthropic.com) | Haiku, Sonnet |
| `VITE_GEMINI_API_KEY` | Gemini (Google) | [aistudio.google.com](https://aistudio.google.com) | Flash miễn phí |
| `VITE_OPENAI_API_KEY` | GPT (OpenAI) | [platform.openai.com](https://platform.openai.com) | GPT-4o, GPT-4o Mini |
| `VITE_DEEPSEEK_API_KEY` | DeepSeek | [platform.deepseek.com](https://platform.deepseek.com) | Rẻ, mã nguồn mở |
| `VITE_GROQ_API_KEY` | Groq | [console.groq.com](https://console.groq.com) | Siêu nhanh |
| `VITE_GLM_API_KEY` | Zhipu GLM | [open.bigmodel.cn](https://open.bigmodel.cn) | GLM-4 Flash miễn phí |
| `VITE_DEEPGRAM_API_KEY` | Deepgram | [console.deepgram.com](https://console.deepgram.com) | STT, free tier $200 |

> **Tối thiểu**: Điền 1 key dịch (ví dụ Gemini hoặc GLM-4 Flash miễn phí) + 1 key Deepgram nếu muốn dùng tính năng phân loại người nói.

---

## Tính năng

### Nhận diện giọng nói (STT)

| Ngôn ngữ | Chế độ hoạt động |
|----------|-----------------|
| **Tiếng Anh** | STT nhận tiếng Anh, mỗi câu tự động dịch sang tiếng Việt |
| **Tiếng Việt** | STT nhận tiếng Việt, chỉ hiển thị transcript (không gọi API dịch) |

Chọn 1 trong 3 engine STT:

| Engine | Ưu điểm | Nhược điểm |
|--------|---------|------------|
| **Web Speech API** | Miễn phí, không cần key | Không phân loại speaker, tiếng Việt không ổn định |
| **Groq Whisper V3** | Tốc độ siêu nhanh, tiếng Việt rất chuẩn | Cần API key Groq, không có phân loại người nói |
| **Deepgram Nova-2** | Chính xác, **phân loại người nói** (EN), hỗ trợ tiếng Việt | Cần API key (free tier $200) |

### Phân loại người nói (Speaker Diarization)

> Chỉ hoạt động khi dùng **Deepgram** + **Tiếng Anh**

- Deepgram tự động nhận diện và gán label cho mỗi đoạn
- Mỗi speaker có **màu riêng** — hiện badge trước text
- **Đặt tên speaker**: click icon → nhập tên
- **Filter speaker**: toggle off speaker → segments mới từ speaker đó bị bỏ qua
- Segments cùng speaker liên tiếp → gộp thành đoạn văn
- Nút "Tất cả" / "Không" để chọn/bỏ chọn nhanh

### Dịch realtime

- Mỗi câu hoàn chỉnh → gọi AI dịch (~1-2 giây)
- Chọn model dịch từ 6+ providers (Anthropic, Google, OpenAI, DeepSeek, Groq, Zhipu)
- Toggle bật/tắt dịch — tắt = chỉ hiện transcript gốc, không tốn API
- Nút "Dịch" inline để dịch lại từng câu đã bỏ qua

### Tóm tắt buổi họp

- Nhấn **"Tạo biên bản"** → AI tạo biên bản cấu trúc gồm 7 mục:
  - Biên bản tóm tắt
  - Nội dung đã thảo luận (chi tiết)
  - Quyết định và thống nhất
  - Hành động tiếp theo
  - Rủi ro / vướng mắc
  - Thuật ngữ và từ khóa quan trọng
  - Câu hỏi mở cần theo dõi
- Tóm tắt chỉ bao gồm segments từ **speakers đang được chọn** trong filter
- 2-pass generation: nếu lần 1 sai format → tự động gọi lại
- Trong modal biên bản có 2 tab:
  - **Tóm tắt (AI)**: nội dung biên bản theo mẫu 7 mục
  - **Full script**: bảng transcript đầy đủ (thời gian, người nói, EN, VI)
- Lưu vào **Kho biên bản** sẽ lưu cả 2 mẫu ở trên
- Lưu ra file `.md` hoặc `.txt` cũng kèm bảng full script

### Audio meter realtime

- Thanh meter hiển thị ngay dưới `ControlBar`
- Khi mic nhận âm thanh: thanh dao động theo cường độ
- Khi dừng ghi âm: meter về 0
- Dùng `Web Audio API` qua hook `useAudioLevel`

---

## Kiến trúc phần mềm

### Tổng quan

```
┌─────────────────────────────────────────────────────┐
│                    Browser (SPA)                     │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Microphone│  │  Web Speech │  │  Deepgram WS   │  │
│  │  (MediaAPI)│  │  API        │  │  (nova-2)      │  │
│  └─────┬─────┘  └─────┬─────┘  └────────┬─────────┘  │
│        │              │                  │            │
│        └──────┬───────┘──────────────────┘            │
│               │                                      │
│        ┌──────▼──────┐                               │
│        │   useSTT    │  ← Abstraction layer           │
│        └──────┬──────┘                               │
│               │ segments[]                            │
│        ┌──────▼──────┐    ┌──────────────┐           │
│        │   App.jsx   │───▶│ useTranslation│           │
│        │  (State mgr)│    └──────┬───────┘           │
│        └──────┬──────┘           │                    │
│               │                  ▼                    │
│        ┌──────▼──────┐   ┌──────────────┐            │
│        │ useSummarize │   │   callLLM    │            │
│        └─────────────┘   │ (multi-prov) │            │
│                           └──────┬───────┘            │
│                                  │                    │
│              ┌───────────────────┼───────────────┐    │
│              ▼         ▼         ▼        ▼      ▼    │
│          Anthropic  Gemini   OpenAI  DeepSeek  ...   │
└─────────────────────────────────────────────────────┘
```

### Data flow

```
Audio Stream → STT Engine → onFinalResult(text, {speaker})
                                  │
                                  ▼
                           Segment Object
                           {id, en, vi, speaker, timestamp, ...}
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼              ▼
             TranscriptPanel  Translation    SpeakerFilter
             (hiển thị)      (callLLM)      (lọc speakers)
                                  │
                                  ▼
                            SummaryModal
                            (useSummarize)
                                  │
                                  ▼
                          RecordVault / Export
                          (localStorage / file)
```

### Component hierarchy

```
App
├── StatusIndicator        # Dot + trạng thái listening
├── ModelSelector          # Chọn STT engine, model dịch, model tóm tắt, ngôn ngữ
├── SpeakerFilter          # Panel filter speakers (chỉ hiện khi Deepgram)
├── ControlBar             # Nút Start/Stop/Clear/Tóm tắt/Kho biên bản
├── AudioMeter             # Thanh mức âm thanh realtime
├── TranscriptPanel        # Danh sách segments (gộp cùng speaker liên tiếp)
│   └── SegmentItem[]      # 1 segment: EN + VI + speaker badge + nút dịch
├── SummaryModal           # Modal biên bản (tab Summary/Full script)
└── RecordVault            # Modal kho lưu trữ records (tab Summary/Full script)
```

### Hooks

| Hook | Chức năng |
|------|-----------|
| `useSTT` | Abstraction layer — chọn engine (Browser/Deepgram/Groq), quản lý lifecycle |
| `useBrowserSTT` | Web Speech API — `webkitSpeechRecognition`, auto-restart, tiếng Việt timeout |
| `useDeepgramSTT` | Deepgram WebSocket — `nova-2`, utterances diarization, reconnect |
| `useGroqSTT` | Groq Whisper V3 REST API — ghi âm từng đoạn và upload, tiếng Việt cực chuẩn |
| `useAudioLevel` | Đo mức tín hiệu mic (0-1) từ `MediaStream` để vẽ audio meter |
| `useTranslation` | Gọi `callLLM` để dịch từng segment |
| `useSummarize` | Gọi `callLLM` để tạo biên bản (2-pass nếu sai format) |

### Utils

| File | Chức năng |
|------|-----------|
| `llm.js` | Multi-provider LLM wrapper — Anthropic REST, Gemini REST, OpenAI-compatible REST (OpenAI, DeepSeek, Groq, GLM) |
| `models.js` | Danh sách models + providers + nhóm cho dropdown |
| `speakerColors.js` | Palette 8 màu cho speaker badges |
| `exportFile.js` | Xuất biên bản ra `.md` / `.txt` |

### State management

- **Không dùng external state library** — toàn bộ state nằm trong `App.jsx` (React `useState`)
- **localStorage persistence**: segments, logs, records, speaker names, settings
- **Ref pattern**: `onFinalResult`, `translationEnabled`, `translate` được giữ qua `useRef` để tránh re-render loop khi callback thay đổi

### STT Engine chi tiết

**Web Speech API** (`useBrowserSTT`):
- Dùng `webkitSpeechRecognition` built-in Chrome/Edge
- `continuous=true`, `interimResults=true`
- Auto-restart khi `onend` fire (Chrome tự stop mỗi ~60s)
- Tiếng Việt: auto-restart timeout 5s, sau 3 lần liên tiếp không có kết quả → alert khuyên dùng Deepgram

**Deepgram** (`useDeepgramSTT`):
- WebSocket `wss://api.deepgram.com/v1/listen`
- Model `nova-2`, `smart_format=true`
- **Tiếng Anh**: `diarize=true`, `utterances=true`, `utt_split=0.8`, `min_speakers=2`, `max_speakers=5`
- **Tiếng Việt**: tắt diarize (Deepgram chưa hỗ trợ cho vi), dùng `is_final` results
- Parse utterances response cho EN → mỗi utterance có speaker riêng
- Fallback: parse `words[].speaker` bằng majority-vote nếu không có utterances
- Auto-reconnect khi WebSocket close

### Chi phí ước tính (1 cuộc họp 1 tiếng)

| Hạng mục | Chi phí |
|----------|---------|
| Web Speech API STT | $0 |
| Groq Whisper V3 STT | $0 (Free Tier) |
| Deepgram Nova-2 STT | ~$0.33 |
| Dịch (Gemini Flash) | ~$0.02 |
| Tóm tắt (Gemini Flash) | ~$0.01 |
| **Tổng (Deepgram + Gemini Flash)** | **~$0.36** |
| **Tổng (Web Speech + GLM-4 Flash)** | **$0** |

---

## Cấu trúc project

```
src/
├── App.jsx                     # Component chính, state management
├── App.css                     # Design system variables + global styles
├── main.jsx                    # Entry point
├── hooks/
│   ├── useSTT.js               # Abstraction layer cho STT engines
│   ├── useBrowserSTT.js        # Web Speech API + auto-restart
│   ├── useDeepgramSTT.js       # Deepgram WebSocket + utterances diarization
│   ├── useGroqSTT.js           # Groq Whisper API STT
│   ├── useAudioLevel.js        # Tính mức âm thanh realtime
│   ├── useTranslation.js       # Gọi AI dịch
│   └── useSummarize.js         # Gọi AI tóm tắt (2-pass)
├── components/
│   ├── ControlBar.jsx          # Start/Stop/Clear/Tóm tắt
│   ├── AudioMeter.jsx          # Thanh audio meter
│   ├── StatusIndicator.jsx     # Trạng thái nghe (dot + text)
│   ├── ModelSelector.jsx       # Dropdown chọn engine/model/toggle dịch
│   ├── SpeakerFilter.jsx       # Panel phân loại người nói
│   ├── TranscriptPanel.jsx     # Danh sách segments (merge by speaker)
│   ├── SegmentItem.jsx         # 1 đoạn transcript + dịch + speaker badge
│   ├── SummaryModal.jsx        # Modal biên bản (summary/full script)
│   ├── RecordVault.jsx         # Kho biên bản (summary/full script)
│   └── ActivityLog.jsx         # Log hoạt động (ẩn trên mobile)
└── utils/
    ├── llm.js                  # Multi-provider LLM API wrapper
    ├── models.js               # Danh sách models + providers
    ├── speakerColors.js        # Palette màu speaker
    └── exportFile.js           # Xuất .md / .txt
```

---

## Design System

UI được thiết kế theo phong cách Cursor — warm minimalism:

| Element | Giá trị |
|---------|---------|
| Background | `#f2f1ed` (warm cream) |
| Text | `#26251e` (warm near-black) |
| Accent | `#f54e00` (cursor orange) |
| Error/Hover | `#cf2d56` (warm crimson) |
| Success | `#1f8a65` (muted teal) |
| Border | `rgba(38, 37, 30, 0.1)` (warm brown 10%) |
| Border radius | 8px (standard), 10px (featured), 9999px (pill) |
| Button padding | `10px 12px 10px 14px` |
| Font | DM Sans (UI) + JetBrains Mono (code) |
| Hover | Text → `#cf2d56` (warm crimson shift) |
| Shadow (elevated) | `rgba(0,0,0,0.14) 0px 28px 70px, rgba(0,0,0,0.1) 0px 14px 32px` |

Chi tiết đầy đủ: xem [DESIGN.md](./DESIGN.md)

---

## Troubleshooting

| Vấn đề | Giải pháp |
|--------|-----------|
| Không nghe được | Kiểm tra quyền mic trong Chrome (icon khóa trên thanh địa chỉ) |
| Bấm Bắt đầu nhưng không ra script | Chờ ~1-3 giây để mic + STT khởi tạo; kiểm tra Console có log `[BrowserSTT]`/`[DeepgramSTT]`; thử reload và cấp lại quyền mic |
| Lỗi API dịch/tóm tắt | Kiểm tra API key trong `.env` — phải khớp provider đang chọn |
| Dịch chậm | Bình thường (~1-2s/câu). Chọn Gemini Flash hoặc GLM-4 Flash để nhanh hơn |
| Web Speech tiếng Việt không chạy | Web Speech API không hỗ trợ tốt tiếng Việt. Chuyển sang Deepgram |
| Deepgram không kết nối | Kiểm tra `VITE_DEEPGRAM_API_KEY` trong `.env` |
| Audio meter không nhúc nhích | Kiểm tra quyền microphone và đảm bảo đang ở trạng thái `Đang nghe`; thử đổi sang Deepgram/Groq |
| Speaker filter không hiện | Chỉ hiện khi dùng Deepgram + tiếng Anh + đã phát hiện >= 1 speaker |
| Đổi engine không dừng | Đã xử lý tự động — engine cũ sẽ dừng khi chuyển |

---

## Tech Stack

- **React 18** + **Vite 5** — SPA, no backend
- **Web Speech API** — STT miễn phí (Chrome/Edge)
- **Groq Whisper V3** — STT siêu tốc, miễn phí API
- **Deepgram Nova-2** — STT + Speaker Diarization (WebSocket)
- **Multi-provider LLM** — Anthropic, Google, OpenAI, DeepSeek, Groq, Zhipu
- **marked** — Render markdown cho tóm tắt
