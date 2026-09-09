"""Functional browser tests. No SMS is sent and no external purchase is made."""
from pathlib import Path
import json, os, base64
from playwright.sync_api import sync_playwright
BASE=os.environ.get('FANMAP_TEST_URL','http://127.0.0.1:8765')
OUT=Path(__file__).resolve().parents[1]/'test-results'
OUT.mkdir(exist_ok=True)

def check(browser,name,width,height):
    context=browser.new_context(viewport={'width':width,'height':height})
    page=context.new_page(); errors=[]
    page.on('pageerror',lambda err: errors.append(str(err)))
    page.goto(BASE,wait_until='domcontentloaded')
    page.wait_for_selector('#teamDialog[open]')
    assert page.locator('.team-option').count()==620
    page.locator('#teamSearch').fill('Arkansas')
    page.locator('[data-team="arkansas"]').click()
    page.wait_for_selector('#homeView:not([hidden])')
    assert 'Arkansas' in page.locator('#pageTitle').inner_text()
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--team').trim()")=='#9D2235'
    assert 'Wear your colors' in page.locator('#homeEssentials').inner_text()
    assert 'Be there for the moment' in page.locator('#homeEssentials').inner_text()
    assert 'pilot' not in page.locator('body').inner_text().lower()
    page.screenshot(path=str(OUT/(name+'-home.png')),full_page=True)
    page.locator('nav [data-view="watch"]').click()
    page.locator('#venueSearch').fill('Barcadia')
    page.locator('#venueList button[data-action="venue"][data-id="dallas"]').first.click()
    page.wait_for_selector('#watchDetail.has-selection')
    assert 'Barcadia Dallas' in page.locator('#watchDetail').inner_text()
    assert '1917' in page.locator('#watchDetail iframe').get_attribute('src')
    page.locator('#venueList button[data-action="save"][data-id="dallas"]').click()
    page.reload(wait_until='domcontentloaded');page.wait_for_selector('#main:not([hidden])')
    stored=page.evaluate("JSON.parse(localStorage.getItem('fanmap.web.v1'))")
    assert {'teamKey':'arkansas','id':'dallas'} in stored['saved']
    assert stored['myTeams']['College']=='arkansas'
    page.locator('#watchDetail [data-action="share-venue"]').click()
    venue_url=page.locator('#shareURL').input_value()
    assert 'venue=dallas' in venue_url
    assert 'sms:' in page.locator('#smsLink').get_attribute('href')
    recipient=browser.new_context(viewport={'width':width,'height':height})
    other=recipient.new_page();other.goto(venue_url,wait_until='domcontentloaded')
    other.wait_for_selector('#watchDetail.has-selection')
    assert 'Barcadia Dallas' in other.locator('#watchDetail').inner_text()
    recipient.close()
    page.locator('[data-close="shareDialog"]').click()
    page.screenshot(path=str(OUT/(name+'-watch.png')),full_page=True)
    page.locator('nav [data-view="tailgate"]').click()
    page.wait_for_selector('#tailgateMap.leaflet-container')
    page.locator('#newPin').click()
    lat=float(page.locator('#pinLat').input_value());lng=float(page.locator('#pinLng').input_value())
    expected=page.evaluate('window.FANMAP_TEAM_STADIUMS.arkansas.start')
    assert abs(lat-expected[0])<0.0001 and abs(lng-expected[1])<0.0001,(lat,lng,expected)
    page.locator('#pinName').fill('Crew test 🏈')
    page.locator('#pinNote').fill('Look for the blue tent.')
    page.locator('#pinForm button[type="submit"]').click()
    page.wait_for_selector('#pinList .pin-card')
    assert 'Crew test' in page.locator('#pinList').inner_text()
    page.locator('#pinList [data-action="share-pin"]').first.click()
    pin_url=page.locator('#shareURL').input_value();assert '#pin=' in pin_url
    recipient=browser.new_context(viewport={'width':width,'height':height})
    other=recipient.new_page();other.goto(pin_url,wait_until='domcontentloaded');other.wait_for_selector('#pinList .pin-card')
    assert 'Crew test 🏈' in other.locator('#pinList').inner_text()
    assert 'not saved on this device' in other.locator('#pinList').inner_text()
    other.locator('[data-action="import-pin"]').click()
    other.reload(wait_until='domcontentloaded');other.wait_for_selector('#pinList .pin-card')
    assert 'Saved on this device' in other.locator('#pinList').inner_text()
    recipient.close();page.locator('[data-close="shareDialog"]').click()
    page.screenshot(path=str(OUT/(name+'-tailgate.png')),full_page=True)
    page.locator('#teamButton').click();page.locator('#teamSearch').fill('Dallas Cowboys')
    page.locator('[data-team="nfl-nfl-dallas-cowboys"]').click()
    assert page.locator('#stadiumName').inner_text()==page.evaluate("window.FANMAP_TEAM_STADIUMS['nfl-nfl-dallas-cowboys'].name")
    assert page.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--team').trim()") == page.evaluate("window.FANMAP_TEAM_COLORS['nfl-nfl-dallas-cowboys'].primary")
    page.locator('#newPin').click()
    lat=float(page.locator('#pinLat').input_value());lng=float(page.locator('#pinLng').input_value())
    expected=page.evaluate("window.FANMAP_TEAM_STADIUMS['nfl-nfl-dallas-cowboys'].start")
    assert abs(lat-expected[0])<0.0001 and abs(lng-expected[1])<0.0001
    page.locator('[data-close="pinDialog"]').click()
    page.locator('nav [data-view="home"]').click()
    assert page.locator('#myTeams .my-team').count()==2
    page.locator('#myTeams [data-team="arkansas"]').click()
    page.locator('nav [data-view="fan"]').click()
    assert 'HawgSports' in page.locator('#publisherList').inner_text()
    assert 'Front Office' in page.locator('#supportLinks').inner_text()
    assert 'Razorback Foundation' in page.locator('#supportLinks').inner_text()
    page.locator('nav [data-view="saved"]').click()
    assert 'Crew test' in page.locator('#savedPins').inner_text()
    assert 'Barcadia Dallas' in page.locator('#savedVenues').inner_text()
    assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2')
    page.goto(BASE+'/app.html?team=nfl-nfl-dallas-cowboys&view=tailgates',wait_until='domcontentloaded')
    page.wait_for_selector('#tailgateView:not([hidden])')
    assert '/app.html' not in page.url
    assert page.locator('#stadiumName').inner_text()==page.evaluate("window.FANMAP_TEAM_STADIUMS['nfl-nfl-dallas-cowboys'].name")
    assert errors==[],errors
    context.close()
    print(name+': PASS selection, home, exact colors, search, saves/reload, shared venue and pin links, stadium centers, fan zone, redirects, and layout')

def edge_cases(browser):
    ctx=browser.new_context();ctx.add_init_script("Object.defineProperty(window,'localStorage',{get(){throw new Error('blocked')}})")
    page=ctx.new_page();page.goto(BASE,wait_until='domcontentloaded');page.wait_for_selector('#teamDialog[open]')
    page.locator('#teamSearch').fill('Arkansas');page.locator('[data-team="arkansas"]').click()
    assert page.locator('#storageWarning').is_visible()
    page.locator('nav [data-view="watch"]').click();page.locator('#venueList button[data-action="save"]').first.click()
    assert page.locator('#toast').is_visible();ctx.close()
    ctx=browser.new_context();page=ctx.new_page();page.route('**/assets/data/team-base.js*',lambda route:route.abort())
    page.goto(BASE,wait_until='domcontentloaded');page.wait_for_selector('#reloadApp')
    assert 'could not load' in page.locator('#bootStatus').inner_text();ctx.close()
    ctx=browser.new_context();page=ctx.new_page()
    payload={'teamKey':'arkansas','name':'<img src=x onerror="window.injected=true">','note':'<script>window.injected=true</script>','lat':36,'lng':-94}
    encoded=base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip('=')
    page.goto(BASE+'/?view=tailgate#pin='+encoded,wait_until='domcontentloaded');page.wait_for_selector('#pinList .pin-card')
    assert not page.evaluate('!!window.injected')
    assert page.locator('#pinList img').count()==0
    for width in [320,375,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900})
        assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth + 2'),width
    ctx.close();print('Edge cases: PASS blocked storage, missing data, hostile shared text, responsive widths')

with sync_playwright() as p:
    engine=os.environ.get('FANMAP_BROWSER','chromium')
    launch={'headless':True}
    executable=os.environ.get('FANMAP_BROWSER_PATH')
    if executable:launch['executable_path']=executable
    browser=getattr(p,engine).launch(**launch)
    try:
        check(browser,engine+'-desktop',1440,1000)
        check(browser,engine+'-mobile',390,844)
        edge_cases(browser)
    finally:browser.close()
