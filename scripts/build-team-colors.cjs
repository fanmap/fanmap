// Build local team palettes and accessible UI tokens. No runtime color API is needed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const records=JSON.parse(fs.readFileSync(path.join(root,'research/team-color-palettes.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data/team-catalog.js'),'utf8'),context);
const expected=Object.keys(context.window.FANMAP_CATALOG.metadata).sort();
const colors={};
for(const r of records){
 assert(expected.includes(r.key),'Unknown team '+r.key);
 assert(!colors[r.key],'Duplicate palette '+r.key);
 assert(/^#[0-9a-f]{6}$/i.test(r.primary)&&/^#[0-9a-f]{6}$/i.test(r.secondary),'Invalid palette '+r.key);
 assert(r.primary.toUpperCase()!==r.secondary.toUpperCase(),'Invisible pin color '+r.key);
 assert(r.source&&r.basis,'Missing color provenance '+r.key);
 colors[r.key]={primary:r.primary.toUpperCase(),secondary:r.secondary.toUpperCase()};
}
assert.deepEqual(Object.keys(colors).sort(),expected,'Every selectable team needs a palette');
// Source-reviewed palettes are authoritative; old embedded demo themes may be stale.
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const hexColor=parts=>'#'+parts.map(n=>Math.round(n).toString(16).padStart(2,'0')).join('').toUpperCase();
const luminance=color=>rgb(color).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;}).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const p of Object.values(colors)){
 p.dark=hexColor(rgb(p.primary).map(n=>n*.7));
 p.onPrimary=contrast(p.primary,p.secondary)>=4.5?p.secondary:contrast(p.primary,'#FFFFFF')>=contrast(p.primary,'#000000')?'#FFFFFF':'#000000';
 // Keep the exact primary/secondary swatches; tint small text only when needed on the dark app surface.
 p.readable=p.primary;
 for(let i=1;contrast(p.readable,'#1C1C22')<4.5&&i<=20;i++)p.readable=hexColor(rgb(p.primary).map(n=>n+(255-n)*i/20));
 p.soft='rgba('+rgb(p.primary).join(',')+',.16)';
}
const apply=function(schools){
 for(const [key,p] of Object.entries(window.FANMAP_TEAM_COLORS))if(schools[key]){
  schools[key].theme={...schools[key].theme,team:p.primary,teamDark:p.dark,secondary:p.secondary,swatchText:p.secondary,soft:p.soft,onPrimary:p.onPrimary,readable:p.readable};
 }
};
fs.writeFileSync(path.join(root,'assets/data/team-colors.js'),'/* Team colors. Sources: research/team-color-palettes.json. */\nwindow.FANMAP_TEAM_COLORS='+JSON.stringify(colors)+';\nwindow.applyFanMapTeamColors='+apply.toString()+';\n');
console.log('Built '+records.length+' primary/secondary team palettes.');
