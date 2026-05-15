# Speech Translator Web App

A browser-based speech translation application for meetings and classes. The app captures microphone audio, generates realtime transcripts, translates between English and Vietnamese, and creates AI-powered meeting summaries.

Ứng dụng web hỗ trợ ghi âm cuộc họp/lớp học, tạo transcript theo thời gian thực, dịch Anh-Việt và sinh biên bản/tóm tắt bằng AI.

## Project Overview

| English | Tiếng Việt |
| --- | --- |
| A local-first web app for realtime speech transcription, translation, and AI meeting notes. | Ứng dụng web ưu tiên chạy local để ghi âm, nhận dạng giọng nói, dịch và tạo biên bản AI. |
| Designed for meetings, classrooms, and live discussions using one microphone-enabled device. | Phù hợp cho cuộc họp, lớp học và buổi thảo luận trực tiếp với một thiết bị thu âm trung tâm. |
| Supports multiple STT engines so users can balance cost, accuracy, and setup complexity. | Hỗ trợ nhiều engine STT để người dùng lựa chọn theo chi phí, độ chính xác và độ phức tạp khi cài đặt. |

## Features

| Feature | Description | Mô tả |
| --- | --- | --- |
| Realtime transcription | Converts microphone audio into live transcript segments. | Chuyển âm thanh từ microphone thành transcript theo thời gian thực. |
| English-Vietnamese translation | Translates transcript content between English and Vietnamese. | Dịch nội dung transcript giữa tiếng Anh và tiếng Việt. |
| Multiple STT engines | Supports Web Speech API, Groq Whisper, and Deepgram Nova-2. | Hỗ trợ Web Speech API, Groq Whisper và Deepgram Nova-2. |
| Speaker diarization | Identifies speakers when using Deepgram with English audio. | Phân biệt người nói khi dùng Deepgram với âm thanh tiếng Anh. |
| AI meeting summary | Generates structured meeting notes from transcript segments. | Tạo biên bản/tóm tắt có cấu trúc từ transcript. |
| Record vault | Saves summaries and full scripts in local browser storage. | Lưu tóm tắt và full script trong localStorage của trình duyệt. |
| Export | Exports summaries or transcripts as `.md` / `.txt` files. | Xuất biên bản hoặc transcript thành file `.md` / `.txt`. |
| Audio meter | Shows realtime microphone input level. | Hiển thị mức tín hiệu microphone theo thời gian thực. |

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, JavaScript |
| Speech-to-text | Web Speech API, Groq Whisper, Deepgram Nova-2 |
| Browser audio | MediaRecorder, Web Audio API |
| AI integration | Configurable LLM providers through environment variables |
| Storage | localStorage |
| Markdown rendering | marked, DOMPurify |
| Testing | Vitest, Testing Library, jsdom, happy-dom |

## STT Engine Comparison

| Engine | Strengths | Notes |
| --- | --- | --- |
| Web Speech API | No API key required, fast setup, useful for demos. | Browser-dependent quality; Vietnamese recognition may be unstable. |
| Groq Whisper | Fast Whisper-based transcription with simple API usage. | Does not provide built-in speaker diarization in this app. |
| Deepgram Nova-2 | Strong realtime STT support and speaker diarization for English. | Requires a Deepgram API key and usage-based billing. |

## Architecture

```text
Audio Stream
  -> STT Engine
  -> Final Transcript Segment
  -> App State
  -> Translation Pipeline
  -> Transcript UI
  -> AI Summary
  -> Record Vault / Export
```

Main application areas:

| Area | Responsibility |
| --- | --- |
| `src/App.jsx` | Central app state, transcript segments, logs, records, filters, and user actions. |
| `src/hooks/useSTT.js` | Unified STT abstraction for browser, Groq, and Deepgram engines. |
| `src/hooks/useTranslation.js` | Handles translation requests for transcript segments. |
| `src/hooks/useSummarize.js` | Generates AI meeting summaries from selected transcript data. |
| `src/components/` | UI components for controls, transcript, audio meter, summaries, and record vault. |
| `src/utils/` | LLM calls, model config, export helpers, speaker colors, and HTML sanitization. |

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome or Edge recommended
- At least one API key for translation or summarization
- Optional: Deepgram or Groq API key for cloud STT

### Installation

```bash
git clone <repository-url>
cd translation-tool
npm install
cp .env.example .env
npm run dev
```

Open:

```text
http://localhost:5173
```

## Environment Variables

Create a `.env` file from `.env.example` and add the keys you want to use.

```env
VITE_ANTHROPIC_API_KEY=
VITE_GEMINI_API_KEY=
VITE_OPENAI_API_KEY=
VITE_DEEPSEEK_API_KEY=
VITE_GROQ_API_KEY=
VITE_GLM_API_KEY=
VITE_DEEPGRAM_API_KEY=
```

Recommended setup:

| Goal | Suggested config |
| --- | --- |
| Quick demo without paid STT | Use Web Speech API and configure one LLM provider. |
| Better transcription quality | Add `VITE_GROQ_API_KEY` or `VITE_DEEPGRAM_API_KEY`. |
| Speaker diarization | Use Deepgram with English meeting audio. |

## Usage

1. Choose an STT engine: Web Speech API, Groq Whisper, or Deepgram Nova-2.
2. Choose the meeting language: English or Vietnamese.
3. Start recording and allow microphone permission.
4. Monitor realtime transcript and microphone audio level.
5. Generate an AI meeting summary after the session.
6. Review either the AI summary or full transcript.
7. Save the record locally or export it as `.md` / `.txt`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Build the production bundle. |
| `npm run preview` | Preview the production build locally. |
| `npm test` | Run the Vitest test suite. |
| `npm run test:coverage` | Run tests with coverage. |
| `npm run gitnexus:status` | Check GitNexus project index status. |
| `npm run gitnexus:analyze` | Re-analyze the project with GitNexus. |

## Troubleshooting

| Issue | Suggested fix |
| --- | --- |
| No transcript appears | Wait a few seconds after starting, then check microphone permission and browser support. |
| Web Speech quality is poor | Try Groq Whisper or Deepgram, especially for Vietnamese or noisy environments. |
| Deepgram does not connect | Check `VITE_DEEPGRAM_API_KEY` and network access. |
| Audio meter is not moving | Confirm the browser has microphone permission and the selected input device is active. |
| Summary generation fails | Check that at least one LLM API key is configured correctly. |

## Documentation

| Document | Purpose |
| --- | --- |
| `ARCHITECTURE.md` | Developer architecture, hooks, data flow, and technical decisions. |
| `DESIGN.md` | UI and product design notes. |
| `PROJECT_OVERVIEW.md` | Product overview, goals, and roadmap. |
| `Issue.md` | STT quality notes, known limitations, and improvement ideas. |
| `STABILITY_PLAN.md` | Stability improvement plan and checklist. |
| `TEST_PLAN.md` | Testing strategy and validation notes. |

## Project Status

This project is a working prototype focused on practical AI-assisted meeting workflows:

- Realtime transcript generation
- English-Vietnamese translation
- AI meeting notes
- Local record storage
- Markdown/text export
- Multiple STT engine support

Future improvements may include backend key management, stronger privacy controls, glossary support, and deeper evaluation of STT quality across real meeting environments.
