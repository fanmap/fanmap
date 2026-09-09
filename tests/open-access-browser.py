"""Verify fresh guests can use the real app; no messages, purchases or account calls."""
import json, os
from pathlib import Path
from urllib.parse import urlencode
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
BASE=os.environ.get('FANMAP_TEST_URL','http://127.0.0.1:8765').rstrip('/')
RELEASE=os.environ.get('GITHUB_SHA','local')
def url(path='/',**query):
    return BASE+path+'?'+urlencode({**query,'release':RELEASE})
def check(browser,name):
    ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();seen=[];errors=[]
    page.on('request',lambda r:seen.append(r.url));page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(url(),wait_until='domcontentloaded');page.wait_for_selector('#teamDialog[open]')
    assert page.locator('#authDialog,[data-auth-mode],[data-sign-out]').count()==0
    assert page.locator('input[type=email],input[type=password]').count()==0
    page.locator('#teamSearch').fill('Arkansas');page.locator('#teamResults [data-team="arkansas"]').click()
    page.wait_for_selector('#homeView:not([hidden])')
    assert 'Arkansas' in page.locator('#pageTitle').inner_text()
    page.locator('nav [data-view="watch"]').click();page.locator('#venueSearch').fill('Barcadia')
    page.locator('#venueList [data-action="venue"]').first.click()
    assert 'Barcadia' in page.locator('#watchDetail').inner_text()
    page.locator('nav [data-view="tailgate"]').click();page.wait_for_selector('#tailgateMap.leaflet-container')
    page.locator('#newPin').click()
    expected=page.evaluate('window.FANMAP_TEAM_STADIUMS.arkansas.start')
    assert abs(float(page.locator('#pinLat').input_value())-expected[0])<0.0001
    assert abs(float(page.locator('#pinLng').input_value())-expected[1])<0.0001
    page.locator('#pinName').fill('Open access check');page.locator('#pinForm button[type=submit]').click()
    page.wait_for_selector('#pinList .pin-card')
    page.locator('#pinList [data-action="share-pin"]').first.click();page.wait_for_selector('#shareDialog[open]')
    link=page.locator('#shareURL').input_value();assert '#pin=' in link
    recipient=browser.new_context();other=recipient.new_page();other.goto(link,wait_until='domcontentloaded')
    other.wait_for_selector('#pinList .pin-card');assert 'Open access check' in other.locator('#pinList').inner_text()
    assert other.locator('#authDialog').count()==0;recipient.close()
    page.locator('[data-close="shareDialog"]').click()
    for path in ['/app.html','/app/']:
        page.goto(url(path,team='arkansas',view='tailgates'),wait_until='domcontentloaded')
        page.wait_for_selector('#tailgateView:not([hidden])');page.wait_for_selector('#tailgateMap.leaflet-container')
        assert page.locator('#authDialog').count()==0
    page.locator('nav [data-view="home"]').click()
    page.screenshot(path=str(OUT/(name+'-open-home.png')),full_page=True)
    assert not any('.supabase.co/' in u or 'supabase-js' in u or '/assets/access.js' in u for u in seen)
    assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+2')
    assert errors==[],errors;ctx.close()
    # Backups created by the closed release must not strand pre-existing browser saves.
    ctx=browser.new_context();page=ctx.new_page()
    legacy={'teamKey':'arkansas','myTeams':{'College':'arkansas'},'saved':[{'teamKey':'arkansas','id':'dallas'}],'pins':[{'id':'legacy-pin','teamKey':'arkansas','name':'My earlier tailgate','note':'Preserved','date':'','lat':36.0678,'lng':-94.1787}]}
    page.add_init_script('localStorage.setItem("fanmap.legacy.backup.v1",'+json.dumps(json.dumps(legacy))+');')
    page.goto(url(view='saved'),wait_until='domcontentloaded');page.wait_for_selector('#savedView:not([hidden])')
    assert 'My earlier tailgate' in page.locator('#savedPins').inner_text()
    assert 'Barcadia' in page.locator('#savedVenues').inner_text()
    assert page.evaluate('localStorage.getItem("fanmap.legacy.backup.v1")')
    ctx.close()
    print(name+': PASS no signup, fresh guest discovery, stadium map, pins, cross-browser sharing, old app routes, legacy saves, and no account network calls.')
with sync_playwright() as p:
    engine=os.environ.get('FANMAP_BROWSER','chromium');browser=getattr(p,engine).launch(headless=True)
    try:check(browser,engine)
    finally:browser.close()
