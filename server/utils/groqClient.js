// server/utils/groqClient.js
// AI API client with automatic key rotation
// Supports both Groq (gsk_*) and xAI/Grok (xai-*) keys
// When one key hits rate limit (429), it switches to the next available key

const axios = require('axios');

// Load all API keys from env (comma-separated)
// .env format: XAI_API_KEY=gsk_key1,gsk_key2,xai-key3
function getKeys() {
  const raw = process.env.XAI_API_KEY || '';
  return raw.split(',').map(k => k.trim()).filter(Boolean);
}

// Detect provider from key prefix
function getProvider(key) {
  if (key.startsWith('xai-')) {
    return {
      url: 'https://api.x.ai/v1/chat/completions',
      model: 'grok-3-mini',  // xAI's model
    };
  }
  // Default: Groq (gsk_* keys)
  return {
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
  };
}

// Track which keys are rate-limited and when they reset
const keyStatus = new Map();
let currentKeyIndex = 0;

function getAvailableKey() {
  const keys = getKeys();
  if (keys.length === 0) return null;

  const now = Date.now();

  // Clear expired rate limits
  for (const [key, status] of keyStatus.entries()) {
    if (status.limited && now > status.resetAt) {
      keyStatus.delete(key);
    }
  }

  // Try keys starting from current index
  for (let i = 0; i < keys.length; i++) {
    const idx = (currentKeyIndex + i) % keys.length;
    const key = keys[idx];
    const status = keyStatus.get(key);

    if (!status || !status.limited) {
      currentKeyIndex = idx;
      return key;
    }
  }

  return null;
}

function markKeyLimited(key, retryAfterSeconds) {
  const resetAt = Date.now() + (retryAfterSeconds * 1000);
  keyStatus.set(key, { limited: true, resetAt });

  const keys = getKeys();
  currentKeyIndex = (currentKeyIndex + 1) % keys.length;

  const provider = key.startsWith('xai-') ? 'xAI' : 'Groq';
  console.log(`[AI Client] ${provider} key ...${key.slice(-6)} rate-limited. Reset in ${Math.ceil(retryAfterSeconds / 60)} min. Rotating to next key.`);
}

/**
 * Call AI API with automatic key rotation
 * Supports both Groq and xAI endpoints
 * 
 * @param {object} params - { model (optional), messages, max_tokens, temperature }
 * @param {number} timeout - request timeout in ms (default 60000)
 * @returns {object} - parsed response data
 */
async function callGroq(params, timeout = 60000) {
  const keys = getKeys();
  if (keys.length === 0) {
    throw new Error('No AI API keys configured. Set XAI_API_KEY in .env');
  }

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const key = getAvailableKey();

    if (!key) {
      const now = Date.now();
      let earliestReset = Infinity;
      for (const [, status] of keyStatus.entries()) {
        if (status.resetAt < earliestReset) earliestReset = status.resetAt;
      }
      const waitMinutes = Math.ceil((earliestReset - now) / 60000);
      throw new Error(`AI service rate limit reached on all API keys. Please try again in ${waitMinutes} minutes.`);
    }

    const provider = getProvider(key);
    // Use provider's default model unless the caller specified one that matches the provider
    const requestModel = params.model || provider.model;
    // For xAI, always use their model regardless of what was passed
    const model = key.startsWith('xai-') ? provider.model : requestModel;

    try {
      const res = await axios.post(
        provider.url,
        { ...params, model },
        {
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          timeout,
        }
      );

      return res.data;
    } catch (err) {
      if (err.response?.status === 429 || err.response?.status === 403) {
        const retryAfter = parseInt(err.response.headers?.['retry-after'] || '3600');
        markKeyLimited(key, retryAfter);
        continue;
      }

      if (err.response) {
        throw new Error(`AI API error (${err.response.status}): ${err.response.data?.error?.message || 'Unknown error'}`);
      }
      throw new Error(`AI API request failed: ${err.message}`);
    }
  }

  throw new Error('AI service unavailable. All API keys exhausted.');
}

function getKeyStatus() {
  const keys = getKeys();
  const now = Date.now();
  return keys.map((key, i) => {
    const status = keyStatus.get(key);
    const provider = key.startsWith('xai-') ? 'xAI' : 'Groq';
    return {
      index: i,
      key: `...${key.slice(-6)}`,
      provider,
      active: currentKeyIndex === i,
      limited: status?.limited || false,
      resetsIn: status?.limited ? Math.ceil((status.resetAt - now) / 60000) + ' min' : null,
    };
  });
}

module.exports = { callGroq, getKeyStatus };
