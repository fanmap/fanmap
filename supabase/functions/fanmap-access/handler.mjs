/** The only directory/share API. Every data path passes server-side user validation. */
const own = (o,k) => !!o && Object.prototype.hasOwnProperty.call(o,k);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACTIONS = new Set(['bootstrap','save-state','create-share']);
export function cleanPin(p,teams) {
  if(!p || !own(teams,p.teamKey) || typeof p.name!=='string' || !p.name.trim() || p.name.length>80 || typeof p.note!=='string' || p.note.length>240 || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || Math.abs(p.lat)>90 || Math.abs(p.lng)>180)throw new Error('Invalid meeting point.');
  const date=typeof p.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.date)?p.date:'';
  return {id:typeof p.id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(p.id)?p.id:crypto.randomUUID(),teamKey:p.teamKey,name:p.name.trim(),note:p.note,date,lat:p.lat,lng:p.lng};
}
export function cleanState(s,teams) {
  if(!s || typeof s!=='object' || Array.isArray(s))throw new Error('Invalid account state.');
  const saved=Array.isArray(s.saved)?s.saved:[],pins=Array.isArray(s.pins)?s.pins:[];
  if(saved.length>500 || pins.length>100)throw new Error('Account save limit reached.');
  const myTeams={};
  for(const [category,key] of Object.entries(s.myTeams || {}))if(own(teams,key)&&teams[key].category===category)myTeams[category]=key;
  return {teamKey:own(teams,s.teamKey)?s.teamKey:'',myTeams,
    saved:saved.filter(v=>v&&own(teams,v.teamKey)&&typeof v.id==='string'&&teams[v.teamKey].chapters.some(c=>c.id===v.id)).map(v=>({teamKey:v.teamKey,id:v.id})),
    pins:pins.map(p=>cleanPin(p,teams))};
}
export function createHandler(services, allowedOrigins=['https://fanmap.com','https://www.fanmap.com']) {
  return async request => {
    const origin=request.headers.get('Origin');
    const headers={'Content-Type':'application/json','Cache-Control':'private, no-store, max-age=0','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(origin && allowedOrigins.includes(origin))headers['Access-Control-Allow-Origin']=origin;
    const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
    if(origin&&!allowedOrigins.includes(origin))return reply({error:'Origin not allowed.'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS'}});
    if(request.method!=='POST')return reply({error:'Method not allowed.'},405);
    const bearer=request.headers.get('Authorization') || '';
    if(!/^Bearer [A-Za-z0-9_.-]+$/.test(bearer) || bearer.length>12000)return reply({error:'Sign in to access Fan Map.'},401);
    let user;
    try { user=await services.verify(bearer.slice(7)); } catch { return reply({error:'Your session is invalid or expired. Please sign in.'},401); }
    if(!user?.id || user.is_anonymous || !user.email_confirmed_at || !user.profile)return reply({error:'A registered, email-verified account is required.'},403);
    try {
      if(!await services.rateLimit(user.id))return reply({error:'Too many requests. Please try again shortly.'},429);
      const raw=await request.text();if(raw.length>65536)return reply({error:'Request is too large.'},413);
      let body;try{body=JSON.parse(raw);}catch{return reply({error:'Invalid request.'},400);}
      if(!ACTIONS.has(body?.action))return reply({error:'Unknown action.'},400);
      const payload=await services.readPayload();
      if(!payload?.teams || !payload.colors || !payload.stadiums)return reply({error:'The member directory is not connected yet. Access remains locked.'},503);
      if(body.action==='bootstrap') {
        let sharedPin=null;
        if(body.share){
          if(typeof body.share!=='string'||!UUID.test(body.share))return reply({error:'This meeting link is invalid.'},400);
          sharedPin=await services.readShare(body.share);
          if(!sharedPin)return reply({error:'This meeting link is no longer available.'},404);
        }
        return reply({payload,state:await services.readState(user.id),sharedPin});
      }
      if(body.action==='save-state') {
        let state;try{state=cleanState(body.state,payload.teams);}catch(e){return reply({error:e.message},400);}
        await services.saveState(user.id,state);return reply({saved:true});
      }
      let pin;try{pin=cleanPin(body.pin,payload.teams);}catch(e){return reply({error:e.message},400);}
      return reply({id:await services.createShare(user.id,pin)},201);
    } catch(error) {
      console.error('FanMap access request failed:',error?.name || 'Error');
      return reply({error:'The account service is temporarily unavailable. Please try again.'},503);
    }
  };
}
