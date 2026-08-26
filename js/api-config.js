/**
 * api-config.js — GEMINI VERSION.
 *
 * Switched from Anthropic to Google Gemini because Gemini's free API tier
 * (Flash models, via Google AI Studio) requires no credit card and no
 * billing setup — unlike Anthropic Console, which requires a funded
 * account before any API call succeeds. Same food-analysis feature,
 * genuinely free instead.
 *
 * SECURITY NOTE: the key is stored in this browser's localStorage and
 * sent directly from the browser to Google's API. Visible to anyone who
 * opens this browser's dev tools. Fine for a private app on your own
 * phone. Do NOT deploy this publicly with your key embedded.
 */
(function () {
  const KEY_STORAGE = 'coach_center:gemini_api_key';

  window.apiConfig = {
    getKey() {
      return localStorage.getItem(KEY_STORAGE) || '';
    },
    setKey(key) {
      localStorage.setItem(KEY_STORAGE, key.trim());
    },
    hasKey() {
      return !!this.getKey();
    },
    headers() {
      return {
        'Content-Type': 'application/json',
        'x-goog-api-key': this.getKey()
      };
    },
    endpoint(model) {
      return `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent`;
    }
  };

  // Minimal settings UI: a small floating gear that opens a prompt-based
  // key entry. Kept intentionally simple — swap for a nicer modal if you
  // extend this in Claude Code.
  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.textContent = '🔑';
    btn.title = 'Настроить API-ключ Google Gemini';
    btn.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;width:40px;height:40px;border-radius:50%;background:#1e1f23;border:1px solid #34363c;color:#f5f3ee;font-size:16px;cursor:pointer;';
    btn.addEventListener('click', () => {
      const current = window.apiConfig.getKey();
      const val = prompt(
        'Вставь свой Google Gemini API-ключ (получить бесплатно, без карты: aistudio.google.com → Get API key).\n' +
        'Нужен только для чата с тренером (вкладка «Тренер»). Хранится только в этом браузере.',
        current
      );
      if (val !== null) window.apiConfig.setKey(val);
    });
    document.body.appendChild(btn);
  });
})();
