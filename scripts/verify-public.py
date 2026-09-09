"""Verify the actual member gate and absence of old public data downloads."""
import hashlib,json,os,time,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
BASE='https://fanmap.com'
COMMIT=os.environ.get('GITHUB_SHA','manual')
FILES=['index.html','assets/access.js','assets/access.css','assets/access-config.js','assets/web-app.js','app.html','app/index.html']
BLOCKED=['assets/data/team-base.js','assets/data/team-catalog.js','assets/data/team-colors.js','assets/data/team-stadiums.js','assets/data/verified-locations.js','research/legacy-app.source.txt','research/venue-research.json','research/team-stadiums.json','research/location-coverage.json','scripts/build-member-data.cjs','supabase/migrations/20260909030000_member_access.sql']
EXPECTED={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in FILES}
def get(path,suffix):
    url=BASE+('/' if path=='index.html' else '/'+path)+suffix
    request=urllib.request.Request(url,headers={'User-Agent':'FanMap-access-check/1.0','Cache-Control':'no-cache'})
    try:
        with urllib.request.urlopen(request,timeout=20) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,b''
for attempt in range(1,31):
    try:
        suffix='?release='+COMMIT+'&attempt='+str(attempt)
        for p in FILES:
            status,body=get(p,suffix)
            if status!=200 or hashlib.sha256(body).hexdigest()!=EXPECTED[p]:raise RuntimeError(p+': new gate not deployed yet')
        checked=[]
        for p in BLOCKED:
            for variant in ['',suffix]:
                status,_=get(p,variant)
                if status not in (401,403,404):raise RuntimeError(p+': still publicly accessible (HTTP '+str(status)+')')
            checked.append({'path':p,'status':status})
        report={'status':'guest-access-locked','commit':COMMIT,'checkedAt':datetime.now(timezone.utc).isoformat(),'blockedDataPaths':checked,'accountBackend':'not connected; registration disabled','repositoryPrivacy':'not changed; public GitHub copies are not protected by the site gate'}
        (ROOT/'test-results').mkdir(exist_ok=True)
        (ROOT/'test-results/public-release.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2));break
    except Exception as e:
        print('Attempt',attempt,str(e),flush=True)
        if attempt==30:raise
        time.sleep(10)
