/**
 * storage-polyfill.js
 *
 * The original app was built inside Claude.ai, where `window.storage`
 * is provided automatically (get/set/delete/list, scoped per user).
 * Outside Claude, that object does not exist — so this file recreates
 * the exact same interface on top of real browser localStorage.
 *
 * Nothing else in app.js had to change to make this work standalone.
 *
 * UPGRADE PATH: to sync across devices instead of storing only on this
 * one phone/browser, replace the body of these four functions with
 * calls to Supabase (see supabase/schema.sql and SETUP.md). The
 * function signatures below are written to match what a Supabase
 * version would need, to make that swap mechanical later.
 */
(function () {
  if (window.storage && typeof window.storage.get === 'function') {
    // Real Claude storage already present (e.g. if this file is loaded
    // by mistake inside a Claude artifact) — don't override it.
    return;
  }

  const PREFIX = 'coach_center:';

  function readAll() {
    try {
      const raw = localStorage.getItem(PREFIX + '__data');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('storage-polyfill: failed to read', e);
      return {};
    }
  }
  function writeAll(obj) {
    try {
      localStorage.setItem(PREFIX + '__data', JSON.stringify(obj));
      return true;
    } catch (e) {
      console.error('storage-polyfill: failed to write (localStorage full?)', e);
      return false;
    }
  }

  window.storage = {
    // shared param is accepted for signature compatibility but ignored —
    // this polyfill is always single-user/local-only.
    async get(key, _shared) {
      const all = readAll();
      if (!(key in all)) {
        throw new Error('key not found: ' + key);
      }
      return { key, value: all[key], shared: false };
    },
    async set(key, value, _shared) {
      const all = readAll();
      all[key] = value;
      const ok = writeAll(all);
      if (!ok) return null;
      return { key, value, shared: false };
    },
    async delete(key, _shared) {
      const all = readAll();
      const existed = key in all;
      delete all[key];
      writeAll(all);
      return { key, deleted: existed, shared: false };
    },
    async list(prefix, _shared) {
      const all = readAll();
      const keys = Object.keys(all).filter(k => !prefix || k.startsWith(prefix));
      return { keys, prefix: prefix || undefined, shared: false };
    }
  };
})();
