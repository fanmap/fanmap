// Merge manually collected directory records. This command does not fetch websites.
// Usage: node scripts/merge-location-expansion.cjs /path/to/expansion-folder
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),input=path.resolve(process.argv[2]||'research/expansion');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const target=path.join(root,'research/venue-research.json');
const old=read(target),context={window:{}};
const checkedAt=process.env.FANMAP_RESEARCH_DATE||new Date().toISOString().slice(0,10);
vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data/team-catalog.js'),'utf8'),context);
const metadata=context.window.FANMAP_CATALOG.metadata;
const norm=s=>String(s||'').normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
const city=s=>String(s||'').replace(/(?:,\s*|\s+)(USA|US|United States(?: of America)?)\s*$/i,'').trim();
const street=s=>norm(String(s||'').toLowerCase().replace(/\b(street|avenue|boulevard|drive|road|parkway|highway|suite|north|south|east|west)\b/g,w=>({street:'st',avenue:'ave',boulevard:'blvd',drive:'dr',road:'rd',parkway:'pkwy',highway:'hwy',suite:'ste',north:'n',south:'s',east:'e',west:'w'}[w])));
const venue=s=>norm(String(s||'').replace(/^the\s+/i,'').replace(/&/g,'and'));
const originalId=r=>'checked-'+crypto.createHash('sha256').update([r.teamKey,norm(r.venue),norm(r.addr||r.city)].join('|')).digest('hex').slice(0,16);
const fields=['id','teamKey','team','category','league','name','venue','city','addr','src','sourceTitle','evidence','checkedAt','eventDate','publishedDate','verification','note','addressSource','disposition','discoveryStatus','validThrough','additionalSources','statusSource','statusEvidence','reviewLevel'];
function clean(r){
 const out=Object.fromEntries(Object.keys(r).filter(k=>fields.includes(k)&&r[k]!==undefined).map(k=>[k,r[k]]));
 assert(metadata[out.teamKey],'Unknown team '+out.teamKey);
 assert(out.venue&&out.city&&out.src,'Missing discovery fields '+JSON.stringify(out));
 out.city=city(out.city);out.addr=out.addr||'';
 // A street-only source address remains paired with its sourced city for navigation.
 if(out.addr&&!norm(out.addr).includes(norm(out.city.split(',')[0])))out.addr+=', '+out.city;
 out.category=metadata[out.teamKey].category;out.league=metadata[out.teamKey].league;
 out.checkedAt=out.checkedAt||checkedAt;out.verification=out.verification||'community-directory';
 out.evidence=out.evidence||'Named venue listed by the linked source; details need confirmation.';
 return out;
}
const rows=old.map(r=>clean({...r,id:r.id||originalId(r)}));
const duplicates=[],files=fs.readdirSync(input).filter(f=>f.endsWith('.json')&&!f.endsWith('-directories.json')&&!f.includes('patriots')&&!f.startsWith('audit-')).sort();
let incomingCount=0,added=0;
function samePlace(a,b){
 if(a.teamKey!==b.teamKey||norm(a.city.replace(/\barea\b/ig,''))!==norm(b.city.replace(/\barea\b/ig,'')))return false;
 const sameVenue=venue(a.venue)===venue(b.venue),aa=street(a.addr),ba=street(b.addr);
 // A directory may give the same street address with or without a neighborhood.
 // Require the same venue and numbered street; retain explicitly different units.
 const partsA=String(a.addr||'').split(','),partsB=String(b.addr||'').split(',');
 const firstA=street(partsA[0]),firstB=street(partsB[0]);
 const hasUnit=parts=>parts.slice(1).some(p=>/^\s*(?:suite\b|ste\b|unit\b|apt\b|#)/i.test(p));
 if(sameVenue&&firstA===firstB&&firstA.length>=10&&/\d/.test(firstA)&&!hasUnit(partsA)&&!hasUnit(partsB))return true;
 const loose=s=>street(String(s||'').replace(/\b(street|st|avenue|ave|drive|dr|road|rd|boulevard|blvd)\b/ig,''));
 if(aa&&ba&&(aa===ba||(Math.min(aa.length,ba.length)>10&&(aa.startsWith(ba)||ba.startsWith(aa)))))return true;
 if(sameVenue&&aa&&ba&&loose(a.addr)===loose(b.addr))return true;
 return sameVenue&&(!aa||!ba);
}
for(const file of files)for(const raw of read(path.join(input,file))){
 const r=clean({...raw,reviewLevel:raw.reviewLevel||'directory-listed'});incomingCount++;
 const match=rows.find(x=>x.id===(r.id||originalId(r))||samePlace(x,r));
 if(!match){rows.push(r);added++;continue;}
 duplicates.push({teamKey:r.teamKey,venue:r.venue,city:r.city,keptId:match.id||null,source:r.src});
 if(!match.addr&&r.addr)match.addr=r.addr;
 if(!match.addressSource&&r.addressSource)match.addressSource=r.addressSource;
 if(r.disposition==='hold')Object.assign(match,{disposition:'hold',statusSource:r.statusSource,statusEvidence:r.statusEvidence,note:r.note||match.note});
 const priorIsLead=match.disposition==='historical'||match.discoveryStatus==='needs-update'||match.verification==='community-directory';
 const incomingIsCurrent=!r.disposition&&r.discoveryStatus!=='needs-update'&&r.verification!=='community-directory'&&r.reviewLevel==='source-checked';
 const sources=[...(match.additionalSources||[]),{src:match.src,sourceTitle:match.sourceTitle,evidence:match.evidence,checkedAt:match.checkedAt},{src:r.src,sourceTitle:r.sourceTitle,evidence:r.evidence,checkedAt:r.checkedAt}];
 if(priorIsLead&&incomingIsCurrent){const id=match.id,addr=match.addr;Object.keys(match).forEach(k=>delete match[k]);Object.assign(match,r,{id,addr:r.addr||addr});}
 match.additionalSources=[...new Map(sources.filter(s=>s.src!==match.src).map(s=>[s.src,s])).values()];
}
const correctionPath=path.join(input,'audit-corrections.json');
const corrections=fs.existsSync(correctionPath)?read(correctionPath):[];
for(const correction of corrections){
 const matches=rows.filter(r=>r.teamKey===correction.teamKey&&(venue(r.venue)===venue(correction.venue)||(r.statusSource===correction.statusSource&&r.statusEvidence===correction.statusEvidence)));
 assert(matches.length,'Audit correction did not match '+correction.venue);
 for(const r of matches)Object.assign(r,{disposition:correction.disposition||'hold',statusSource:correction.statusSource,statusEvidence:correction.statusEvidence});
}
// Assign IDs before later address enrichment so links remain stable between imports.
for(const r of rows)r.id=r.id||originalId(r);
const savedCorrections=path.join(root,'research/location-corrections.json');
if(fs.existsSync(savedCorrections))for(const fix of read(savedCorrections)){
 const row=rows.find(r=>r.id===fix.id);assert(row,'Saved correction ID missing '+fix.id);
 Object.assign(row,fix.patch);if(fix.releaseHold)delete row.disposition;
}
fs.writeFileSync(target,JSON.stringify(rows,null,2)+'\n');
const audits=fs.readdirSync(input).filter(f=>f.endsWith('-directories.json')&&!f.includes('patriots')).sort().flatMap(f=>read(path.join(input,f)));
const auditPath=path.join(root,'research/directory-traversal.json');
const previousAudits=fs.existsSync(auditPath)?read(auditPath):[];
const cumulativeAudits=[...new Map([...previousAudits,...audits.map(a=>({...a,checkedAt:a.checkedAt||checkedAt}))].map(a=>[[a.teamKey,a.src,a.checkedAt||'2026-09-08'].join('|'),a])).values()];
fs.writeFileSync(auditPath,JSON.stringify(cumulativeAudits,null,2)+'\n');
const reviewsPath=path.join(root,'research/reviewed-teams.json'),reviews=read(reviewsPath);
for(const audit of audits){
 if(!audit.teamKey||!metadata[audit.teamKey])continue;
 if(reviews.some(r=>r.teamKey===audit.teamKey&&r.directoryPass&&r.sources?.includes(audit.src)))continue;
 reviews.push({teamKey:audit.teamKey,checkedAt:audit.checkedAt||checkedAt,result:audit.traversal,directoryPass:true,sources:[audit.src],note:'See directory-traversal.json for entry counts and unresolved details.'});
}
fs.writeFileSync(reviewsPath,JSON.stringify(reviews,null,2)+'\n');
const report={checkedAt,previousResearchRecords:old.length,inputFiles:files,incomingRecords:incomingCount,addedRecords:added,duplicateRecordsMerged:duplicates.length,resultRecords:rows.length,duplicates};
fs.writeFileSync(path.join(root,'research/merge-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,duplicates:undefined},null,2));
