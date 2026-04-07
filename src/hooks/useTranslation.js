import { useCallback } from 'react';
import { callLLM } from '../utils/llm';

// deleted TRANSLATE_SYSTEM constant as it is dynamically generated

export default function useTranslation() {
  const translate = useCallback(async (text, model, srcLang = 'en') => {
    if (!text || text.trim().split(/\s+/).length < 3) return null;
    
    const systemPrompt = srcLang === 'vi' 
      ? 'You are a translator. Translate Vietnamese to English.\nOutput ONLY the English translation. No explanation, no quotes, no preamble.'
      : 'You are a translator. Translate English to Vietnamese.\nOutput ONLY the Vietnamese translation. No explanation, no quotes, no preamble.';

    try {
      const result = await callLLM({
        system: systemPrompt,
        userMessage: text,
        model,
        maxTokens: 500,
      });
      return result;
    } catch (err) {
      console.error('Translation error:', err);
      throw err;
    }
  }, []);

  return { translate };
}
