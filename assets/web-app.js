/* Fan Map public web app. Uses generated public data and self-hosted maps. */
(function (root) {
  'use strict';
  const STORAGE_KEY = 'fanmap.web.v1';
  const own = (o, k) => !!o && Object.prototype.hasOwnProperty.call(o, k);
  const text = v => String(v == null ? '' : v);
  const esc = v => text(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normal = v => text(v).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  function safeURL(value) { try { const u = new URL(value); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
  function day(d = new Date()) { return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'); }
  function parseBaseTeams(html) {
    const m = html.match(/const PREVIEW_SCHOOLS=(.*);\r?\nconst PREVIEW_AFFILIATES=/);
    if (!m) throw new Error('The shared team data could not be read.');
    const result = JSON.parse(m[1]);
    if (!result || Array.isArray(result) || typeof result !== 'object') throw new Error('Invalid shared team data.');
    return result;
  }
  function buildTeams(env, html) {
    if (!env.FANMAP_CATALOG || !env.FANMAP_TEAM_COLORS || !env.FANMAP_TEAM_STADIUMS || !env.FANMAP_VERIFIED_LOCATIONS || typeof env.applyFanMapVerifiedLocations !== 'function') throw new Error('A required directory asset did not load.');
    const base = env.FANMAP_BASE_TEAMS || parseBaseTeams(html || "");
    const teams = JSON.parse(JSON.stringify({...base, ...env.FANMAP_CATALOG.teams}));
    for (const [key,t] of Object.entries(teams)) {
      t.key = key;
      const meta = env.FANMAP_CATALOG.metadata[key] || {};
      t.category = meta.category || t.category || 'Other';
      t.league = meta.league || t.league || '';
      t.display = t.display || t.short || key;
      t.chapters = Array.isArray(t.chapters) ? t.chapters : [];
    }
    env.applyFanMapVerifiedLocations(teams, day());
    for (const t of Object.values(teams)) t.chapters.forEach((v,i) => { if (!v.id) v.id = t.key + '-directory-' + i; });
    return teams;
  }
  const validCoordinates = p => Array.isArray(p) && p.length === 2 && p.every(v => typeof v === 'number' && Number.isFinite(v)) && Math.abs(p[0]) <= 90 && Math.abs(p[1]) <= 180;
  function stadiumFor(registry,key,today=day()) {
    if (!own(registry,key)) return null;
    let s = registry[key];
    if (s.upcoming && /^\d{4}-\d{2}-\d{2}$/.test(s.upcoming.effectiveFrom || '') && s.upcoming.effectiveFrom <= today) s = s.upcoming;
    return validCoordinates(s.start) ? {...s,start:[...s.start]} : null;
  }
  function cleanPin(p,teams) {
    if (!p || typeof p !== 'object' || !own(teams,p.teamKey) || !validCoordinates([p.lat,p.lng]) || typeof p.name !== 'string' || !p.name.trim()) return null;
    const date = typeof p.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && !Number.isNaN(Date.parse(p.date)) ? p.date : '';
    return {id:typeof p.id==='string' && /^[a-zA-Z0-9_-]{1,100}$/.test(p.id)?p.id:'shared-pin',teamKey:p.teamKey,name:p.name.trim().slice(0,80),note:text(p.note).slice(0,240),date,lat:p.lat,lng:p.lng};
  }
  function listingStatus(v,today=day()) {
    if (v.listingStatus === 'needs-update' || (v.eventDate && v.eventDate < today) || (v.validThrough && v.validThrough < today)) return {label:'Needs update · confirm plans',kind:'old'};
    if (v.sourceVerification || v.listingStatus === 'source-checked') return {label:'Source checked · confirm plans',kind:'checked'};
    return {label:'Listed · confirm plans',kind:'listed'};
  }
  const namedVenue = v => !!v.venue && !/^(venue announced per game|tbd|to be announced|venue pending)$/i.test(v.venue.trim());
  const addressQuery = v => [namedVenue(v)?v.venue:v.name,v.addr,v.city].filter(Boolean).join(', ');
  const directions = v => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(addressQuery(v));
  const core = {parseBaseTeams,buildTeams,validCoordinates,stadiumFor,cleanPin,listingStatus,namedVenue,safeURL,esc,normal};
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (!root.document) return;
  const $ = id => document.getElementById(id);
  let teams={}, teamKey='', view='home', selectedVenue='', pageLimit=40, map=null, mapGroup=null, lastMapTeam='', sharedPin=null, storageOK=true, shareData=null, toastTimer;
  let state={teamKey:'',myTeams:{},saved:[],pins:[]};
  const palette = key => root.FANMAP_TEAM_COLORS[key] || {primary:'#34343c',secondary:'#FFFFFF',onPrimary:'#FFFFFF',readable:'#C4C4CC',soft:'rgba(255,255,255,.08)'};
  function badge(key) {
    const c=palette(key), hex=(s,f)=>/^#[0-9a-f]{6}$/i.test(s||'')?s:f;
    return '<svg class="team-icon" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19" fill="'+hex(c.primary,'#34343c')+'" stroke="rgba(255,255,255,.25)"/><path d="M20 8a8 8 0 0 0-8 8c0 6 8 15 8 15s8-9 8-15a8 8 0 0 0-8-8Z" fill="'+hex(c.secondary,'#FFFFFF')+'"/><circle cx="20" cy="16" r="3" fill="'+hex(c.primary,'#34343c')+'"/></svg>';
  }
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false; toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); storageOK=true; } catch { storageOK=false; }
    $('storageWarning').hidden=storageOK;
    return storageOK;
  }
  function restore() {
    try {
      const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if (raw && typeof raw === 'object') {
        state.teamKey=own(teams,raw.teamKey)?raw.teamKey:'';
        if(raw.myTeams && typeof raw.myTeams==='object')for(const [category,key] of Object.entries(raw.myTeams)){if(own(teams,key)&&teams[key].category===category)state.myTeams[category]=key;}
        if(state.teamKey)state.myTeams[teams[state.teamKey].category]=state.teamKey;
        state.saved=Array.isArray(raw.saved)?raw.saved.filter(v=>v && own(teams,v.teamKey) && typeof v.id==='string').slice(0,500):[];
        state.pins=Array.isArray(raw.pins)?raw.pins.map(p=>cleanPin(p,teams)).filter(Boolean).slice(0,100):[];
      }
      localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    } catch { storageOK=false; $('storageWarning').hidden=false; }
  }
  function setTheme() {
    const p=palette(teamKey);
    for (const [token,key] of Object.entries({'--team':'primary','--secondary':'secondary','--on-team':'onPrimary','--readable':'readable','--soft':'soft'})) document.documentElement.style.setProperty(token,p[key]);
    $('teamBadge').innerHTML=teamKey?badge(teamKey):'';
    $('teamLabel').textContent=teamKey?teams[teamKey].display:'Choose your team';
    document.querySelector('meta[name="theme-color"]').content=p.primary;
  }
  function makeURL(kind='watch',key=teamKey,venueID='') {
    const u=new URL('/',location.origin); if(key)u.searchParams.set('team',key); u.searchParams.set('view',kind); if(venueID)u.searchParams.set('venue',venueID); return u;
  }
  function navigate(replace=false) {
    const u=makeURL(view,teamKey,view==='watch'?selectedVenue:'');
    if(sharedPin && sharedPin.teamKey===teamKey && view==='tailgate')u.hash='pin='+encodePin(sharedPin);
    history[replace?'replaceState':'pushState']({},'',u);
  }
  function encodePin(p) { const bytes=new TextEncoder().encode(JSON.stringify(p)); let bin=''; for(const b of bytes)bin+=String.fromCharCode(b); return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
  function decodePin(str) { if(!str || str.length>6000 || !/^[A-Za-z0-9_-]+$/.test(str))return null; try {let s=str.replace(/-/g,'+').replace(/_/g,'/'); s+='='.repeat((4-s.length%4)%4); return cleanPin(JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)))),teams);}catch{return null;} }
  function readRoute() {
    const url=new URL(location.href); const payload=new URLSearchParams(url.hash.slice(1)).get('pin');
    sharedPin=payload?decodePin(payload):null;
    const requested=url.searchParams.get('team');
    teamKey=sharedPin?sharedPin.teamKey:own(teams,requested)?requested:state.teamKey;
    const requestedView=url.searchParams.get('view'); const aliases={map:'watch',parties:'watch',tailgates:'tailgate',more:'fan',shop:'fan'};
    view=sharedPin?'tailgate':['home','watch','tailgate','fan','saved'].includes(requestedView)?requestedView:(own(aliases,requestedView)?aliases[requestedView]:'home');
    selectedVenue=url.searchParams.get('venue')||'';
    if(payload&&!sharedPin)toast('That meeting-point link is invalid. It was not loaded.');
  }
  function selectTeam(key) {
    if(!own(teams,key))return;
    teamKey=key; state.teamKey=key; state.myTeams[teams[key].category]=key; selectedVenue=''; sharedPin=null; pageLimit=40; persist();
    $('venueSearch').value=''; if($('teamDialog').open)$('teamDialog').close(); setTheme(); navigate(); render();
  }
  function openTeams() {
    $('teamSearch').value=''; $('categoryFilter').value=''; renderTeams(); $('teamDialog').showModal(); setTimeout(()=>$('teamSearch').focus(),30);
  }
  function renderTeams() {
    const q=normal($('teamSearch').value),cat=$('categoryFilter').value;
    const rows=Object.values(teams).filter(t=>(!cat||t.category===cat)&&(!q||normal(t.display+' '+t.category+' '+t.league).includes(q))).sort((a,b)=>a.display.localeCompare(b.display));
    $('teamResults').innerHTML=rows.map(t=>'<button class="team-option" data-team="'+esc(t.key)+'" aria-pressed="'+(t.key===teamKey)+'">'+badge(t.key)+'<span><strong>'+esc(t.display)+'</strong><small>'+esc(t.category+' · '+t.league)+'</small></span></button>').join('')||'<div class="empty">No matching team. Try a different name or category.</div>';
    $('teamCount').textContent=rows.length+' teams';
  }
  const isSaved = (key,id) => state.saved.some(s=>s.teamKey===key&&s.id===id);
  const findVenue = (key,id) => own(teams,key)?teams[key].chapters.find(v=>v.id===id):null;
  function saveVenue(key,id) {
    if(!findVenue(key,id))return;
    const had=isSaved(key,id);
    if(had)state.saved=state.saved.filter(s=>!(s.teamKey===key&&s.id===id));
    else {if(state.saved.length>=500){toast('Your device has 500 saved places. Remove one before adding another.');return;}state.saved.push({teamKey:key,id});}
    const saved=persist(); renderVenues(); renderSaved();
    if(view==='watch'&&selectedVenue)showVenue(selectedVenue,false);
    if(view==='home')renderHome();
    toast(had?'Removed from saved places.':saved?'Saved on this device.':'Saved for this session only. Device storage is unavailable.');
  }
  function card(v,key=teamKey) {
    const status=listingStatus(v), title=namedVenue(v)?v.venue:v.name||'Fan club', saved=isSaved(key,v.id);
    const attrs=' data-key="'+esc(key)+'" data-id="'+esc(v.id)+'"';
    return '<article class="venue-card'+(key===teamKey&&selectedVenue===v.id?' selected':'')+'"><p class="card-city">'+esc(v.city||teams[key].display)+'</p><div class="card-top"><h3><button class="venue-title" data-action="venue"'+attrs+'>'+esc(title)+'</button></h3><button class="save-button" data-action="save"'+attrs+' aria-pressed="'+saved+'" aria-label="'+(saved?'Unsave':'Save')+' '+esc(title)+'">'+(saved?'★':'☆')+'</button></div><p class="address">'+esc(v.addr||v.name||'Confirm meeting details with the host')+'</p><span class="tag '+status.kind+'">'+esc(status.label)+'</span><div class="actions"><button class="button secondary small" data-action="venue"'+attrs+'>View place</button><button class="button secondary small" data-action="share-venue"'+attrs+'>Share</button>'+(v.addr?'<a class="button secondary small" target="_blank" rel="noopener noreferrer" href="'+esc(directions(v))+'">Directions ↗</a>':'')+'</div></article>';
  }
  function officialLink() { const u=teamKey?safeURL(teams[teamKey].alumni_url):''; return u?'<a class="button secondary" href="'+esc(u)+'" target="_blank" rel="noopener noreferrer">Visit the team / fan directory ↗</a>':''; }
  function renderVenues() {
    if(!teamKey){$('resultCount').textContent='Start with your team';$('venueList').innerHTML='<div class="empty"><h3>Your people are out there.</h3><p>Choose your team to explore watch-party venues and fan clubs.</p><button class="button" data-action="choose-team">Choose your team</button></div>';$('showMore').hidden=true;return;}
    const q=normal($('venueSearch').value),f=$('venueFilter').value;
    const rows=teams[teamKey].chapters.filter(v=>(!q||normal([v.city,v.venue,v.name,v.addr].join(' ')).includes(q))&&(f!=='named'||namedVenue(v))&&(f!=='checked'||listingStatus(v).kind==='checked')&&(f!=='saved'||isSaved(teamKey,v.id)));
    $('resultCount').textContent=rows.length+' '+(rows.length===1?'location':'locations');
    $('venueList').innerHTML=rows.slice(0,pageLimit).map(v=>card(v)).join('')||'<div class="empty"><h3>'+(q?'No matches in this search.':'More fan locations are on the way.')+'</h3><p>'+(q?'Try a nearby city, a different venue name, or clear the filters.':'Check the team or supporter directory for current meetups while we expand this team’s coverage.')+'</p>'+officialLink()+'</div>';
    $('showMore').hidden=rows.length<=pageLimit;
    $('showMore').textContent='Show more locations ('+Math.min(rows.length,pageLimit)+' of '+rows.length+')';
  }
  function clearDetail() {
    $('watchDetail').classList.remove('has-selection');
    $('watchDetail').innerHTML='<div class="map-placeholder"><span class="big-pin" aria-hidden="true">⌖</span><h2>Select a place to watch</h2><p>Explore an address, get directions, and send the plan to your crew.</p></div>';
  }
  function showVenue(id,scroll=true) {
    const v=findVenue(teamKey,id); if(!v){selectedVenue='';clearDetail();return;}
    selectedVenue=id;
    const title=namedVenue(v)?v.venue:v.name, src=safeURL(v.src), status=listingStatus(v);
    // The provider searches the supplied address; un-geocoded listings are not
    // silently given invented coordinates or put at a city/stadium center.
    const mapHTML=v.addr?'<iframe class="venue-embed" title="Map search for '+esc(title)+'" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen src="https://maps.google.com/maps?q='+encodeURIComponent(addressQuery(v))+'&amp;z=15&amp;output=embed"></iframe>':'<div class="empty" style="margin:0 22px"><h3>Meeting address not listed yet.</h3><p>Use the host’s source to confirm the exact location. No map pin is shown for an unknown address.</p></div>';
    $('watchDetail').classList.add('has-selection');
    $('watchDetail').innerHTML='<div class="detail-head"><button class="mobile-back" data-action="close-detail">Close place details</button><p class="card-city">'+esc(v.city||'')+'</p><h2>'+esc(title)+'</h2><p class="muted">'+esc(v.addr||v.name||'')+'</p><span class="tag '+status.kind+'">'+esc(status.label)+'</span><div class="actions">'+(v.addr?'<a class="button" href="'+esc(directions(v))+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+'<button class="button secondary" data-action="share-venue" data-key="'+esc(teamKey)+'" data-id="'+esc(id)+'">Text your crew</button></div></div>'+mapHTML+'<div class="detail-notes"><p>'+esc(v.note||'Confirm the venue, opening hours, and current game-day plans with the host before traveling.')+'</p>'+(v.eventDate?'<p>Listed event date: '+esc(v.eventDate)+'. Confirm with the host.</p>':'')+(src?'<p><a href="'+esc(src)+'" target="_blank" rel="noopener noreferrer">Check the original source ↗</a></p>':'')+(v.sourceCheckedAt?'<p class="quiet">Source reviewed '+esc(v.sourceCheckedAt)+'. This is not a live event confirmation.</p>':'')+(v.addr?'<p class="quiet">Map search uses the listed address. Check the address and host before traveling. Directions remain available if the embedded map does not load.</p>':'')+'</div>';
    renderVenues();
    if(scroll && matchMedia('(max-width:720px)').matches)$('watchDetail').scrollIntoView({behavior:'auto',block:'start'});
  }
  function library() {
    if(root.L||root.leaflet)return root.L||root.leaflet;
    throw new Error('The map library is unavailable.');
  }
  function pinIcon(L,key) {return L.divIcon({html:badge(key),className:'fm-pin',iconSize:[38,38],iconAnchor:[19,38],popupAnchor:[0,-36]});}
  function currentStadium(){return stadiumFor(root.FANMAP_TEAM_STADIUMS,teamKey);}
  function renderTailgate() {
    if(!teamKey){$('stadiumName').textContent='Choose your team to explore its home venue';$('stadiumNote').textContent='';$('newPin').disabled=true;$('recenter').disabled=true;$('useLocation').disabled=true;return;}
    const s=currentStadium(); $('stadiumName').textContent=s?s.name:'Home venue not mapped yet';
    $('stadiumNote').textContent=s?(s.note||'Satellite view starts at your team’s stadium or arena. Check local rules and parking before tailgating.'):'We have not mapped an exact home venue for this team. You can use your location to make a meeting point; no placeholder stadium is shown.';
    $('recenter').disabled=!s; $('useLocation').disabled=false; $('newPin').disabled=!s&&!map;
    renderPins();
    if(view!=='tailgate')return;
    try{
      const L=library();
      if(!map){
        $('tailgateMap').innerHTML='';
        map=L.map('tailgateMap',{zoomControl:true,scrollWheelZoom:false});
        const imagery=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'});
        const street=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'});
        imagery.addTo(map); L.control.layers({'Satellite':imagery,'Street map':street},null,{collapsed:true}).addTo(map);
        mapGroup=L.layerGroup().addTo(map);
        map.on('click',e=>openPin(e.latlng.lat,e.latlng.lng));
        let tileErrors=0;imagery.on('tileerror',()=>{if(++tileErrors===4)$('mapHelp').textContent='Satellite imagery is not loading. Try Street map in the layer control. Coordinates and sharing remain available.';});
      }
      if(lastMapTeam!==teamKey){map.setView(s?s.start:[20,0],s?17:2);lastMapTeam=teamKey;}
      mapGroup.clearLayers();
      if(s)L.marker(s.start,{icon:pinIcon(L,teamKey)}).addTo(mapGroup).bindPopup('<strong>'+esc(s.name)+'</strong><br>Home venue · check local tailgating rules.');
      const pins=state.pins.filter(p=>p.teamKey===teamKey);if(sharedPin && sharedPin.teamKey===teamKey && !pins.some(p=>p.id===sharedPin.id))pins.push(sharedPin);
      for(const p of pins)L.marker([p.lat,p.lng],{icon:pinIcon(L,p.teamKey)}).addTo(mapGroup).bindPopup('<strong>'+esc(p.name)+'</strong><br>'+esc(p.note));
      if(sharedPin && sharedPin.teamKey===teamKey)map.setView([sharedPin.lat,sharedPin.lng],17);
      $('newPin').disabled=false;
      requestAnimationFrame(()=>map.invalidateSize());
    }catch(error){console.error(error);$('tailgateMap').innerHTML='<div class="empty"><h3>The map could not load.</h3><p>Reload to try again. You can still enter coordinates with “Drop a pin” or use your location.</p></div>';$('newPin').disabled=false;}
  }
  function pinCard(p,shared=false) {
    const attrs=' data-pin="'+esc(p.id)+'"'; const old=p.date&&p.date<day();
    return '<article class="pin-card"><p class="card-city">'+esc(teams[p.teamKey].display)+'</p><h3>'+esc(p.name)+'</h3><p>'+esc(p.note||'Your crew’s meeting point.')+'</p><p class="coordinates-text">'+p.lat.toFixed(6)+', '+p.lng.toFixed(6)+(p.date?' · '+esc(p.date):'')+'</p>'+(old?'<span class="tag old">Past date · confirm a new plan</span>':'')+'<p class="quiet" style="margin-top:12px">'+(shared?'Shared link · not saved on this device':'Saved on this device · not publicly posted')+'</p><div class="actions"><button class="button secondary small" data-action="view-pin"'+attrs+'>View pin</button><button class="button secondary small" data-action="share-pin"'+attrs+'>Share</button><a class="button secondary small" href="https://www.google.com/maps/dir/?api=1&amp;destination='+encodeURIComponent(p.lat+','+p.lng)+'" target="_blank" rel="noopener noreferrer">Directions ↗</a><button class="button secondary small" data-action="'+(shared?'import-pin':'delete-pin')+'"'+attrs+'>'+(shared?'Save to device':'Delete')+'</button></div></article>';
  }
  function renderPins() {
    const pins=state.pins.filter(p=>p.teamKey===teamKey);
    let html='';if(sharedPin && sharedPin.teamKey===teamKey && !pins.some(p=>p.id===sharedPin.id))html+=pinCard(sharedPin,true);
    html+=pins.map(p=>pinCard(p)).join('');
    $('pinList').innerHTML=html||'<div class="empty"><h3>Meet here. Cheer together.</h3><p>Drop a pin, add a landmark, and text the exact meeting point to your crew. Nobody else can see it unless you share the link.</p></div>';
  }
  function renderSaved() {
    const places=state.saved.map(s=>({s,v:findVenue(s.teamKey,s.id)})).filter(x=>x.v);
    $('savedVenues').innerHTML=places.map(({s,v})=>card(v,s.teamKey)).join('')||'<div class="empty">Tap the star on a watch-party place to save it here.</div>';
    $('savedPins').innerHTML=state.pins.map(p=>pinCard(p)).join('')||'<div class="empty">Your saved tailgate meeting points will appear here.</div>';
  }
  function openPin(lat,lng) {
    if(!teamKey){openTeams();return;}
    const s=currentStadium();const center=validCoordinates([lat,lng])?[lat,lng]:map?[map.getCenter().lat,map.getCenter().lng]:s?s.start:null;
    $('pinForm').reset();$('pinLat').value=center?center[0].toFixed(6):'';$('pinLng').value=center?center[1].toFixed(6):'';$('pinError').textContent='';$('pinDialog').showModal();
  }
  function getPin(id){return state.pins.find(p=>p.id===id)||(sharedPin&&sharedPin.id===id?sharedPin:null);}
  function showShare(title,url,description) {
    shareData={title,text:description,url}; $('shareDescription').textContent=description;$('shareURL').value=url;$('shareStatus').textContent='';
    $('smsLink').href='sms:' + (/iPad|iPhone|iPod/.test(navigator.userAgent)?'&':'?') + 'body=' + encodeURIComponent(description+'\n'+url);
    $('nativeShare').hidden=!navigator.share; $('shareDialog').showModal();
  }
  function shareVenue(key,id) {const v=findVenue(key,id);if(!v)return;const title=namedVenue(v)?v.venue:v.name;showShare(title,makeURL('watch',key,id).href,'Watch '+teams[key].display+' with us at '+title+(v.city?' — '+v.city:'')+'. Confirm plans with the host.');}
  function sharePin(p) {const u=makeURL('tailgate',p.teamKey);u.hash='pin='+encodePin(p);showShare(p.name,u.href,'Meet the '+teams[p.teamKey].display+' crew at '+p.name+(p.date?' on '+p.date:'')+'. '+p.note);}
  function externalCard(label,title,description,url,action,sponsored=false) {
    const safe=safeURL(url);if(!safe)return '';
    return '<article class="essential-card"><p class="eyebrow">'+esc(label)+'</p><h3>'+esc(title)+'</h3><p class="muted">'+esc(description)+'</p><a class="button secondary wide" href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer'+(sponsored?' sponsored':'')+'">'+esc(action)+' ↗</a></article>';
  }
  function merchandiseURL() {
    const affiliates=root.FANMAP_AFFILIATES||{}, aliases={arkansas:'uark'};
    const known=safeURL(affiliates[teamKey]||affiliates[aliases[teamKey]]);
    if(known)return known;
    const base=safeURL(affiliates.global);if(!base)return 'https://www.fanatics.com/';
    if(!teamKey)return base;
    const url=new URL(base);url.searchParams.set('u','https://www.fanatics.com/?query='+encodeURIComponent(teams[teamKey].display));url.searchParams.set('subId1',teamKey);return url.href;
  }
  function essentials() {
    const t=teams[teamKey],name=t?t.display:'your team';
    return externalCard('TEAM GEAR','Wear your colors.',name+' gear for wherever game day finds you.',merchandiseURL(),'Shop team gear',!!(root.FANMAP_AFFILIATES&&root.FANMAP_AFFILIATES.global))+
      externalCard('TICKETS','Be there for the moment.','Find tickets and choose your seat with StubHub.','https://www.stubhub.com/secure/search?q='+encodeURIComponent(t?t.display:''),'Find tickets');
  }
  function renderHome() {
    const t=teams[teamKey],keys=Object.values(state.myTeams).filter(k=>own(teams,k));
    $('myTeams').innerHTML=keys.length?'<span class="quiet">My teams</span>'+keys.map(k=>'<button class="my-team'+(k===teamKey?' selected':'')+'" data-team="'+esc(k)+'">'+badge(k)+'<span>'+esc(teams[k].display)+'</span></button>').join('')+'<button class="text-button" data-action="choose-team">Choose a team +</button>':'';
    const locations=t?t.chapters:[];
    const cities=new Set(locations.map(v=>normal(v.city)).filter(Boolean));
    $('homeStats').innerHTML=t?'<div><strong>'+locations.length.toLocaleString()+'</strong><span>Directory locations</span></div><div><strong>'+cities.size.toLocaleString()+'</strong><span>Cities / areas</span></div><div><strong>'+state.saved.filter(v=>v.teamKey===teamKey).length+'</strong><span>Saved places</span></div>':'<p class="muted">Choose from '+Object.keys(teams).length+' teams across college and professional sports.</p>';
    $('homeEssentials').innerHTML=essentials();
    $('homePlaces').innerHTML=locations.length?locations.filter(namedVenue).slice(0,3).map(v=>card(v)).join(''):'<div class="empty"><h3>'+(t?'Explore your fan community.':'Start with your team.')+'</h3><p>'+(t?'Visit the team directory while we expand local venue coverage.':'Choose your team to find watch-party venues and make your game-day plan.')+'</p>'+(t?officialLink():'<button class="button" data-action="choose-team">Choose your team</button>')+'</div>';
  }
  function renderFanZone() {
    const t=teams[teamKey];$('fanEssentials').innerHTML=essentials();
    const sports={College:'college-football',NFL:'nfl',NBA:'nba',MLB:'mlb',NHL:'nhl',Soccer:'soccer',Rugby:'rugby',Cricket:'cricket'};
    const sport=t?sports[t.category]||'':'';
    let publishers=externalCard('SPORTS DESK','ESPN','Open the publisher for current sports coverage.','https://www.espn.com/'+(sport?sport+'/':''),'Read ESPN')+externalCard('SPORTS DESK','Yahoo Sports','Headlines, scores, and stories from the sports desk.','https://sports.yahoo.com/','Read Yahoo Sports');
    if(teamKey==='arkansas')publishers=externalCard('ARKANSAS','HawgSports','Follow Arkansas coverage at the publisher.','https://247sports.com/college/arkansas/','Read HawgSports')+publishers;
    $('publisherList').innerHTML=publishers;
    let links='';
    if(t){
      if(t.nil)links+=externalCard('ATHLETE SUPPORT',t.nil.label||'Support your athletes','Review the program and contribute directly with the provider.',t.nil.url,'Visit support program');
      if(t.foundation)links+=externalCard('TEAM SUPPORT',t.foundation.label||'Back your program','Review giving opportunities with the linked organization.',t.foundation.url,'Explore giving');
      links+=externalCard('FAN COMMUNITY',t.display+' fans','Find team, alumni, or supporter information from the directory linked for your team.',t.alumni_url,'Visit fan directory');
    }
    $('supportLinks').innerHTML=links||'<div class="empty"><p>Choose a team to see its available community and support links.</p><button class="button" data-action="choose-team">Choose your team</button></div>';
  }
  function render() {
    setTheme();
    document.querySelectorAll('[data-view]').forEach(b=>{const on=b.dataset.view===view;b.classList.toggle('active',on);if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    $('homeView').hidden=view!=='home';$('watchView').hidden=view!=='watch';$('tailgateView').hidden=view!=='tailgate';$('savedView').hidden=view!=='saved';$('fanView').hidden=view!=='fan';
    const t=teams[teamKey];$('teamContext').textContent=t?t.category+' / '+t.league:'FIND YOUR FANHOOD';
    $('pageTitle').textContent=view==='home'?(t?t.display+'. Your game day.':'Find your fanhood.'):view==='fan'?'All in for your team.':view==='tailgate'?'Make game day a meet-up.':view==='saved'?'Keep your crew’s places close.':t?t.display+'. Anywhere.':'Your team. Your people.';
    $('pageSubtitle').textContent=view==='home'?'Watch parties. Tailgates. Tickets. Team gear. Your people.':view==='fan'?'Wear your colors, find tickets, follow the news, and support your team.':view==='tailgate'?'Your stadium. Your meeting point. One text to your crew.':view==='saved'?'Your watch-party places and tailgate pins, ready for game day.':'Find watch-party venues and fan clubs. Never watch alone.';
    if(view==='home')renderHome();if(view==='fan')renderFanZone();
    if(view==='watch'){renderVenues();if(selectedVenue)showVenue(selectedVenue,false);else clearDetail();}
    if(view==='tailgate')renderTailgate();if(view==='saved')renderSaved();
  }
  function info(privacy) {
    $('infoTitle').textContent=privacy?'Your information. Your control.':'A better game-day plan.';
    $('infoContent').innerHTML=privacy?'<h3>Stored on your device</h3><p>Your team choices (one per sport category), starred locations, and meeting points are stored in this browser’s local storage. They do not sync between devices. Clearing site data removes them.</p><h3>Sharing is your choice</h3><p>Meeting-point links contain the exact coordinates, name, date, and instructions you enter. Anyone who receives or forwards a link can read those details. Existing links are snapshots: deleting your saved copy does not revoke a link already shared.</p><h3>Maps and your location</h3><p>Your device location is requested only after you press “Use my location.” Map providers receive ordinary requests for the areas you view. Venue maps use Google Maps; tailgate maps use Esri imagery and optional OpenStreetMap tiles. Location is not sent to a Fan Map account service.</p><h3>No account required</h3><p>This web release does not create cloud accounts, publish public posts, collect payments, or send email. A source link or directions button opens an external provider.</p>':'<h3>One team. Your whole game day.</h3><p>Home brings together watch-party discovery, stadium tailgates, merchandise, tickets, sports coverage, and available team-support links.</p><h3>Watch parties</h3><p>Choose your team, search a city, and find its venues or fan clubs. Open a place for its listed address, directions, source, and a link to text your crew.</p><h3>Tailgates</h3><p>A separate satellite map starts at your team’s mapped home stadium or arena. Tap the map to save a meeting point. Add a landmark and share the exact pin.</p><h3>Directory status</h3><p>“Source checked” means a source was reviewed—not that tonight’s event is guaranteed. “Listed” records still need confirmation. “Needs update” can include an older event or listing. Always check the host’s current plans.</p><h3>Your saved places</h3><p>Stars and meeting points persist in this browser. Shared links open the actual place or pin for the recipient. Cloud accounts, a public fan board, and payments are not connected in this release.</p>';
    $('infoDialog').showModal();
  }
  function bind() {
    $('teamButton').onclick=openTeams;$('teamSearch').oninput=renderTeams;$('categoryFilter').onchange=renderTeams;
    $('venueSearch').oninput=()=>{pageLimit=40;renderVenues();};$('venueFilter').onchange=()=>{pageLimit=40;renderVenues();};
    $('clearSearch').onclick=()=>{$('venueSearch').value='';$('venueFilter').value='all';pageLimit=40;renderVenues();};
    $('showMore').onclick=()=>{pageLimit+=40;renderVenues();};$('aboutButton').onclick=()=>info(false);$('privacyButton').onclick=()=>info(true);
    $('newPin').onclick=()=>openPin();$('recenter').onclick=()=>{const s=currentStadium();if(s&&map)map.setView(s.start,17);};
    $('useLocation').onclick=()=>{
      if(!navigator.geolocation){toast('Location is unavailable. Drop a pin on the map instead.');return;}
      $('useLocation').disabled=true;
      navigator.geolocation.getCurrentPosition(p=>{$('useLocation').disabled=false;if(map)map.setView([p.coords.latitude,p.coords.longitude],18);openPin(p.coords.latitude,p.coords.longitude);},()=>{$('useLocation').disabled=false;toast('Location was unavailable or not allowed. You can drop a pin manually.');},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
    };
    $('pinForm').onsubmit=e=>{
      e.preventDefault();
      if(state.pins.length>=100){$('pinError').textContent='This device has 100 meeting points. Delete one before adding another.';return;}
      const id=root.crypto&&crypto.randomUUID?crypto.randomUUID():'pin-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
      const p=cleanPin({id,teamKey,name:$('pinName').value,note:$('pinNote').value,date:$('pinDate').value,lat:Number($('pinLat').value),lng:Number($('pinLng').value)},teams);
      if(!p){$('pinError').textContent='Enter a name and valid latitude and longitude.';return;}
      state.pins.push(p);const ok=persist();$('pinDialog').close();renderTailgate();renderSaved();if(map)map.setView([p.lat,p.lng],17);toast(ok?'Meeting point saved on this device.':'Meeting point saved for this session only.');
    };
    $('copyLink').onclick=async()=>{try{if(!navigator.clipboard)throw new Error('Unavailable');await navigator.clipboard.writeText($('shareURL').value);$('shareStatus').textContent='Link copied.';}catch{$('shareURL').focus();$('shareURL').select();$('shareStatus').textContent='Select and copy the link above.';}};
    $('nativeShare').onclick=async()=>{try{await navigator.share(shareData);}catch(e){if(e.name!=='AbortError')$('shareStatus').textContent='Sharing is unavailable here. Copy the link or send a text instead.';}};
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');if(!b)return;
      if(b.dataset.close){$(b.dataset.close).close();return;}
      if(b.dataset.team){selectTeam(b.dataset.team);return;}
      if(b.dataset.view){view=b.dataset.view;navigate();render();return;}
      const action=b.dataset.action,key=b.dataset.key,id=b.dataset.id;
      if(action==='choose-team')openTeams();
      if(action==='save')saveVenue(key,id);
      if(action==='share-venue')shareVenue(key,id);
      if(action==='close-detail'){selectedVenue='';clearDetail();renderVenues();navigate();}
      if(action==='venue'){if(!findVenue(key,id))return;teamKey=key;view='watch';state.teamKey=key;persist();selectedVenue=id;render();navigate();showVenue(id);}
      const p=b.dataset.pin?getPin(b.dataset.pin):null;
      if(action==='share-pin'&&p)sharePin(p);
      if(action==='view-pin'&&p){teamKey=p.teamKey;view='tailgate';state.teamKey=teamKey;persist();render();navigate();if(map)map.setView([p.lat,p.lng],18);}
      if(action==='import-pin'&&p){if(state.pins.length>=100){toast('Delete a meeting point before saving another.');return;}if(!state.pins.some(x=>x.id===p.id))state.pins.push({...p});const ok=persist();renderPins();renderSaved();toast(ok?'Meeting point saved on this device.':'Saved for this session only.');}
      if(action==='delete-pin'&&p&&confirm('Delete “'+p.name+'” from this device? Links already shared will still work.')){state.pins=state.pins.filter(x=>x.id!==p.id);persist();renderPins();renderSaved();if(view==='tailgate')renderTailgate();}
    });
    root.addEventListener('popstate',()=>{readRoute();render();});
  }
  async function boot() {
    try{
      teams=buildTeams(root);restore();readRoute();
      $('categoryFilter').innerHTML='<option value="">All sports &amp; categories</option>'+[...new Set(Object.values(teams).map(t=>t.category))].sort().map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');
      bind();$('bootStatus').hidden=true;$('main').hidden=false;$('teamButton').disabled=false;render();
      if(!teamKey && view!=='saved')openTeams();
    }catch(error){console.error(error);$('bootStatus').innerHTML='<h2>Fan Map could not load.</h2><p style="margin-top:12px">Check your connection and reload to try again. Your saved places have not been changed.</p><button class="button" id="reloadApp" style="margin-top:20px">Try again</button>';$('reloadApp').onclick=()=>location.reload();}
  }
  boot();
})(typeof window !== 'undefined' ? window : globalThis);
