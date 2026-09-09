// Data separation gate for the NFL watch-party expansion. No network access.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),ctx={window:{}};
for(const name of ['team-catalog','team-stadiums','verified-locations'])vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data/'+name+'.js'),'utf8'),ctx);
const nfl=Object.entries(ctx.window.FANMAP_CATALOG.metadata).filter(([,m])=>m.category==='NFL').map(([k])=>k);
const stadiums=ctx.window.FANMAP_TEAM_STADIUMS,records=ctx.window.FANMAP_VERIFIED_LOCATIONS.records;
const html=fs.readFileSync(path.join(root,'research/legacy-app.source.txt'),'utf8');
const original=JSON.parse(html.match(/const PREVIEW_SCHOOLS=(.*);\nconst PREVIEW_AFFILIATES=/)[1]);
const visible={...original,...JSON.parse(JSON.stringify(ctx.window.FANMAP_CATALOG.teams))};
ctx.window.applyFanMapVerifiedLocations(visible,'2026-09-09');
assert.equal(nfl.length,32);
const stadiumNames=new Set(Object.values(stadiums).map(s=>s.name?.toLowerCase()).filter(Boolean));
for(const key of nfl){
 assert.ok(visible[key].chapters.some(r=>r.venue&&!/^(?:venue announced per game|tbd|to be announced)$/i.test(r.venue)),'Each NFL team has a public watch venue: '+key);
 assert.ok(stadiums[key].start?.length===2,'Each NFL team keeps its separate stadium center: '+key);
 for(const r of records.filter(r=>r.teamKey===key)){
  assert.ok(!stadiumNames.has(r.venue.toLowerCase()),'A stadium must not become a watch-party business: '+r.venue);
  assert.ok(!/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(r.venue+' '+r.city+' '+r.addr),'No personal email addresses in venue fields');
  assert.ok(!/^(?:tbd|home|private home|various bars|not yet determined)$/i.test(r.venue));
 }
}
const held=JSON.parse(fs.readFileSync(path.join(root,'research/location-corrections.json'),'utf8')).filter(x=>x.patch.disposition==='hold');
for(const fix of held)assert.ok(!records.some(r=>r.id===fix.id),'Held location must stay out of watch-party cards');
const teams=Object.fromEntries(nfl.map(k=>[k,{chapters:[],stadiumMap:{features:[]}}]));
ctx.window.applyFanMapTeamStadiums(teams,'2026-09-09');
const before=JSON.stringify(nfl.map(k=>[teams[k].stadium,teams[k].stadiumMap]));
ctx.window.applyFanMapVerifiedLocations(teams,'2026-09-09');
assert.equal(JSON.stringify(nfl.map(k=>[teams[k].stadium,teams[k].stadiumMap])),before,'Watch-party import must leave tailgate map centers and features unchanged');
console.log('PASS: all 32 NFL teams have watch venues and separate sourced tailgate centers; scope exclusions are preserved.');
