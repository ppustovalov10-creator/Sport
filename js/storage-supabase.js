/**
 * storage-supabase.js — MULTI-USER VERSION with real email/password login.
 *
 * Fill in SUPABASE_URL and SUPABASE_ANON_KEY below (Project Settings → API),
 * and run supabase/schema.sql in the Supabase SQL editor first.
 *
 * This file exposes two things to the rest of the app:
 *   window.storage  — same get/set/delete/list interface as before, but now
 *                      scoped to whichever person is actually logged in.
 *   window.auth     — signUp(email,pw), signIn(email,pw), signOut(),
 *                      getUser() → current user or null, onChange(cb)
 *
 * index.html has an auth-gate script (below the main app script) that uses
 * window.auth to show the login screen / onboarding / app in the right order.
 */
(function () {
  const SUPABASE_URL = 'https://wspjyseycnbfscpvxgrb.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_2Oalxf2zeaRYDRViwLegKQ_sMYGslWh';

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  let currentUser = null;
  const listeners = [];

  client.auth.onAuthStateChange((_event, session) => {
    currentUser = session ? session.user : null;
    listeners.forEach(cb => cb(currentUser));
  });

  window.auth = {
    async init() {
      const { data: { session } } = await client.auth.getSession();
      currentUser = session ? session.user : null;
      return currentUser;
    },
    getUser() { return currentUser; },
    onChange(cb) { listeners.push(cb); },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password });
      if (error) throw error;
      // If email confirmation is required, data.session will be null here —
      // the onboarding screen won't show until they confirm and sign in.
      return data;
    },
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      await client.auth.signOut();
    }
  };

  async function requireUserId() {
    if (!currentUser) throw new Error('not signed in');
    return currentUser.id;
  }

  window.storage = {
    async get(key, _shared) {
      const userId = await requireUserId();
      const { data, error } = await client
        .from('app_storage')
        .select('value')
        .eq('user_id', userId)
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('key not found: ' + key);
      return { key, value: data.value, shared: false };
    },
    async set(key, value, _shared) {
      const userId = await requireUserId();
      const { error } = await client
        .from('app_storage')
        .upsert({ user_id: userId, key, value }, { onConflict: 'user_id,key' });
      if (error) { console.error(error); return null; }
      return { key, value, shared: false };
    },
    async delete(key, _shared) {
      const userId = await requireUserId();
      const { error } = await client
        .from('app_storage')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);
      if (error) { console.error(error); return null; }
      return { key, deleted: true, shared: false };
    },
    async list(prefix, _shared) {
      const userId = await requireUserId();
      let query = client.from('app_storage').select('key').eq('user_id', userId);
      if (prefix) query = query.like('key', prefix + '%');
      const { data, error } = await query;
      if (error) throw error;
      return { keys: data.map(r => r.key), prefix: prefix || undefined, shared: false };
    }
  };
})();
