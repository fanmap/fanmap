// Read-only checks; no accounts or emails are created.
import assert from 'node:assert/strict';
const url=process.env.FANMAP_SUPABASE_URL;
const key=process.env.FANMAP_SUPABASE_PUBLISHABLE_KEY;
assert(url&&key,'Set the public project URL and publishable key.');
const headers={apikey:key,'Content-Type':'application/json',Origin:'https://fanmap.com'};
for(const token of ['', 'forged.token.signature']){
  const r=await fetch(url+'/functions/v1/fanmap-access',{method:'POST',headers:{...headers,...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify({action:'bootstrap'}),signal:AbortSignal.timeout(20000)});
  assert.equal(r.status,401,'Unauthenticated requests must return 401.');
  assert.match(r.headers.get('cache-control')||'',/private, no-store/);
  const body=await r.json();assert(!body.payload);
}
for(const table of ['fanmap_profiles','fanmap_member_payload','fanmap_member_state','fanmap_member_shares','fanmap_access_limits']){
  const r=await fetch(url+'/rest/v1/'+table+'?select=*&limit=1',{headers,signal:AbortSignal.timeout(20000)});
  assert([401,403].includes(r.status),table+' should deny direct guest access; got '+r.status);
}
const settings=await fetch(url+'/auth/v1/settings',{headers,signal:AbortSignal.timeout(20000)});
assert.equal(settings.status,200);
const auth=await settings.json();
assert.equal(auth.external.anonymous_users,false);
assert.equal(auth.external.email,true);
assert.equal(auth.mailer_autoconfirm,false);
console.log('PASS live anonymous API denial, private-cache headers, direct REST denial, and verified-email settings. Member journeys and email delivery remain separate activation gates.');
