// server/utils/groqClient.js
// AI API client with aggressive key rotation
// With 45+ keys, this should NEVER show rate limit errors to users
// Strategy: rotate instantly on 429, use very short cooldowns, retry aggressively

const axios = require('axios');

// ─── Key Management ───────────────────────────────────────────────────────────

let _keys = null;
function getKeys() {
  if (!_keys) {
    const raw = process.env.XAI_API_KEY || '';
    _keys = raw.split(',').map(k => k.trim()).filter(Boolean);
  }
  return _keys;
}

function getProvider(key) {
  if (key.startsWith('xai-') || key.startsWith('xai')) {
    return { url: 'https://api.x.ai/v1/chat/completions', model: 'grok-3-mini' };
  }
  return { url: 'https://api.groq.com/openai/v1/chat/completions', model: 'llama-3.3-70b-versatile' };
}

// ─── Rate Limit Tracking ──────────────────────────────────────────────────────
// Key → timestamp when it becomes available again
const cooldownUntil = new Map();

// Track permanently dead keys (repeated 403s)
const deadKeys = new Set();

let nextKeyIndex = 0;

function isKeyAvailable(key) {
  if (deadKeys.has(key)) return false;
  const until = cooldownUntil.get(key);
  if (!until) return true;
  if (Date.now() >= until) {
    cooldownUntil.delete(key);
    return true;
  }
  return false;
}

function cooldownKey(key, seconds) {
  // Very short cooldowns — Groq free tier resets in ~10-60 seconds
  const cooldown = Math.min(seconds || 15, 60); // Never more than 60s cooldown
  cooldownUntil.set(key, Date.now() + cooldown * 1000);
  nextKeyIndex = (nextKeyIndex + 1) % getKeys().length;
}

function killKey(key) {
  deadKeys.add(key);
  console.log(`[AI] Key ...${key.slice(-6)} permanently disabled (invalid/revoked)`);
}

// Get next available key using round-robin
function pickKey() {
  const keys = getKeys();
  const alive = keys.filter(k => !deadKeys.has(k));
  if (alive.length === 0) return null;

  // First pass: find an available key starting from nextKeyIndex
  for (let i = 0; i < keys.length; i++) {
    const idx = (nextKeyIndex + i) % keys.length;
    const key = keys[idx];
    if (isKeyAvailable(key)) {
      nextKeyIndex = (idx + 1) % keys.length;
      return key;
    }
  }

  return null; // All on cooldown
}

// Find the soonest a key will be available
function getNextAvailableMs() {
  const now = Date.now();
  let soonest = Infinity;
  for (const [key, until] of cooldownUntil.entries()) {
    if (!deadKeys.has(key) && until < soonest) {
      soonest = until;
    }
  }
  return soonest === Infinity ? 2000 : Math.max(soonest - now, 500);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Main API Call Function ───────────────────────────────────────────────────

/**
 * Call AI with aggressive retry and rotation.
 * With 45 keys and short cooldowns, this should virtually never fail.
 * 
 * Strategy:
 * 1. Pick next available key, make request
 * 2. On 429: cooldown that key for 15s, immediately try next key
 * 3. If all keys on cooldown: wait 2-5 seconds, then retry
 * 4. Repeat up to 5 rounds (total wait: max ~25 seconds)
 * 5. Only throw if genuinely no keys work after all retries
 */
async function callGroq(params, timeout = 60000) {
  const keys = getKeys();
  if (keys.length === 0) {
    throw new Error('No AI API keys configured. Set XAI_API_KEY in .env');
  }

  const aliveKeys = keys.filter(k => !deadKeys.has(k));
  if (aliveKeys.length === 0) {
    throw new Error('All AI API keys are invalid. Please check your .env configuration.');
  }

  const MAX_ATTEMPTS = aliveKeys.length * 2; // Try each key up to 2 times
  const MAX_WAIT_ROUNDS = 8; // More patience — with 37 keys, cooldowns are short
  let attempts = 0;
  let waitRounds = 0;
  let lastError = null;

  while (attempts < MAX_ATTEMPTS && waitRounds < MAX_WAIT_ROUNDS) {
    const key = pickKey();

    if (!key) {
      // All keys on cooldown — wait for the shortest one to expire
      waitRounds++;
      const waitMs = Math.min(getNextAvailableMs(), 5000);
      if (waitRounds <= 3) {
        // Silent retry for first 3 rounds
        await sleep(waitMs);
        continue;
      } else {
        // Log after 3 rounds
        console.log(`[AI] All keys cooling down. Wait round ${waitRounds}/${MAX_WAIT_ROUNDS} (${Math.ceil(waitMs/1000)}s)...`);
        await sleep(waitMs);
        continue;
      }
    }

    attempts++;
    const provider = getProvider(key);
    const isXai = key.startsWith('xai-') || key.startsWith('xai');
    const model = isXai ? provider.model : (params.model || provider.model);

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

      // Success — clear any cooldown on this key
      cooldownUntil.delete(key);
      return res.data;

    } catch (err) {
      const status = err.response?.status;

      if (status === 429) {
        // Rate limited — parse the actual reset time from headers
        const headers = err.response.headers || {};
        const retryHeader = headers['retry-after'];
        const tokenReset = headers['x-ratelimit-reset-tokens'];
        const errMsg = err.response?.data?.error?.message || '';
        
        // Check if it's a DAILY limit (TPD) — these won't reset soon
        if (errMsg.includes('tokens per day') || errMsg.includes('TPD')) {
          // Daily limit hit — kill this key for this session (won't reset for hours)
          killKey(key);
          lastError = err;
          continue;
        }
        
        let cooldownSec = 15;
        if (retryHeader) {
          cooldownSec = Math.min(parseInt(retryHeader), 30);
        } else if (tokenReset) {
          const ms = tokenReset.match(/(\d+)ms/);
          const s = tokenReset.match(/(\d+)s/);
          const m = tokenReset.match(/(\d+)m/);
          cooldownSec = (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0) + (ms ? parseInt(ms[1]) / 1000 : 0);
          cooldownSec = Math.min(Math.ceil(cooldownSec), 45);
        }
        
        cooldownKey(key, Math.max(cooldownSec, 5));
        lastError = err;
        continue;
      }

      if (status === 403) {
        // 403 = unauthorized — key is invalid/revoked. Kill it immediately.
        killKey(key);
        lastError = err;
        continue;
      }

      if (status === 503 || status === 502 || status === 500) {
        // Server error — try next key (might be provider-specific)
        cooldownKey(key, 5);
        lastError = err;
        continue;
      }

      // Other errors (network timeout, etc.) — don't retry, throw immediately
      if (err.code === 'ECONNABORTED') {
        throw new Error('AI request timed out. The AI service is slow right now — please try again.');
      }
      if (err.response) {
        throw new Error(`AI error (${status}): ${err.response.data?.error?.message || 'Unknown error'}`);
      }
      throw new Error(`AI connection failed: ${err.message}`);
    }
  }

  // Exhausted all retries
  const errMsg = lastError?.response?.data?.error?.message || '';
  throw new Error(`AI service is temporarily overloaded. Please wait 10 seconds and try again. (${errMsg})`);
}

// ─── Status / Debug ───────────────────────────────────────────────────────────

function getKeyStatus() {
  const keys = getKeys();
  const now = Date.now();
  return {
    total: keys.length,
    dead: deadKeys.size,
    alive: keys.length - deadKeys.size,
    onCooldown: [...cooldownUntil.entries()].filter(([k, t]) => !deadKeys.has(k) && t > now).length,
    available: keys.filter(k => isKeyAvailable(k)).length,
  };
}

module.exports = { callGroq, getKeyStatus };
