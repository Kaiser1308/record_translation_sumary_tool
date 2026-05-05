// Mock browser APIs for testing
import { vi } from 'vitest';

// Mock SpeechRecognition
class MockSpeechRecognition {
  constructor() {
    this.lang = 'en-US';
    this.continuous = true;
    this.interimResults = true;
    this.maxAlternatives = 1;
    this.onresult = null;
    this.onerror = null;
    this.onend = null;
    this.onstart = null;
  }

  start() {
    if (this.onstart) this.onstart();
    return Promise.resolve();
  }

  stop() {
    if (this.onend) this.onend();
    return Promise.resolve();
  }

  abort() {
    if (this.onend) this.onend();
  }
}

global.SpeechRecognition = MockSpeechRecognition;
global.webkitSpeechRecognition = MockSpeechRecognition;

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0; // CONNECTING
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
  }

  send(data) {
    // Mock send
  }

  close() {
    this.readyState = 3; // CLOSED
    if (this.onclose) {
      this.onclose({ code: 1000, reason: 'Normal closure' });
    }
  }
}

global.WebSocket = MockWebSocket;

// Mock MediaRecorder
class MockMediaRecorder {
  constructor(stream, options = {}) {
    this.stream = stream;
    this.options = options;
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
    this.mimeType = options.mimeType || 'audio/webm';
  }

  start(timeslice) {
    this.state = 'recording';
    if (timeslice) {
      this._timesliceTimer = setTimeout(() => {
        if (this.state === 'recording') {
          const blob = new Blob(['mock audio data'], { type: this.mimeType });
          if (this.ondataavailable) {
            this.ondataavailable({ data: blob });
          }
        }
      }, timeslice);
    }
  }

  stop() {
    this.state = 'inactive';
    if (this._timesliceTimer) {
      clearTimeout(this._timesliceTimer);
    }
    if (this.onstop) {
      this.onstop();
    }
  }

  static isTypeSupported(type) {
    return true;
  }
}

global.MediaRecorder = MockMediaRecorder;

// Mock MediaStream
class MockMediaStream {
  constructor() {
    this.tracks = [
      {
        kind: 'audio',
        enabled: true,
        stop: vi.fn(),
      }
    ];
  }

  getTracks() {
    return this.tracks;
  }
}

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: vi.fn(() => Promise.resolve(new MockMediaStream())),
};

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ text: 'Mock transcription' }),
  })
);

// Mock alert
global.alert = vi.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
