"""Guest access tests plus a signed-in smoke test with provider/API doubles.
Hosted signup is not tested until the owner's backend is connected.
"""
from pathlib import Path
import json,os
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('FANMAP_TEST_URL','http://127.0.0.1:8765')
OUT=ROOT/'test-results';OUT.mkdir(exist_ok=True)
BLOCKED=['assets/data/team-base.js','assets/data/team-catalog.js','assets/data/team-stadiums.js','assets/data/verified-locations.js','research/legacy-app.source.txt','research/venue-research.json','research/team-stadiums.json','supabase/migrations/20260909030000_member_access.sql']
SDK="""window.supabase={createClient(){let signed=localStorage.getItem('test.signed')==='yes';const user={id:'member-a',email:'member@example.com',email_confirmed_at:'2026-09-09',is_anonymous:false};return {auth:{async getUser(){return {data:{user:signed?user:null}}},async getSession(){return {data:{session:signed?{access_token:'verified-test-token'}:null}}},async signUp(){return {data:{session:null}}},async signInWithPassword(){signed=true;localStorage.setItem('test.signed','yes');return {}},async signOut(){signed=false;localStorage.removeItem('test.signed');return {}},onAuthStateChange(){return {}},async resetPasswordForEmail(){return {}},async updateUser(){return {}}}}}};"""
CONFIG="window.FANMAP_ACCESS_CONFIG={enabled:true,url:'https://test-project.supabase.co',publishableKey:'publishable_test_key_not_a_secret_123'};"

def guest(browser,name):
    ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();requests=[];errors=[]
    page.on('request',lambda r:requests.append(r.url));page.on('pageerror',lambda e:errors.append(str(e)))
    page.add_init_script("localStorage.setItem('fanmap.web.v1',JSON.stringify({teamKey:'arkansas',signedIn:true,pins:[{lat:36,lng:-94}]}));localStorage.setItem('fanmap.authenticated','true');")
    page.goto(BASE,wait_until='networkidle')
    assert page.locator('#publicHome').is_visible() and not page.locator('#main').is_visible()
    assert page.locator('#venueList').inner_text()=='' and page.locator('#tailgateMap').inner_text()==''
    assert page.evaluate("localStorage.getItem('fanmap.web.v1')")==None
    assert not any('/assets/data/' in u or 'arcgisonline' in u or 'maps.google' in u or '/assets/web-app.js' in u for u in requests)
    page.locator('.guest-actions [data-auth-mode="signup"]').click()
    assert page.locator('#authDialog').is_visible() and not page.locator('#authForm').is_visible()
    assert 'not available yet' in page.locator('#authUnavailable').inner_text()
    page.locator('[data-close-auth]').click();page.screenshot(path=str(OUT/(name+'-guest.png')),full_page=True)
    for path in BLOCKED:assert ctx.request.get(BASE+'/'+path).status in [401,403,404],path
    for route in ['/?view=tailgate&team=arkansas','/?view=watch&venue=dallas','/?share=055dcf51-021b-4ff8-aa55-3bd9261208be','/app.html?view=tailgates','/app/?view=watch']:
        page.goto(BASE+route,wait_until='networkidle')
        assert not page.locator('#main').is_visible() and page.locator('#authDialog').is_visible(),route
    page.goto(BASE+'/?team=arkansas#pin=eyJsYXQiOjM2LCJsbmciOi05NH0',wait_until='networkidle')
    assert '#pin=' not in page.url and page.locator('#pinList').inner_text()==''
    for width in [320,375,390,768,1024,1440]:
        page.set_viewport_size({'width':width,'height':900});assert not page.evaluate('document.documentElement.scrollWidth>window.innerWidth+2'),width
    assert errors==[],errors
    ctx.close();print(name+': PASS guests, forged old profiles, missing backend, deep links, raw data URLs, and responsive layouts')

def member(browser,name,denied=False):
    ctx=browser.new_context(viewport={'width':390,'height':844});page=ctx.new_page();errors=[];state={}
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.route('**/assets/access-config.js*',lambda r:r.fulfill(content_type='application/javascript',body=CONFIG))
    page.route('https://cdn.jsdelivr.net/**',lambda r:r.fulfill(content_type='application/javascript',body=SDK))
    payload=json.loads((ROOT/'_private/member-payload.json').read_text())
    def api(route):
        nonlocal state
        headers={'Access-Control-Allow-Origin':BASE,'Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Cache-Control':'private, no-store'}
        if route.request.method=='OPTIONS':route.fulfill(status=204,headers=headers);return
        if denied or route.request.headers.get('authorization')!='Bearer verified-test-token':route.fulfill(status=401,headers=headers,json={'error':'Session denied by server.'});return
        data=route.request.post_data_json
        if data['action']=='bootstrap':body={'payload':payload,'state':state,'sharedPin':None}
        elif data['action']=='save-state':state=data['state'];body={'saved':True}
        else:body={'id':'055dcf51-021b-4ff8-aa55-3bd9261208be'}
        route.fulfill(status=200,headers=headers,json=body)
    page.route('https://test-project.supabase.co/functions/v1/fanmap-access',api)
    page.goto(BASE,wait_until='networkidle');page.locator('.guest-actions [data-auth-mode="signin"]').click()
    page.locator('#authEmail').fill('test@example.com');page.locator('#authPassword').fill('test-account-password');page.locator('#authSubmit').click()
    if denied:
        page.wait_for_function("document.getElementById('authStatus').textContent.includes('denied')")
        assert not page.locator('#main').is_visible() and not page.evaluate('!!window.FANMAP_PRIVATE_DATA')
    else:
        page.wait_for_selector('#teamDialog[open]');page.locator('#teamSearch').fill('Arkansas');page.locator('#teamResults [data-team="arkansas"]').click()
        page.wait_for_selector('#main:not([hidden])');page.locator('nav [data-view="watch"]').click();page.locator('#venueSearch').fill('Barcadia')
        page.locator('#venueList [data-action="venue"]').first.click();assert 'Barcadia' in page.locator('#watchDetail').inner_text()
        page.locator('nav [data-view="tailgate"]').click();page.wait_for_selector('#tailgateMap.leaflet-container')
        page.locator('#newPin').click();page.locator('#pinName').fill('Test crew');page.locator('#pinNote').fill('Gate instructions');page.locator('#pinForm button[type="submit"]').click()
        page.wait_for_selector('#pinList .pin-card');page.locator('#pinList [data-action="share-pin"]').click();page.wait_for_selector('#shareDialog[open]')
        url=page.locator('#shareURL').input_value();assert '?share=' in url and '#pin=' not in url and 'Gate' not in url
        page.locator('[data-close="shareDialog"]').click();page.locator('[data-sign-out]').click();page.wait_for_selector('#publicHome:visible')
        assert not page.locator('#main').is_visible() and not page.evaluate('!!window.FANMAP_PRIVATE_DATA')
    assert errors==[],errors
    ctx.close();print(name+': PASS '+('server denial overrides client session' if denied else 'member UI, private-data adapter, opaque share, and logout (test doubles)'))

with sync_playwright() as p:
    engine=os.environ.get('FANMAP_BROWSER','chromium');args={'headless':True}
    if os.environ.get('FANMAP_BROWSER_PATH'):args['executable_path']=os.environ['FANMAP_BROWSER_PATH']
    browser=getattr(p,engine).launch(**args)
    try:guest(browser,engine);member(browser,engine);member(browser,engine,True)
    finally:browser.close()
