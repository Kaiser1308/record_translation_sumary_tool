export const MODELS = [
  // Anthropic
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku 4.5', note: 'Nhanh nhất', provider: 'anthropic' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6', note: 'Cân bằng', provider: 'anthropic' },
  
  // Google Gemini
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', note: 'Miễn phí, cực nhanh', provider: 'gemini' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', note: 'Ngữ cảnh siêu dài', provider: 'gemini' },
  
  // OpenAI
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', note: 'Nhanh, phổ biến', provider: 'openai' },
  { id: 'gpt-4o', label: 'GPT-4o', note: 'Chất lượng cao', provider: 'openai' },

  // DeepSeek
  { id: 'deepseek-chat', label: 'DeepSeek V3', note: 'Rẻ, mã nguồn mở', provider: 'deepseek' },
  { id: 'deepseek-reasoner', label: 'DeepSeek R1', note: 'Khả năng suy luận cao', provider: 'deepseek' },

  // Groq
  { id: 'gemma2-9b-it', label: 'Gemma 2 9B (Groq)', note: 'Siêu tốc', provider: 'groq' },
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B (Groq)', note: 'Tốc độ cực cao', provider: 'groq' },

  // GLM / Zhipu
  { id: 'glm-4-flash', label: 'GLM-4 Flash', note: 'Nhanh, miễn phí', provider: 'glm' },
  { id: 'glm-4-plus', label: 'GLM-4 Plus', note: 'Cạnh tranh GPT-4o', provider: 'glm' }
];

export const DEFAULT_TRANSLATION_MODEL = 'gemini-2.5-flash';
export const DEFAULT_SUMMARY_MODEL = 'gemini-2.5-flash'; // Đổi từ Sonnet qua Gemini

export const STT_ENGINES = [
  { id: 'browser', label: 'Web Speech API', note: 'Miễn phí' },
  { id: 'deepgram', label: 'Deepgram Nova-2', note: 'Giọng Ấn tốt hơn' },
];

export const GROUPED_MODELS = MODELS.reduce((acc, model) => {
  const group = acc.find(g => g.provider === model.provider);
  if (group) {
    group.options.push(model);
  } else {
    const providerNames = {
      anthropic: 'Anthropic Claude',
      gemini: 'Google Gemini',
      openai: 'OpenAI',
      deepseek: 'DeepSeek',
      groq: 'Groq',
      glm: 'Zhipu GLM'
    };
    acc.push({
      provider: model.provider,
      label: providerNames[model.provider] || model.provider,
      options: [model]
    });
  }
  return acc;
}, []);
