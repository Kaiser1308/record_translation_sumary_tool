# Architecture — Speech Translator

Tài liệu này dành cho developer, mô tả kiến trúc, data flow, hooks, và các quyết định kỹ thuật chính.

## Tổng quan hệ thống

Ứng dụng là SPA React/Vite chạy hoàn toàn trên client:

- Input audio từ microphone
- STT qua 1 trong 3 engine (`Web Speech`, `Groq`, `Deepgram`)
- Dịch câu theo thời gian thực qua `callLLM`
- Tạo biên bản qua `useSummarize`
- Lưu/export transcript + summary

## High-level flow

```text
Audio Stream
  -> STT Engine
  -> onFinalResult(text, meta)
  -> Segment Object
  -> App State (segments, logs, records, filters...)
  -> TranscriptPanel / SpeakerFilter / SummaryModal
  -> RecordVault + Export
```

## Component hierarchy

```text
App
├── StatusIndicator
├── ModelSelector
├── SpeakerFilter
├── ControlBar
├── AudioMeter
├── TranscriptPanel
│   └── SegmentItem[]
├── SummaryModal
└── RecordVault
```

## State management

- Không dùng external store; state tập trung trong `App.jsx`.
- Dữ liệu chính:
  - `segments`
  - `logs`
  - `records`
  - `speakerNames`
  - model settings / flags
- Persistence bằng `localStorage`.
- Dùng `useRef` cho callback nhạy thời gian thực để tránh stale closure.

## Segment model

Mỗi đoạn transcript được chuẩn hóa thành object kiểu:

```text
{
  id,
  en, vi,
  speaker,
  timestamp,
  meetingLang,
  skipped,
  error
}
```

## STT layer

`useSTT` là abstraction chọn engine active và expose API đồng nhất:

- `start()`
- `stop()`
- `isListening`
- `interimText`
- `detectedSpeakers`
- `audioLevel`

### Web Speech (`useBrowserSTT`)

- Dựa trên `webkitSpeechRecognition`.
- Auto restart ở `onend` nếu đang listening.
- Có luồng mic cho meter và cơ chế fallback timeout để không treo start.

### Deepgram (`useDeepgramSTT`)

- Kết nối WebSocket Deepgram `listen`.
- English: bật diarization + utterances.
- Vietnamese: tắt diarization, xử lý final transcript.
- Có reconnect logic khi socket đóng ngoài ý muốn.

### Groq (`useGroqSTT`)

- Ghi âm chunk ngắn bằng `MediaRecorder`.
- Upload từng chunk sang Groq Whisper API.
- Trả transcript dạng incremental theo chunk.

## Audio meter

- Hook `useAudioLevel(stream)` dùng Web Audio API (`AnalyserNode`).
- Trả level chuẩn hóa 0..1.
- Có smoothing + throttling update UI để tránh re-render quá dày.
- Hiển thị qua `AudioMeter` bên dưới `ControlBar`.

## Translation pipeline

- Trigger khi có final segment mới (trừ trường hợp tắt dịch hoặc cuộc họp tiếng Việt).
- Gọi `useTranslation -> callLLM`.
- Ghi kết quả vào field ngôn ngữ đích của segment.
- Có retry thủ công qua nút `Dịch` trên từng segment.

## Summarization pipeline

- `useSummarize` nhận danh sách segment đã lọc.
- Prompt theo template markdown cố định.
- Chiến lược 2-pass:
  1. Sinh bản chính
  2. Nếu sai cấu trúc thì repair pass
- Nếu vẫn sai format -> fallback summary có cấu trúc tối thiểu.

## Records, vault, export

Mỗi record lưu cả 2 mẫu:

- `summary`: biên bản AI
- `fullScript`: transcript đầy đủ dạng markdown table

Ngoài ra lưu:

- `segments`
- `speakerNamesSnapshot`
- metadata model + timestamps

`RecordVault` và `SummaryModal` có 2 tab:

- `Tóm tắt (AI)`
- `Full script`

`exportFile.js` hỗ trợ export `.md` / `.txt` và dựng bảng transcript đầy đủ.

## Cost profile (ước tính 1 giờ)

- Web Speech STT: `$0`
- Groq STT: phụ thuộc free tier
- Deepgram STT: khoảng `$0.33`
- Dịch + tóm tắt tùy model (Gemini Flash thường thấp)

## Project structure

```text
src/
├── App.jsx
├── main.jsx
├── hooks/
│   ├── useSTT.js
│   ├── useBrowserSTT.js
│   ├── useDeepgramSTT.js
│   ├── useGroqSTT.js
│   ├── useAudioLevel.js
│   ├── useTranslation.js
│   └── useSummarize.js
├── components/
│   ├── ControlBar.jsx
│   ├── AudioMeter.jsx
│   ├── StatusIndicator.jsx
│   ├── ModelSelector.jsx
│   ├── SpeakerFilter.jsx
│   ├── TranscriptPanel.jsx
│   ├── SegmentItem.jsx
│   ├── SummaryModal.jsx
│   └── RecordVault.jsx
└── utils/
    ├── llm.js
    ├── models.js
    ├── speakerColors.js
    └── exportFile.js
```
