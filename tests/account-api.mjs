import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../supabase/functions/fanmap-access/handler.mjs';
const payload={teams:{test:{category:'NFL',chapters:[{id:'v1'}]}},colors:{},stadiums:{}};
function fixture(user={id:'real-user',email_confirmed_at:'2026-09-09',profile:true}) {
 const calls=[];
 const handler=createHandler({
  verify:async token=>{calls.push(['verify',token]);if(token==='forged')throw Error();return user;},
  rateLimit:async()=>true,
  readPayload:async()=>{calls.push(['payload']);return payload;},
  readState:async uid=>{calls.push(['read-state',uid]);return {};},
  saveState:async(uid,state)=>{calls.push(['save-state',uid,state]);},
  readShare:async id=>{calls.push(['share',id]);return {name:'PRIVATE COORDINATES',lat:36,lng:-94};},
  createShare:async(uid,pin)=>{calls.push(['create-share',uid,pin]);return '055dcf51-021b-4ff8-aa55-3bd9261208be';}
 });return {handler,calls};
}
function req(body,token='verified',origin='https://fanmap.com') {return new Request('https://test.supabase.co/functions/v1/fanmap-access',{method:'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});}
for(const action of ['bootstrap','save-state','create-share'])test(`anonymous ${action} cannot read data`,async()=>{
 const {handler,calls}=fixture();const response=await handler(req({action,share:'055dcf51-021b-4ff8-aa55-3bd9261208be'},''));assert.equal(response.status,401);assert.equal(calls.length,0);assert(!await response.text().then(x=>x.includes('PRIVATE COORDINATES')));
});
for(const [name,user,status] of [['forged',null,401],['anonymous',{id:'guest',profile:true,is_anonymous:true,email_confirmed_at:'yes'},403],['unverified',{id:'member',profile:true},403],['no profile',{id:'member',email_confirmed_at:'yes'},403]])test(name+' fails before the directory or share read',async()=>{
 const {handler,calls}=fixture(user);const response=await handler(req({action:'bootstrap',share:'055dcf51-021b-4ff8-aa55-3bd9261208be'},name==='forged'?'forged':'valid'));assert.equal(response.status,status);assert(!calls.some(c=>c[0]==='payload'||c[0]==='share'));
});
test('member-only bootstrap and share data are never publicly cacheable',async()=>{const {handler}=fixture();const r=await handler(req({action:'bootstrap',share:'055dcf51-021b-4ff8-aa55-3bd9261208be'}));assert.equal(r.status,200);assert.match(r.headers.get('Cache-Control'),/private, no-store/);assert((await r.json()).sharedPin);});
test('requested user ID cannot change ownership of writes',async()=>{const {handler,calls}=fixture();const r=await handler(req({action:'save-state',user_id:'someone-else',state:{pins:[],saved:[{teamKey:'test',id:'v1'}]}}));assert.equal(r.status,200);assert.equal(calls.find(c=>c[0]==='save-state')[1],'real-user');});
test('opaque invite response does not expose the coordinates',async()=>{const {handler}=fixture();const r=await handler(req({action:'create-share',pin:{teamKey:'test',name:'Crew',note:'Gate',lat:36,lng:-94}}));assert.equal(r.status,201);const body=await r.json();assert.deepEqual(Object.keys(body),['id']);});
test('invalid team and coordinates are rejected',async()=>{const {handler}=fixture();for(const pin of [{teamKey:'__proto__',name:'x',note:'',lat:0,lng:0},{teamKey:'test',name:'x',note:'',lat:91,lng:0}])assert.equal((await handler(req({action:'create-share',pin}))).status,400);});
test('unapproved origin is denied',async()=>{const {handler,calls}=fixture();assert.equal((await handler(req({action:'bootstrap'},'valid','https://attacker.example'))).status,403);assert.equal(calls.length,0);});
test('unsupported methods and malformed JSON are denied',async()=>{const {handler}=fixture();assert.equal((await handler(new Request('https://example.org/'))).status,405);const r=new Request('https://example.org/',{method:'POST',headers:{Authorization:'Bearer verified'},body:'{'});assert.equal((await handler(r)).status,400);});
