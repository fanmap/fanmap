// Rebuild the public venue layer and research queue from reviewed source records.
// This script processes local data only. It does not fetch or scrape websites.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const checkedAt = process.env.FANMAP_RESEARCH_DATE || new Date().toISOString().slice(0,10);
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
const allowed = new Set(['official-directory','venue-published','dated-event','community-directory']);
const ids = new Set();
const publicRows = [];
for(const r of entries){
  assert(teams[r.teamKey], 'Unknown team '+r.teamKey);
  assert(r.venue && r.city && r.src && r.evidence && r.checkedAt, 'Missing source/venue fields '+r.team);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(r.checkedAt) && r.checkedAt<=checkedAt, 'Invalid source-check date '+r.checkedAt);
  assert(allowed.has(r.verification),'Unknown verification basis '+r.verification);
  assert(['http:','https:'].includes(new URL(r.src).protocol),'Unsafe source URL');
  if(r.addressSource)assert(['http:','https:'].includes(new URL(r.addressSource).protocol),'Unsafe address source URL');
  assert(!/[<>]/.test(r.venue+r.city+(r.addr||'')),'Unexpected HTML');
  assert(r.verification!=='dated-event' || /^\d{4}-\d{2}-\d{2}$/.test(r.eventDate||''),'Dated event missing date');
  // Named places can be useful launch content before confirmation. A conflicting
  // address stays on hold; an old event becomes a venue lead, never an upcoming event.
  if(r.disposition==='hold')continue;
  const historical=r.disposition==='historical'||r.discoveryStatus==='needs-update'||
    (r.eventDate&&r.eventDate<checkedAt)||(r.validThrough&&r.validThrough<checkedAt);
  const sourceChecked=!historical&&r.verification!=='community-directory'&&r.reviewLevel!=='directory-listed';
  const identity=[r.teamKey,normalize(r.venue),normalize(r.addr||r.city)].join('|');
  assert(!ids.has(identity),'Duplicate venue '+identity);ids.add(identity);
  const id=r.id||'checked-'+crypto.createHash('sha256').update(identity).digest('hex').slice(0,16);
  publicRows.push({teamKey:r.teamKey,id,name:r.name||r.team+' fans',venue:r.venue,city:r.city,addr:r.addr||'',
    note:historical?[(r.eventDate||r.validThrough)?'Previously listed watch-party venue.':'Listing details need an update.',r.note||'Check the source for current game-day plans.'].join(' '):r.note||'',src:r.src,addressSource:r.addressSource||null,sourceTitle:r.sourceTitle||'',sourceCheckedAt:r.checkedAt,
    sourceBasis:r.verification,sourceVerification:sourceChecked?r.verification:null,listingStatus:historical?'needs-update':sourceChecked?'source-checked':'listed',
    eventDate:historical?null:r.eventDate||null,validThrough:historical?null:r.validThrough||null,lastKnownEventDate:historical?r.eventDate||r.validThrough||null:null,
    namedVenue:true,verified:sourceChecked,lat:null,lng:null});
}
const payload={checkedAt,records:publicRows};
const runtime=`/* Venue directory, including listings awaiting confirmation. Filename retained for compatibility.
Rebuild with node scripts/build-location-research.cjs. */
window.FANMAP_VERIFIED_LOCATIONS=${JSON.stringify(payload).replace(/</g,'\\u003c')};
window.applyFanMapVerifiedLocations=function(teams,today){
 today=today||new Date().toISOString().slice(0,10);
 const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 for(const record of window.FANMAP_VERIFIED_LOCATIONS.records){
  const expired=(record.eventDate&&record.eventDate<today)||(record.validThrough&&record.validThrough<today);
  const team=teams[record.teamKey];if(!team)continue;
  const existing=team.chapters.find(x=>x.id===record.id||(norm(x.venue)===norm(record.venue)&&norm(x.city)===norm(record.city)&&(!x.addr||!record.addr||norm(x.addr)===norm(record.addr))));
  const {teamKey,...venue}=record;
  if(expired)Object.assign(venue,{eventDate:null,validThrough:null,lastKnownEventDate:record.eventDate||record.validThrough,listingStatus:'needs-update',sourceVerification:null,verified:false,note:'Previously listed watch-party venue. Check the latest game-day plans. '+(record.note?'Source note from '+record.sourceCheckedAt+': '+record.note:'')});
  if(existing){const sameAddress=norm(existing.addr)===norm(venue.addr);Object.assign(existing,venue,{id:existing.id,lat:sameAddress?existing.lat:null,lng:sameAddress?existing.lng:null});}
  else team.chapters.push({...venue});
 }
};
`;
fs.writeFileSync(path.join(root,'assets/data/verified-locations.js'),runtime);
vm.runInNewContext(runtime,context);
context.window.applyFanMapVerifiedLocations(teams,checkedAt);
const counts = {};
const named=c=>c.venue&&!/^(venue announced per game|tbd|to be announced)$/i.test(c.venue.trim());
const queue = Object.values(teams).map(t=>{
  const checked=t.chapters.filter(c=>c.sourceVerification).length;
  const listed=t.chapters.filter(c=>c.namedVenue&&!c.sourceVerification).length;
  const history=entries.filter(r=>r.teamKey===t.key);
  const attempted=reviews.filter(r=>r.teamKey===t.key);
  const meta=catalog.metadata[t.key];
  const status=checked?'source-checked-venues':listed?'listed-venues':history.length?'held-evidence':attempted.length?'reviewed-needs-follow-up':'not-yet-reviewed';
  counts[status]=(counts[status]||0)+1;
  return {teamKey:t.key,team:t.display,category:meta.category,league:meta.league,status,sourceCheckedVenueCount:checked,listedVenueCount:listed,namedVenueCount:t.chapters.filter(named).length,
    existingRecordCount:t.chapters.length-checked-listed,sources:[...new Set(history.map(r=>r.src))],reviews:attempted};
});
const summary={checkedAt,totalTeams:queue.length,directoryLayerListings:publicRows.length,newSourceCheckedVenues:publicRows.filter(r=>r.sourceVerification).length,listedVenuesAwaitingConfirmation:publicRows.filter(r=>!r.sourceVerification).length,teamsWithSourceCheckedVenues:queue.filter(t=>t.sourceCheckedVenueCount).length,
  totalTeamsWithAnyRecords:Object.values(teams).filter(t=>t.chapters.length).length,totalDirectoryRecords:Object.values(teams).reduce((n,t)=>n+t.chapters.length,0),
  totalNamedVenueListings:Object.values(teams).reduce((n,t)=>n+t.chapters.filter(named).length,0),totalTeamsWithNamedVenues:Object.values(teams).filter(t=>t.chapters.some(named)).length,
  heldRecords:entries.length-publicRows.length,teamsReviewed:new Set(reviews.map(r=>r.teamKey)).size,statusCounts:counts};
fs.writeFileSync(path.join(root,'research/location-coverage.json'),JSON.stringify({summary,teams:queue},null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
