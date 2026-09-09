"""Verify that the public domain serves the exact committed web application."""
import hashlib
import json
import os
from pathlib import Path
import time
import urllib.request
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://fanmap.com'
COMMIT = os.environ.get('GITHUB_SHA', 'manual')
FILES = ['index.html', 'assets/web-app.js', 'assets/web-app.css', 'assets/web-launch.css', 'assets/data/team-base.js', 'assets/data/team-catalog.js', 'assets/data/team-colors.js', 'assets/data/team-stadiums.js', 'assets/data/verified-locations.js', 'assets/vendor/leaflet.js', 'assets/vendor/leaflet.css', 'site.webmanifest', 'app.html', 'app/index.html']
EXPECTED = {p: hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in FILES}

def get(path, attempt):
    url = BASE + ('/' if path == 'index.html' else '/' + path) + '?release=' + COMMIT + '&check=' + str(attempt)
    request = urllib.request.Request(url, headers={'User-Agent': 'FanMap-release-check/1.0', 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=20) as response:
        if response.status != 200:
            raise RuntimeError(f'{path}: HTTP {response.status}')
        return response.read(), response.geturl()

last = ''
for attempt in range(1, 31):
    try:
        matched = []
        for path in FILES:
            body, final_url = get(path, attempt)
            if hashlib.sha256(body).hexdigest() != EXPECTED[path]:
                raise RuntimeError(f'{path}: public content has not reached commit {COMMIT[:7]}')
            matched.append({'path': path, 'url': final_url, 'sha256': EXPECTED[path]})
        report = {'status': 'verified-live', 'domain': BASE, 'commit': COMMIT, 'checkedAt': datetime.now(timezone.utc).isoformat(), 'files': matched}
        (ROOT/'test-results').mkdir(exist_ok=True)
        (ROOT/'test-results/public-release.json').write_text(json.dumps(report, indent=2)+'\n')
        print(json.dumps(report, indent=2))
        print('PASS: FanMap.com serves the exact committed homepage, app assets, catalog, maps, manifest, and legacy redirects.')
        break
    except Exception as exc:
        last = str(exc)
        print(f'Attempt {attempt}: {last}', flush=True)
        if attempt == 30:
            raise SystemExit('Public release could not be verified: ' + last)
        time.sleep(10)
