"""One-time conversion: remove guest data loading; require verified member API."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
p=root/'index.html';s=p.read_text()
assert 'id="publicHome"' not in s
s=re.sub(r'<script defer src="/assets/(?:data/[^"\n]+|vendor/leaflet\.js[^"\n]*|web-app\.js[^"\n]*)"></script>\n?', '', s)
s=s.replace('</head>','<meta name="referrer" content="no-referrer">\n<link rel="stylesheet" href="/assets/access.css?v=accounts1">\n<script defer src="/assets/access-config.js?v=accounts1"></script>\n<script defer src="/assets/access.js?v=accounts1"></script>\n</head>')
s=s.replace('<a class="skip" href="#main">Skip to the app</a>','<a class="skip" href="#publicHome">Skip to content</a>')
s=s.replace('</header>','''  <button class="member-signout" data-sign-out>Sign out</button>
  <div class="guest-actions"><button class="button secondary" data-auth-mode="signin">Sign in</button><button class="button" data-auth-mode="signup">Create account</button></div>
</header>
<section id="publicHome" class="guest-home" tabindex="-1" aria-labelledby="publicTitle">
  <div class="guest-hero"><p class="eyebrow">YOUR TEAM. YOUR PEOPLE.</p><h1 id="publicTitle">Find your<br><span>fanhood.</span></h1><p class="guest-lede">Watch together. Tailgate together. Make every city feel like home field.</p><div class="actions"><button class="button" data-auth-mode="signup">Create your account</button><button class="button secondary" data-auth-mode="signin">Sign in</button></div><p class="account-lock">An account is required for locations, maps, and all Fan Map tools.</p><p id="accessNotice" role="status"></p></div>
  <div class="access-benefits">
    <article><p class="eyebrow">WATCH PARTIES</p><h2>Your people are out there.</h2><p>Find your team’s watch-party venues and fan clubs. Save a place and bring your crew.</p><button class="button secondary" data-auth-mode="signup">Join to find your people</button></article>
    <article><p class="eyebrow">TAILGATES</p><h2>One pin. Your whole crew.</h2><p>Start at your team’s stadium, choose a meeting point, and share it with fellow members.</p><button class="button secondary" data-auth-mode="signup">Join to plan your tailgate</button></article>
  </div>
  <div class="guest-footer"><span>Watch parties · Tailgates · Team gear · Tickets · Fan zone</span><span>Fan Map is independent of the teams and venues listed.</span></div>
</section>
<dialog id="authDialog" aria-labelledby="authTitle"><div class="dialog-heading"><h2 id="authTitle">Find your fanhood.</h2><button class="close" data-close-auth aria-label="Close account dialog">×</button></div><p class="muted">Sign in to access locations, stadium maps, saved places, and member invitations.</p>
  <div id="authUnavailable" role="status">Account registration and sign-in are not available yet. Locations and tools remain locked until the account service is connected.</div>
  <form id="authForm" hidden><label id="authNameField"><span>Display name</span><input id="authName" name="display_name" autocomplete="nickname" minlength="2" maxlength="60" required></label><label id="authEmailField"><span>Email address</span><input id="authEmail" name="email" type="email" autocomplete="email" maxlength="254" required></label><label id="authPasswordField"><span>Password</span><input id="authPassword" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label><button class="button wide" id="authSubmit" type="submit">Create account</button><div class="auth-options"><button type="button" id="authSwitch" data-auth-mode="signin">Already a member? Sign in</button><button type="button" data-auth-mode="reset">Forgot password?</button></div></form>
  <p id="authStatus" role="status" aria-live="polite"></p>
</dialog>''',1)
s=s.replace('Device storage is unavailable. You can browse and share, but your changes will not survive a reload.','Account sync is unavailable. Recent changes are only in this signed-in session.')
s=s.replace('Saved on this device','Saved to your account')
s=s.replace('Your saved places and meeting points stay in this browser. They are not a cloud account.','Your saved places and meeting points belong to your account. Sign in to access them.')
s=s.replace('No sign-up required to explore.','Your account is required to explore.')
s=s.replace('Choose a team and get your whole game-day experience. No sign-up required to explore.','Choose a team for your member game-day experience.')
s=s.replace('A shared link includes this exact location and the details you enter. Share only with people you intend to invite. Links are snapshots, not live updates.','Meeting-point links require a Fan Map account. Share only with people you intend to invite. The URL does not contain your coordinates; it opens a saved snapshot after sign-in.')
p.write_text(s)
p=root/'assets/web-app.js';s=p.read_text()
s=s.replace("const STORAGE_KEY = 'fanmap.web.v1';",'// Member data and state are supplied only by the authenticated API.')
s=s.replace('  function buildTeams(env, html) {','''  function buildTeams(env, html) {
    if (env.FANMAP_PRIVATE_DATA) {
      const data=env.FANMAP_PRIVATE_DATA;
      if(!data.teams || !data.colors || !data.stadiums)throw new Error('The member directory did not load.');
      return JSON.parse(JSON.stringify(data.teams));
    }''')
s=s.replace('  if (!root.document) return;','''  if (!root.document) return;
  if (!root.FANMAP_ACCESS?.isAllowed() || !root.FANMAP_PRIVATE_DATA) return;''')
start=s.index('  function persist() {');end=s.index('  function setTheme()',start)
s=s[:start]+'''  let saveRevision=0;
  function persist() {
    const revision=++saveRevision;
    root.FANMAP_ACCESS.saveState(state).then(()=>{
      if(revision===saveRevision){storageOK=true;$('storageWarning').hidden=true;toast('Saved to your account.');}
    }).catch(()=>{
      if(revision===saveRevision){storageOK=false;$('storageWarning').hidden=false;toast('Account sync failed. Changes remain in this session only.');}
    });
    return true;
  }
  function restore() {
    const raw=root.FANMAP_ACCESS.initialState();
    if(raw && typeof raw==='object') {
      state.teamKey=own(teams,raw.teamKey)?raw.teamKey:'';
      if(raw.myTeams && typeof raw.myTeams==='object')for(const [category,key] of Object.entries(raw.myTeams)){if(own(teams,key)&&teams[key].category===category)state.myTeams[category]=key;}
      state.saved=Array.isArray(raw.saved)?raw.saved.filter(v=>v&&own(teams,v.teamKey)&&typeof v.id==='string').slice(0,500):[];
      state.pins=Array.isArray(raw.pins)?raw.pins.map(p=>cleanPin(p,teams)).filter(Boolean).slice(0,100):[];
    }
  }
'''+s[end:]
s=s.replace("if(sharedPin && sharedPin.teamKey===teamKey && view==='tailgate')u.hash='pin='+encodePin(sharedPin);", "const share=new URL(location.href).searchParams.get('share');\n    if(sharedPin && sharedPin.teamKey===teamKey && view==='tailgate' && /^[a-f0-9-]{36}$/i.test(share||''))u.searchParams.set('share',share);")
start=s.index('  function encodePin(');end=s.index('  function readRoute()',start);s=s[:start]+s[end:]
s=s.replace("const url=new URL(location.href); const payload=new URLSearchParams(url.hash.slice(1)).get('pin');\n    sharedPin=payload?decodePin(payload):null;", "const url=new URL(location.href);\n    sharedPin=root.FANMAP_SHARED_PIN?cleanPin(root.FANMAP_SHARED_PIN,teams):null;")
s=s.replace("if(payload&&!sharedPin)toast('That meeting-point link is invalid. It was not loaded.');", "if(url.searchParams.has('legacyInvite'))toast('Ask the host for a new member-only meeting link.');")
start=s.index('  function sharePin(p)');end=s.index('\n',start)
s=s[:start]+'''  async function sharePin(p) {
    try { const url=await root.FANMAP_ACCESS.createShare(p);showShare(p.name,url,'Meet the '+teams[p.teamKey].display+' crew at '+p.name+'. Sign in to Fan Map to see the meeting point.'); }
    catch(error) { toast(error.message || 'The meeting link could not be created.'); }
  }'''+s[end:]
s=s.replace('Saved on this device.','Saving to your account…').replace('Meeting point saved on this device.','Saving the meeting point to your account…')
s=s.replace('Saved on this device','Saved to your account').replace('saved on this device','saved to your account')
s=s.replace('Saved for this session only. Device storage is unavailable.','Account sync is unavailable. Changes remain in this session only.')
s=s.replace('Meeting point saved for this session only.','Changes remain in this session only until synced.')
s=s.replace('Your device has 500 saved places.','Your account has 500 saved places.').replace('This device has 100 meeting points.','Your account has 100 meeting points.')
s=s.replace('from this device?', 'from your account?').replace('Save to device','Save to account')
s=s.replace('Your last selected team, starred locations, and meeting points are stored in this browser’s local storage. They do not sync between devices. Clearing site data removes them.','Your team choices, starred locations, and meeting points are saved to your account. Only signed-in members can load the directory and use Fan Map tools.')
s=s.replace('Your team choices (one per sport category), starred locations, and meeting points are stored in this browser’s local storage. They do not sync between devices. Clearing site data removes them.','Your team choices, starred locations, and meeting points are saved to your account. Only signed-in members can load the directory and use Fan Map tools.')
s=s.replace('Stored on your device','Your member account')
s=s.replace('Meeting-point links contain the exact coordinates, name, date, and instructions you enter. Anyone who receives or forwards a link can read those details.','New meeting-point links contain an opaque reference, not coordinates. Anyone who receives or forwards a link must sign in with a verified Fan Map account to view the details.')
s=s.replace('Location is not sent to a Fan Map account service.','Location is saved to your account only when you save a meeting point. Sharing creates a member-only invitation record.')
s=s.replace('<h3>No account required</h3><p>This web release does not create cloud accounts, publish public posts, collect payments, or send email. A source link or directions button opens an external provider.</p>','<h3>Account required</h3><p>Account registration and email confirmation are required for locations and tools. Public posts and payments are not enabled. A source link or directions button opens an external provider.</p>')
s=s.replace('Stars and meeting points persist in this browser. Shared links open the actual place or pin for the recipient. Cloud accounts, a public fan board, and payments are not connected in this release.','Stars and meeting points save to your account. Shared links require the recipient to sign in. A public fan board and payments are not connected in this release.')
p.write_text(s)
print('Converted public entry to fail-closed member access; removed guest data scripts and coordinate URLs.')
