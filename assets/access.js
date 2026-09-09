/* Authentication is enforced again by the API. UI state is never authorization. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const cfg = window.FANMAP_ACCESS_CONFIG || {};
  const configured = cfg.enabled === true && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url || '') && typeof cfg.publishableKey === 'string' && cfg.publishableKey.length > 20;
  let client, user, opening = false, active = false, generation = 0, mode = 'signup';
  let initialState = {}, writeQueue = Promise.resolve();
  const authStorageKey = 'fanmap.auth.v1';
  // Earlier guest releases stored coordinates in browser storage. They are not accounts.
  try {
    const previous=localStorage.getItem('fanmap.web.v1');
    const backup='fanmap.legacy.backup.v1';
    // Preserve existing user-created bookmarks/pins, but never treat them as a login.
    if(previous && !localStorage.getItem(backup))localStorage.setItem(backup,previous);
    if(!previous || localStorage.getItem(backup)===previous)localStorage.removeItem('fanmap.web.v1');
  } catch { /* If backup storage fails, keep the original; it cannot authorize access. */ }
  const initialURL = new URL(location.href);
  if (initialURL.hash.startsWith('#pin=')) {
    initialURL.hash = '';
    initialURL.searchParams.set('legacyInvite', '1');
    history.replaceState({}, '', initialURL);
  }
  function status(message) { $('authStatus').textContent = message; }
  function safeReturnURL() {
    const u = new URL('/', location.origin);
    const here = new URL(location.href);
    for (const key of ['team','view','venue','share']) {
      const value = here.searchParams.get(key);
      if (value && /^[a-zA-Z0-9_-]{1,120}$/.test(value)) u.searchParams.set(key,value);
    }
    return u.href;
  }
  function setMode(next) {
    mode = ['signup','signin','reset','password'].includes(next) ? next : 'signup';
    $('authTitle').textContent = {signup:'Find your fanhood.',signin:'Welcome back.',reset:'Reset your password.',password:'Set your new password.'}[mode];
    $('authNameField').hidden = mode !== 'signup'; $('authName').required = mode === 'signup';
    $('authEmailField').hidden = mode === 'password'; $('authEmail').required = mode !== 'password';
    $('authPasswordField').hidden = mode === 'reset'; $('authPassword').required = mode !== 'reset';
    $('authPassword').autocomplete = mode === 'signin' ? 'current-password' : 'new-password';
    $('authPassword').minLength = mode === 'signin' ? 1 : 8;
    $('authSubmit').textContent = {signup:'Create account',signin:'Sign in',reset:'Send reset link',password:'Update password'}[mode];
    $('authSwitch').textContent = mode === 'signup' ? 'Already a member? Sign in' : 'New to Fan Map? Create an account';
    $('authSwitch').dataset.authMode = mode === 'signup' ? 'signin' : 'signup';
    status('');
  }
  function openAuth(next = 'signup') {
    setMode(next);
    $('authForm').hidden = !configured || !client;
    $('authUnavailable').hidden = configured && !!client;
    if (!$('authDialog').open) $('authDialog').showModal();
  }
  function closeMembers(message) {
    active = false; generation++;
    document.documentElement.classList.remove('member-ready');
    $('main').hidden = true; $('publicHome').hidden = false; $('bootStatus').hidden = true;
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close();
    if (message) $('accessNotice').textContent = message;
  }
  async function signOut() {
    closeMembers('You are signed out. Sign in to access locations and tools.');
    for (const id of ['venueList','watchDetail','pinList','savedPins','savedVenues','homePlaces','teamResults','tailgateMap']) $(id).replaceChildren();
    for (const key of ['FANMAP_PRIVATE_DATA','FANMAP_TEAM_COLORS','FANMAP_TEAM_STADIUMS','FANMAP_AFFILIATES','FANMAP_SHARED_PIN']) delete window[key];
    initialState = {}; user = null;
    try { if (client) await client.auth.signOut({scope:'local'}); } catch { /* Local cleanup remains mandatory. */ }
    try { localStorage.removeItem(authStorageKey); } catch { /* No usable storage. */ }
    location.replace('/');
  }
  async function request(action, fields = {}) {
    if (!client || !user) throw new Error('Sign in to access Fan Map.');
    const {data:{session},error} = await client.auth.getSession();
    if (error || !session?.access_token) { closeMembers('Please sign in again.'); throw new Error('Please sign in again.'); }
    const response = await fetch(cfg.url.replace(/\/$/,'') + '/functions/v1/fanmap-access', {
      method:'POST', cache:'no-store', credentials:'omit', referrerPolicy:'no-referrer',
      headers:{'Content-Type':'application/json',apikey:cfg.publishableKey,Authorization:'Bearer ' + session.access_token},
      body:JSON.stringify({action,...fields}), signal:AbortSignal.timeout(20000)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      if ([401,403].includes(response.status)) closeMembers('Please sign in with a verified account to continue.');
      throw new Error(typeof body.error === 'string' ? body.error : 'Fan Map could not complete this request. Please try again.');
    }
    return body;
  }
  function script(src) {
    return new Promise((resolve,reject) => {
      const el = document.createElement('script'); el.src=src;
      el.onload=resolve; el.onerror=() => reject(new Error('A required application file did not load. Reload to try again.'));
      document.head.appendChild(el);
    });
  }
  async function enter() {
    if (active || opening || !client || mode === 'password') return;
    opening=true; const mine=++generation;
    try {
      const {data,error}=await client.auth.getUser();
      if (error || !data.user || data.user.is_anonymous) return;
      user=data.user;
      if (!user.email_confirmed_at) { status('Verify your email before accessing locations and tools.'); return; }
      // A signed local flag, old preview profile or SDK session alone is never enough.
      const share = new URL(location.href).searchParams.get('share');
      const bootstrap=await request('bootstrap', share ? {share} : {});
      if (mine !== generation || !bootstrap.payload?.teams || !bootstrap.payload?.colors || !bootstrap.payload?.stadiums) throw new Error('Member access could not be confirmed.');
      const p=bootstrap.payload;
      initialState=bootstrap.state || {};
      window.FANMAP_PRIVATE_DATA=p;
      window.FANMAP_TEAM_COLORS=p.colors; window.FANMAP_TEAM_STADIUMS=p.stadiums; window.FANMAP_AFFILIATES=p.affiliates || {};
      window.FANMAP_SHARED_PIN=bootstrap.sharedPin || null;
      active=true; document.documentElement.classList.add('member-ready');
      $('publicHome').hidden=true; $('bootStatus').hidden=false;
      if ($('authDialog').open) $('authDialog').close();
      await script('/assets/vendor/leaflet.js?v=accounts1');
      if (!active || mine !== generation) return;
      await script('/assets/web-app.js?v=accounts1');
    } catch (error) {
      closeMembers(); openAuth('signin'); status(error.message || 'Sign-in is unavailable. Please try again.');
    } finally { opening=false; }
  }
  window.FANMAP_ACCESS=Object.freeze({
    isAllowed:() => active,
    initialState:() => structuredClone(initialState),
    saveState(snapshot) {
      const copy=structuredClone(snapshot);
      const work=writeQueue.catch(()=>{}).then(()=>request('save-state',{state:copy}));
      writeQueue=work; return work;
    },
    async createShare(pin) {
      const result=await request('create-share',{pin});
      if (!/^[a-f0-9-]{36}$/i.test(result.id || '')) throw new Error('The meeting link could not be created.');
      const url=new URL('/',location.origin);url.searchParams.set('share',result.id);return url.href;
    },
    signOut
  });
  document.addEventListener('click', event => {
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.authMode)openAuth(b.dataset.authMode);
    if(b.dataset.closeAuth!==undefined)$('authDialog').close();
    if(b.dataset.signOut!==undefined)signOut();
  });
  $('authForm').addEventListener('submit', async event => {
    event.preventDefault(); if(!configured||!client)return;
    const button=$('authSubmit');button.disabled=true;status('');
    const email=$('authEmail').value.trim(),password=$('authPassword').value;
    try {
      if(mode==='signup') {
        const display_name=$('authName').value.trim();
        if(display_name.length<2)throw new Error('Enter a display name of at least two characters.');
        const {error}=await client.auth.signUp({email,password,options:{data:{display_name},emailRedirectTo:safeReturnURL()}});
        if(error)throw error;
        $('authPassword').value='';
        status('Check your email to confirm your account, then sign in. If you already have an account, use Sign in.');
      } else if(mode==='signin') {
        const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;
        $('authPassword').value='';await enter();
      } else if(mode==='reset') {
        const redirect=new URL(safeReturnURL());redirect.searchParams.set('recover','1');
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:redirect.href});if(error)throw error;
        status('If an account exists for that email, a password-reset link has been sent.');
      } else {
        const {error}=await client.auth.updateUser({password});if(error)throw error;
        $('authPassword').value='';setMode('signin');await enter();
      }
    } catch(error) { status(error.message || 'Authentication failed. Please try again.'); }
    finally { button.disabled=false; }
  });
  window.addEventListener('pageshow', event => { if(event.persisted)location.reload(); });
  // No network requests, map tiles, catalog downloads or signup collection without configuration.
  if(new URL(location.href).searchParams.has('legacyInvite'))$('accessNotice').textContent='This older meeting-point link needs a new member-only invitation.';
  if(['watch','map','parties','tailgate','tailgates','saved','fan'].includes(new URL(location.href).searchParams.get('view')) || new URL(location.href).searchParams.has('venue') || new URL(location.href).searchParams.has('share'))openAuth('signin');
  if(!configured)return;
  (async () => {
    try {
      await script('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/dist/umd/supabase.js');
      client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{storageKey:authStorageKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}});
      client.auth.onAuthStateChange((event) => {
        if(event==='PASSWORD_RECOVERY'){setTimeout(()=>openAuth('password'),0);return;}
        if(event==='SIGNED_OUT' && active){closeMembers();location.replace('/');return;}
        if(['SIGNED_IN','INITIAL_SESSION'].includes(event))setTimeout(enter,0);
      });
      if($('authDialog').open)openAuth(mode);
      if(new URL(location.href).searchParams.get('recover')==='1')openAuth('password');
      else await enter();
      setInterval(async()=>{
        if(!active)return;
        try { const {data,error}=await client.auth.getUser();if(error||!data.user||!data.user.email_confirmed_at||data.user.is_anonymous)await signOut(); }
        catch { await signOut(); }
      },60000);
    } catch { openAuth('signin');status('The account service could not be reached. Access remains locked.'); }
  })();
})();
