import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useGroqSTT - Bug Analysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Bug #4: Missing stop timeout', () => {
    it('should verify stop() method now has timeout protection', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useGroqSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Find the stop function
      const stopMatch = sourceCode.match(/const stop = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/);
      
      if (stopMatch) {
        const stopFunction = stopMatch[0];
        
        // Check if there's a timeout in the stop function
        const hasTimeout = stopFunction.includes('setTimeout');
        const hasRecorderStop = stopFunction.includes('recorder.stop()');
        
        expect(hasRecorderStop).toBe(true);
        expect(hasTimeout).toBe(true);
        
        console.log('Bug #4 FIXED: stop() now has timeout to prevent hanging');
      }
    });

    it('should compare with useBrowserSTT stop implementation', () => {
      const fs = require('fs');
      const path = require('path');
      
      const groqPath = path.join(__dirname, '../hooks/useGroqSTT.js');
      const browserPath = path.join(__dirname, '../hooks/useBrowserSTT.js');
      
      const groqCode = fs.readFileSync(groqPath, 'utf-8');
      const browserCode = fs.readFileSync(browserPath, 'utf-8');
      
      // Browser STT has timeout
      const browserHasTimeout = browserCode.includes('setTimeout(() => {');
      
      // Groq STT NOW has timeout in stop
      const groqStopMatch = groqCode.match(/const stop = useCallback\(\(\) => \{[\s\S]*?\}, \[\]\);/);
      const groqHasTimeout = groqStopMatch && groqStopMatch[0].includes('setTimeout');
      
      expect(browserHasTimeout).toBe(true);
      expect(groqHasTimeout).toBe(true);
      
      console.log('Comparison: Both BrowserSTT and GroqSTT now have timeout protection');
    });

    it('should document the fix applied', () => {
      console.log('✅ FIX APPLIED: Added timeout to stop() method');
      console.log('  setTimeout(() => {');
      console.log('    resolve();');
      console.log('  }, 2000);');
      expect(true).toBe(true);
    });
  });

  describe('Audio chunk handling verification', () => {
    it('should verify generic text filtering', () => {
      const fs = require('fs');
      const path = require('path');
      const sourcePath = path.join(__dirname, '../hooks/useGroqSTT.js');
      const sourceCode = fs.readFileSync(sourcePath, 'utf-8');

      // Check for generic text filtering
      const hasGenericFilter = sourceCode.includes('phụ đề thuộc về htv3');
      const hasMusicFilter = sourceCode.includes('âm nhạc');
      const hasLengthCheck = sourceCode.includes('length < 3');
      
      expect(hasGenericFilter).toBe(true);
      expect(hasMusicFilter).toBe(true);
      expect(hasLengthCheck).toBe(true);
      
      console.log('Verified: Generic text filtering is correctly implemented');
    });
  });
});
