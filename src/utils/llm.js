import { MODELS } from './models';

export async function callLLM({ system, userMessage, model: modelId, maxTokens }) {
  const modelInfo = MODELS.find((m) => m.id === modelId);
  const provider = modelInfo ? modelInfo.provider : 'anthropic';

  if (provider === 'anthropic') {
    return callAnthropic({ system, userMessage, model: modelId, maxTokens });
  } else if (provider === 'gemini') {
    return callGemini({ system, userMessage, model: modelId, maxTokens });
  } else {
    // OpenAI, DeepSeek, Groq, GLM share exactly the same OpenAI REST API format
    return callOpenAICompatible({ system, userMessage, model: modelId, maxTokens, provider });
  }
}

async function callAnthropic({ system, userMessage, model, maxTokens }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey || apiKey.startsWith('sk-ant-...')) {
    throw new Error('Chưa cấu hình VITE_ANTHROPIC_API_KEY');
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
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

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

async function callGemini({ system, userMessage, model, maxTokens }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình VITE_GEMINI_API_KEY');

  // NOTE: Gemini REST API requires the API key as a query parameter.
  // This means the key will appear in browser DevTools Network tab.
  // This is a known limitation of the Gemini REST v1beta API.
  // If this is a concern, use a backend proxy to call Gemini server-side.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: maxTokens }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAICompatible({ system, userMessage, model, maxTokens, provider }) {
  const providerConfigs = {
    openai: { url: 'https://api.openai.com/v1/chat/completions', env: 'VITE_OPENAI_API_KEY' },
    deepseek: { url: 'https://api.deepseek.com/chat/completions', env: 'VITE_DEEPSEEK_API_KEY' },
    groq: { url: 'https://api.groq.com/openai/v1/chat/completions', env: 'VITE_GROQ_API_KEY' },
    glm: { url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions', env: 'VITE_GLM_API_KEY' }
  };

  const config = providerConfigs[provider];
  const apiKey = import.meta.env[config.env];
  if (!apiKey) throw new Error(`Chưa cấu hình ${config.env}`);

  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${provider.toUpperCase()} error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}
