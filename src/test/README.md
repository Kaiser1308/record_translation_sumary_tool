# Automated Test Suite

This directory contains automated tests for the speech translator application.

## Test Structure

```
src/
├── hooks/
│   ├── useBrowserSTT.bug-analysis.test.js  # Bug analysis for Browser STT
│   ├── useDeepgramSTT.bug-analysis.test.js # Bug analysis for Deepgram STT
│   ├── useGroqSTT.bug-analysis.test.js     # Bug analysis for Groq STT
│   ├── useSTT.bug-analysis.test.js         # Bug analysis for STT orchestration
│   ├── useBrowserSTT.test.js               # Integration tests (TODO)
│   ├── useDeepgramSTT.test.js             # Integration tests (TODO)
│   ├── useGroqSTT.test.js                 # Integration tests (TODO)
│   └── useSTT.test.js                   # Integration tests (TODO)
└── test/
    ├── setup.js                          # Test environment setup
    └── (test utilities)                  # Shared test utilities
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run only bug analysis tests
npm run test:bug-analysis

# Run with coverage
npm run test:coverage

# Run specific test file
npm test useBrowserSTT.bug-analysis.test.js

# Run tests in CI mode (no watch, exit after completion)
npm test -- --run
```

## Test Categories

### 1. Bug Analysis Tests

These tests analyze the source code to identify potential bugs and verify the implementation:

- **useBrowserSTT.bug-analysis.test.js**: Analyzes memory leaks and race conditions
- **useDeepgramSTT.bug-analysis.test.js**: Analyzes WebSocket reconnection issues
- **useGroqSTT.bug-analysis.test.js**: Analyzes stop timeout issues
- **useSTT.bug-analysis.test.js**: Analyzes session guard logic

**Status**: ✅ All 16 tests passing

### 2. Integration Tests (TODO)

These tests will test the actual behavior of the hooks:

- Mock browser APIs (SpeechRecognition, WebSocket, MediaRecorder)
- Test state transitions
- Test session isolation
- Test error handling

## Recent Findings

### Confirmed Bugs

1. **Bug #4: Missing stop timeout in useGroqSTT** (Medium severity)
   - **Location**: `src/hooks/useGroqSTT.js:148-174`
   - **Issue**: No timeout protection if MediaRecorder.stop() hangs
   - **Fix**: Added 2-second timeout to resolve the promise
   - **Status**: ✅ Fixed

### False Positives

1. **Bug #1: Memory leak in useBrowserSTT** - Not a bug, code is correct
2. **Bug #2: Race condition in useBrowserSTT** - Not a bug, code is correct
3. **Bug #3: WebSocket reconnection in useDeepgramSTT** - Not a bug, code is correct

See [BUG_REPORT.md](../BUG_REPORT.md) for detailed analysis.

## Test Environment

Tests use:

- **Vitest**: Test runner
- **@testing-library/react**: React component testing
- **jsdom**: Browser environment simulation
- **vi**: Vitest's mocking utilities

### Mocked Browser APIs

- `SpeechRecognition` / `webkitSpeechRecognition`
- `WebSocket`
- `MediaRecorder`
- `navigator.mediaDevices.getUserMedia()`
- `fetch`

See `src/test/setup.js` for mock implementations.

## Adding New Tests

1. Create a test file: `src/hooks/<hookname>.test.js`
2. Import dependencies:
   ```javascript
   import { renderHook, act, waitFor } from '@testing-library/react';
   import { describe, it, expect, vi } from 'vitest';
   import useHook from './useHook';
   ```
3. Write tests:
   ```javascript
   describe('useHook', () => {
     it('should do something', () => {
       const { result } = renderHook(() => useHook());
       expect(result.current.value).toBe(true);
     });
   });
   ```

## Coverage

To generate coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

## Sprint 1 Test Plan

For manual testing based on Sprint 1 stability requirements, see:

- [SPRINT1_TEST_PLAN.md](../SPRINT1_TEST_PLAN.md) - Comprehensive stability test plan
- [STABILITY_PLAN.md](../STABILITY_PLAN.md) - Stability improvement goals
- [SPRINT1_TASKS.md](../SPRINT1_TASKS.md) - Sprint 1 task list

## CI/CD Integration

Tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test -- --run

- name: Run bug analysis
  run: npm run test:bug-analysis

- name: Generate coverage
  run: npm run test:coverage
```
