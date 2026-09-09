"""Verify that the live domain actually serves the temporary open-access release."""
import hashlib,json,os,time,urllib.request,urllib.error
from pathlib import Path
from datetime import datetime,timezone
ROOT=Path(__file__).resolve().parents[1]
BASE='https://fanmap.com'
COMMIT=os.environ.get('GITHUB_SHA','manual')
FILES=['index.html','assets/open-access.js','assets/web-app.js','assets/web-app.css','assets/web-launch.css','assets/data/team-base.js','assets/data/team-catalog.js','assets/data/team-colors.js','assets/data/team-stadiums.js','assets/data/verified-locations.js','assets/vendor/leaflet.js','assets/vendor/leaflet.css','site.webmanifest','app.html','app/index.html','404.html']
EXCLUDED=['research/venue-research.json','research/legacy-app.source.txt','supabase/migrations/20260909030000_member_access.sql','assets/access-config.js','assets/access.js']
EXPECTED={p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in FILES}
def get(path,suffix):
    target=BASE+('/' if path=='index.html' else '/'+path)+suffix
    request=urllib.request.Request(target,headers={'User-Agent':'FanMap-open-access-check/1.0','Cache-Control':'no-cache'})
    try:
        with urllib.request.urlopen(request,timeout=20) as response:return response.status,response.read()
    except urllib.error.HTTPError as error:return error.code,b''
for attempt in range(1,25):
    try:
        suffix='?release='+COMMIT+'&check='+str(attempt)
        for path in FILES:
            status,body=get(path,suffix)
            if status!=200 or hashlib.sha256(body).hexdigest()!=EXPECTED[path]:raise RuntimeError(path+': public content has not reached the open-access release')
        status,body=get('index.html','')
        if status!=200 or b'content="temporary-public"' not in body or b'id="authDialog"' in body:raise RuntimeError('Unversioned homepage still serves the account gate')
        for path in EXCLUDED:
            status,_=get(path,suffix)
            if status not in (403,404):raise RuntimeError(path+': unused private/backend source should remain excluded')
        report={'status':'verified-live-open-access','domain':BASE,'commit':COMMIT,'checkedAt':datetime.now(timezone.utc).isoformat(),'signupRequired':False,'publicFilesVerified':FILES,'accountBackend':'preserved but inactive','savedData':'current browser only'}
        (ROOT/'test-results').mkdir(exist_ok=True)
        (ROOT/'test-results/public-release.json').write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report,indent=2));break
    except Exception as error:
        print('Attempt',attempt,str(error),flush=True)
        if attempt==24:raise
        time.sleep(10)
