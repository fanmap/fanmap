// Regression coverage for cumulative, repeatable directory imports.
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'fanmap-import-'));
const write=(p,data)=>fs.writeFileSync(path.join(root,p),JSON.stringify(data));
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
try {
  for(const p of ['scripts','research','assets/data','batch'])fs.mkdirSync(path.join(root,p),{recursive:true});
  fs.copyFileSync(path.join(__dirname,'../scripts/merge-location-expansion.cjs'),path.join(root,'scripts/merge-location-expansion.cjs'));
  fs.writeFileSync(path.join(root,'assets/data/team-catalog.js'),'window.FANMAP_CATALOG={metadata:{test:{category:"Soccer",league:"Test"}}};');
  const old={id:'stable-old',teamKey:'test',venue:'Old Pub',city:'Columbus',src:'https://example.org/old',checkedAt:'2026-09-08'};
  write('research/venue-research.json',[old]);
  write('research/reviewed-teams.json',[]);
  write('research/directory-traversal.json',[{teamKey:'test',src:old.src,checkedAt:old.checkedAt,traversal:'partial'}]);
  write('batch/venues.json',[{teamKey:'test',venue:'New Pub',city:'Paris',src:'https://example.org/new'}]);
  write('batch/new-directories.json',[{teamKey:'test',src:'https://example.org/new',traversal:'complete-visible-page'}]);
  const run=()=>execFileSync(process.execPath,[path.join(root,'scripts/merge-location-expansion.cjs'),path.join(root,'batch')],{env:{...process.env,FANMAP_RESEARCH_DATE:'2026-09-09'}});
  run();
  const first=read('research/venue-research.json');
  assert.equal(first.length,2);
  assert.equal(first[0].id,'stable-old');
  assert.equal(first[0].checkedAt,'2026-09-08');
  assert.equal(first[0].city,'Columbus','A city ending in US must not be trimmed as a country suffix');
  assert.equal(first[1].checkedAt,'2026-09-09');
  assert.equal(read('research/directory-traversal.json').length,2);
  run();
  assert.deepEqual(read('research/venue-research.json').map(r=>r.id),first.map(r=>r.id));
  assert.equal(read('research/directory-traversal.json').length,2);
  assert.equal(read('research/merge-report.json').addedRecords,0);
  write('batch/venues.json',[
    {teamKey:'test',venue:'Example Bar',city:'Chihuahua, Mexico',addr:'C. Morelos 111, Zona Centro, 31000 Chihuahua, Mexico',src:'https://example.org/map'},
    {teamKey:'test',venue:'Example Bar',city:'Chihuahua, Mexico',addr:'C. Morelos 111',src:'https://example.org/chapter'},
    {teamKey:'test',venue:'Example Bar',city:'Chihuahua, Mexico',addr:'C. Morelos 222',src:'https://example.org/second-branch'},
    {teamKey:'test',venue:'Example Bar',city:'Chihuahua, Mexico',addr:'C. Morelos 111, Unit 2',src:'https://example.org/unit'}
  ]);
  run();
  const branches=read('research/venue-research.json').filter(r=>r.venue==='Example Bar');
  assert.equal(branches.length,3,'Neighborhood text must not duplicate a venue; different street numbers and units remain separate');
  assert.equal(branches[0].additionalSources[0].src,'https://example.org/chapter');
  console.log('Directory imports preserve history, source dates and stable IDs on repeat runs.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
