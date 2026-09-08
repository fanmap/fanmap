// Build stadium map defaults from sourced home-venue records.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const records=JSON.parse(fs.readFileSync(path.join(root,'research/team-stadiums.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data/team-catalog.js'),'utf8'),context);
const expected=Object.keys(context.window.FANMAP_CATALOG.metadata).sort(),stadiums={};
for(const r of records){
 assert(expected.includes(r.key),'Unknown stadium team '+r.key);
 assert(!stadiums[r.key],'Duplicate stadium team '+r.key);
 assert(r.source&&r.basis,'Missing stadium provenance '+r.key);
 const located=Number.isFinite(r.lat)&&Number.isFinite(r.lng);
 assert(located||r.lat===null&&r.lng===null,'Incomplete stadium coordinates '+r.key);
 if(located){assert(r.name&&Math.abs(r.lat)<=90&&Math.abs(r.lng)<=180,'Invalid stadium '+r.key);assert(!(r.lat===39&&r.lng===-98),'Placeholder stadium '+r.key);}
 stadiums[r.key]={name:r.name||null,start:located?[r.lat,r.lng]:null,note:r.note||(!located?'Choose the venue for this game, or use your location to place your tailgate pin.':'')};
 if(r.upcoming){
  const u=r.upcoming;
  assert(/^\d{4}-\d{2}-\d{2}$/.test(u.effectiveFrom)&&u.name&&u.source&&u.basis&&Number.isFinite(u.lat)&&Math.abs(u.lat)<=90&&Number.isFinite(u.lng)&&Math.abs(u.lng)<=180,'Invalid planned stadium '+r.key);
  stadiums[r.key].upcoming={effectiveFrom:u.effectiveFrom,name:u.name,start:[u.lat,u.lng],note:u.note||''};
 }
}
assert.deepEqual(Object.keys(stadiums).sort(),expected,'Every selectable team needs a stadium decision');
const apply=function(schools,date=new Date().toISOString().slice(0,10)){
 for(const [key,record] of Object.entries(window.FANMAP_TEAM_STADIUMS))if(schools[key]){
  const venue=record.upcoming&&date>=record.upcoming.effectiveFrom?record.upcoming:record;
  const s=schools[key],old=s.stadiumMap,b=old?.bbox,p=venue.start;
  const preserve=p&&b&&p[0]<=b.lat0&&p[0]>=b.lat1&&p[1]>=b.lng0&&p[1]<=b.lng1;
  s.stadium=venue.name||'Your game-day venue';
  s.stadiumMap={start:p?[...p]:null,bbox:preserve?b:p?{lat0:p[0]+.0032,lat1:p[0]-.0032,lng0:p[1]-.0042,lng1:p[1]+.0042}:null,features:preserve?old.features:[],note:venue.note};
 }
};
fs.writeFileSync(path.join(root,'assets/data/team-stadiums.js'),'/* Home venues. Sources and exceptions: research/team-stadiums.json. */\nwindow.FANMAP_TEAM_STADIUMS='+JSON.stringify(stadiums)+';\nwindow.applyFanMapTeamStadiums='+apply.toString()+';\n');
console.log('Built '+records.filter(r=>Number.isFinite(r.lat)).length+' stadium map defaults; '+records.filter(r=>r.lat===null).length+' require a game-day location.');
