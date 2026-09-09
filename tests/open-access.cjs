'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {restoreLegacy}=require('../assets/open-access.js');
function store(entries={}){const m=new Map(Object.entries(entries));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v)};}
const backup=JSON.stringify({teamKey:'arkansas',myTeams:{College:'arkansas'},saved:[{teamKey:'arkansas',id:'dallas'}],pins:[{id:'my-pin',name:'Crew',lat:36,lng:-94}],signedIn:true});
const s=store({'fanmap.legacy.backup.v1':backup});assert.equal(restoreLegacy(s),true);const restored=JSON.parse(s.getItem('fanmap.web.v1'));assert.equal(restored.pins[0].name,'Crew');assert(!('signedIn'in restored));assert.equal(s.getItem('fanmap.legacy.backup.v1'),backup);assert.equal(restoreLegacy(s),false);
const newer=store({'fanmap.web.v1':'{"teamKey":"asu"}','fanmap.legacy.backup.v1':backup});assert.equal(restoreLegacy(newer),false);assert.equal(JSON.parse(newer.getItem('fanmap.web.v1')).teamKey,'asu');
for(const raw of ['null','[]','{broken'])assert.equal(restoreLegacy(store({'fanmap.legacy.backup.v1':raw})),false);
assert.equal(restoreLegacy({getItem(){throw Error('Blocked');}}),false);
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),html=read('index.html');
assert(!/id="authDialog"|data-auth-mode|assets\/access\.(js|css)|access-config\.js|type="password"|type="email"/i.test(html));
assert(html.includes('content="temporary-public"'));
const scripts=[...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map(m=>m[1]);
assert(scripts.every(s=>s.startsWith('/assets/')));assert(scripts.findIndex(s=>s.includes('open-access.js'))<scripts.findIndex(s=>s.includes('web-app.js')));
for(const s of scripts)assert(fs.existsSync(path.join(root,'public-build',s.split('?')[0])),s);
assert(!fs.existsSync(path.join(root,'public-build/assets/access.js')));assert(!fs.existsSync(path.join(root,'public-build/supabase')));assert(!fs.existsSync(path.join(root,'public-build/research')));
assert(!read('_config.yml').includes('  - assets/data'));
assert(!read('assets/web-app.js').includes('FANMAP_ACCESS'));
console.log('PASS temporary public access, no signup or backend dependency, legacy-save recovery, and public allowlist.');
