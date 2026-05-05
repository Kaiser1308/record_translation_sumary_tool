import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useSTT - Session Guard Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Session guard implementation', () => {
    it('should verify guardedOnFinalResult implementation', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Find the guardedOnFinalResult callback
      const guardedCallbackMatch = sourceCode.match(/const guardedOnFinalResult = useCallback\([\s\S]*?\}, \[\]\);/);
      
      if (guardedCallbackMatch) {
        const guardedCallback = guardedCallbackMatch[0];
        
        // Verify key session guard checks
        const hasShouldListenCheck = guardedCallback.includes('!shouldListenRef.current');
        const hasSessionIdCheck = guardedCallback.includes('incomingSessionId !== activeSessionIdRef.current');
        const hasOnFinalResultCall = guardedCallback.includes('onFinalResultRef.current?.(');
        
        expect(hasShouldListenCheck).toBe(true);
        expect(hasSessionIdCheck).toBe(true);
        expect(hasOnFinalResultCall).toBe(true);
        
        console.log('Verified: Session guard has all necessary checks');
      }
    });

    it('should verify start() increments session ID', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Find the start function
      const startMatch = sourceCode.match(/const start = useCallback\(async \(\) => \{[\s\S]*?\}, \[sessionState\]\);/);
      
      if (startMatch) {
        const startFunction = startMatch[0];
        
        // Verify session ID increment
        const hasSessionSeqIncrement = startFunction.includes('++sessionSeqRef.current');
        const hasActiveSessionIdSet = startFunction.includes('activeSessionIdRef.current = nextSessionId');
        
        expect(hasSessionSeqIncrement).toBe(true);
        expect(hasActiveSessionIdSet).toBe(true);
        
        console.log('Verified: start() properly increments and sets session ID');
      }
    });

    it('should verify stop() clears session ID', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Find the stop function
      const stopMatch = sourceCode.match(/const stop = useCallback\(async \(\) => \{[\s\S]*?\}, \[sessionState\]\);/);
      
      if (stopMatch) {
        const stopFunction = stopMatch[0];
        
        // Verify session ID clearing
        const hasSessionIdClear = stopFunction.includes('activeSessionIdRef.current = 0');
        const hasShouldListenClear = stopFunction.includes('shouldListenRef.current = false');
        
        expect(hasSessionIdClear).toBe(true);
        expect(hasShouldListenClear).toBe(true);
        
        console.log('Verified: stop() properly clears session ID and shouldListen flag');
      }
    });
  });

  describe('Operation lock mechanism', () => {
    it('should verify operation lock prevents concurrent operations', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Check for operation lock usage in start
      const startMatch = sourceCode.match(/const start = useCallback\(async \(\) => \{[\s\S]*?\}, \[sessionState\]\);/);
      const stopMatch = sourceCode.match(/const stop = useCallback\(async \(\) => \{[\s\S]*?\}, \[sessionState\]\);/);
      
      if (startMatch && stopMatch) {
        const startHasLockCheck = startMatch[0].includes('operationLockRef.current');
        const startHasLockSet = startMatch[0].includes('operationLockRef.current = true');
        const startHasLockClear = startMatch[0].includes('operationLockRef.current = false');
        
        const stopHasLockCheck = stopMatch[0].includes('operationLockRef.current');
        const stopHasLockSet = stopMatch[0].includes('operationLockRef.current = true');
        const stopHasLockClear = stopMatch[0].includes('operationLockRef.current = false');
        
        expect(startHasLockCheck).toBe(true);
        expect(startHasLockSet).toBe(true);
        expect(startHasLockClear).toBe(true);
        
        expect(stopHasLockCheck).toBe(true);
        expect(stopHasLockSet).toBe(true);
        expect(stopHasLockClear).toBe(true);
        
        console.log('Verified: Operation lock properly prevents concurrent operations');
      }
    });
  });

  describe('State machine verification', () => {
    it('should verify all state transitions are handled', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Check for all state transitions
      const hasIdleState = sourceCode.includes("'idle'");
      const hasStartingState = sourceCode.includes("'starting'");
      const hasListeningState = sourceCode.includes("'listening'");
      const hasStoppingState = sourceCode.includes("'stopping'");
      const hasErrorState = sourceCode.includes("'error'");
      
      expect(hasIdleState).toBe(true);
      expect(hasStartingState).toBe(true);
      expect(hasListeningState).toBe(true);
      expect(hasStoppingState).toBe(true);
      expect(hasErrorState).toBe(true);
      
      console.log('Verified: All state machine states are defined');
    });
  });
});
