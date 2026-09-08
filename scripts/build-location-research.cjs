// Rebuild the public venue layer and research queue from reviewed source records.
// This script processes local data only. It does not fetch or scrape websites.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const checkedAt = '2026-09-08';
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const entries = JSON.parse(read('research/venue-research.json'));
const reviews = JSON.parse(read('research/reviewed-teams.json'));
const context = {window:{}};
vm.runInNewContext(read('assets/data/team-catalog.js'),context);
const catalog = context.window.FANMAP_CATALOG;
const html = read('app.html');
const original = JSON.parse(html.match(/const PREVIEW_SCHOOLS=(.*);\nconst PREVIEW_AFFILIATES=/)[1]);
const teams = {...original,...catalog.teams};
const normalize = s => String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const allowed = new Set(['official-directory','venue-published','dated-event']);
const ids = new Set();
const publicRows = [];
for(const r of entries){
  assert(teams[r.teamKey], 'Unknown team '+r.teamKey);
  assert(r.venue && r.city && r.src && r.evidence && r.checkedAt, 'Missing source/venue fields '+r.team);
  assert.equal(r.checkedAt,checkedAt);
  assert(allowed.has(r.verification),'Unknown verification basis '+r.verification);
  assert(['http:','https:'].includes(new URL(r.src).protocol),'Unsafe source URL');
  if(r.addressSource)assert(['http:','https:'].includes(new URL(r.addressSource).protocol),'Unsafe address source URL');
  assert(!/[<>]/.test(r.venue+r.city+(r.addr||'')),'Unexpected HTML');
  assert(r.verification!=='dated-event' || /^\d{4}-\d{2}-\d{2}$/.test(r.eventDate||''),'Dated event missing date');
  // Historical evidence stays in the research file; it does not become a current venue.
  if(r.disposition==='historical' || r.disposition==='hold' ||
    (r.eventDate && r.eventDate<checkedAt) || (r.validThrough && r.validThrough<checkedAt)) continue;
  const identity=[r.teamKey,normalize(r.venue),normalize(r.addr||r.city)].join('|');
  assert(!ids.has(identity),'Duplicate venue '+identity);ids.add(identity);
  const id='checked-'+crypto.createHash('sha256').update(identity).digest('hex').slice(0,16);
  publicRows.push({teamKey:r.teamKey,id,name:r.name||r.team+' fans',venue:r.venue,city:r.city,addr:r.addr||'',
    note:r.note||'',src:r.src,addressSource:r.addressSource||null,sourceTitle:r.sourceTitle||'',sourceCheckedAt:checkedAt,sourceVerification:r.verification,
    eventDate:r.eventDate||null,validThrough:r.validThrough||null,verified:true,lat:null,lng:null});
}
const payload={checkedAt,records:publicRows};
const runtime=`/* Source-checked venue layer. Rebuild with node scripts/build-location-research.cjs. */
window.FANMAP_VERIFIED_LOCATIONS=${JSON.stringify(payload).replace(/</g,'\\u003c')};
window.applyFanMapVerifiedLocations=function(teams,today){
 today=today||new Date().toISOString().slice(0,10);
 const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 for(const record of window.FANMAP_VERIFIED_LOCATIONS.records){
  if((record.eventDate&&record.eventDate<today)||(record.validThrough&&record.validThrough<today))continue;
  const team=teams[record.teamKey];if(!team)continue;
  const existing=team.chapters.find(x=>x.id===record.id||(norm(x.venue)===norm(record.venue)&&norm(x.city)===norm(record.city)));
  const {teamKey,...venue}=record;
  if(existing){const sameAddress=norm(existing.addr)===norm(venue.addr);Object.assign(existing,venue,{id:existing.id,lat:sameAddress?existing.lat:null,lng:sameAddress?existing.lng:null});}
  else team.chapters.push({...venue});
 }
};
`;
fs.writeFileSync(path.join(root,'assets/data/verified-locations.js'),runtime);
vm.runInNewContext(runtime,context);
context.window.applyFanMapVerifiedLocations(teams,checkedAt);
const counts = {};
const queue = Object.values(teams).map(t=>{
  const checked=t.chapters.filter(c=>c.sourceVerification).length;
  const history=entries.filter(r=>r.teamKey===t.key);
  const attempted=reviews.filter(r=>r.teamKey===t.key);
  const meta=catalog.metadata[t.key];
  const status=checked?'source-checked-venues':history.length?'historical-or-held-evidence':attempted.length?'reviewed-needs-follow-up':'not-yet-reviewed';
  counts[status]=(counts[status]||0)+1;
  return {teamKey:t.key,team:t.display,category:meta.category,league:meta.league,status,sourceCheckedVenueCount:checked,
    existingRecordCount:t.chapters.length-checked,sources:[...new Set(history.map(r=>r.src))],reviews:attempted};
});
const summary={checkedAt,totalTeams:queue.length,newSourceCheckedVenues:publicRows.length,teamsWithSourceCheckedVenues:queue.filter(t=>t.sourceCheckedVenueCount).length,
  totalTeamsWithAnyRecords:Object.values(teams).filter(t=>t.chapters.length).length,totalDirectoryRecords:Object.values(teams).reduce((n,t)=>n+t.chapters.length,0),
  historicalOrHeldRecords:entries.length-publicRows.length,teamsReviewed:new Set(reviews.map(r=>r.teamKey)).size,statusCounts:counts};
fs.writeFileSync(path.join(root,'research/location-coverage.json'),JSON.stringify({summary,teams:queue},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
