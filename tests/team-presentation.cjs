// NODE_PATH=/path/to/jsdom/node_modules node tests/team-presentation.cjs
// Uses the shipped app, local data assets, and real inline Leaflet. No network or account writes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, requestInterceptor, VirtualConsole} = require('jsdom');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const html = read('research/legacy-app.source.txt');
const context = {window: {}};
for (const name of ['team-catalog', 'team-colors']) {
  vm.runInNewContext(read('assets/data/' + name + '.js'), context);
}
const catalog = context.window.FANMAP_CATALOG;
const palettes = context.window.FANMAP_TEAM_COLORS;
const keys = Object.keys(catalog.metadata).sort();

// Check the visual contract, without reproducing how the build script chooses its colors.
const luminance = color => {
  assert.match(color, /^#[0-9a-f]{6}$/i);
  const linear = color.slice(1).match(/../g).map(part => {
    const value = parseInt(part, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
};
const contrast = (a, b) => {
  const levels = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (levels[1] + 0.05) / (levels[0] + 0.05);
};
assert.equal(keys.length, 620);
assert.deepEqual(Object.keys(palettes).sort(), keys, 'Every selectable team has a palette');
// Source-reviewed regression cases catch feed alternates replacing real team colors.
const expectedPairs={
 arkansas:['#9D2235','#FFFFFF'],
 asu:['#8C1D40','#FFC627'],
 'college-acc-clemson':['#F56600','#522D80'],
 'college-sec-lsu':['#461D7C','#FDD023'],
 'college-big-ten-michigan':['#00274C','#FFCB05'],
 'mlb-mlb-toronto-blue-jays':['#134A8E','#1D2D5C'],
 'cricket-ipl-rajasthan-royals':['#E50693','#1226AB'],
 'cricket-bbl-perth-scorchers':['#F55000','#000000']
};
for(const[key,pair]of Object.entries(expectedPairs))assert.deepEqual([palettes[key].primary,palettes[key].secondary],pair,key+': documented primary/secondary pair');

for (const key of keys) {
  const p = palettes[key];
  assert.notEqual(p.primary, p.secondary, key + ': pin and swatch colors are distinct');
  assert.ok(contrast(p.primary, p.onPrimary) >= 4.5, key + ': button text contrast');
  assert.ok(contrast(p.readable, '#17171C') >= 4.5, key + ': small team text on the app surface');
}
if (process.argv.includes('--palettes-only')) {
  process.stdout.write('PASS: 620 complete palettes; button and surface text contrast meet 4.5:1.\n');
  process.exit(0);
}

vm.runInNewContext(read('assets/data/team-stadiums.js'), context);
const stadiums = context.window.FANMAP_TEAM_STADIUMS;
assert.deepEqual(Object.keys(stadiums).sort(), keys, 'Every team has a sourced stadium decision');
const research = JSON.parse(read('research/team-stadiums.json'));
for (const record of research) {
  const actual = stadiums[record.key];
  assert.ok(actual, 'No research team is lost: ' + record.key);
  assert.deepEqual(copy(actual.start), record.lat === null ? null : [record.lat, record.lng],
    record.key + ': shipped map center agrees with the reviewed source');
}
const northwestern = research.find(record => /northwestern$/.test(record.key));
assert.equal(northwestern.upcoming.effectiveFrom, '2026-10-02');
for (const [date, expected] of [['2026-10-01', northwestern], ['2026-10-02', northwestern.upcoming]]) {
  const school = {[northwestern.key]: {stadiumMap: {features: []}}};
  context.window.applyFanMapTeamStadiums(school, date);
  assert.equal(school[northwestern.key].stadium, expected.name, 'Northwestern home on ' + date);
  assert.deepEqual(copy(school[northwestern.key].stadiumMap.start), [expected.lat, expected.lng],
    'Northwestern changes stadium on the announced opening date, not before');
}

const errors = [], requested = [], geoRequests = [];
const localAssets = {
  interceptors: [requestInterceptor((request, {element}) => {
    const url = new URL(request.url);
    if (url.origin === 'https://fanmap.com' && /^\/assets\/data\/(team-catalog|verified-locations|team-colors|team-stadiums)\.js$/.test(url.pathname)) {
      requested.push(url.pathname);
      return new Response(read(url.pathname.slice(1)), {headers: {'Content-Type': 'application/javascript'}});
    }
    if (element?.localName === 'script') errors.push('Unexpected remote script: ' + request.url);
    return new Response('', {headers: {'Content-Type': 'text/css'}});
  })]
};
const virtualConsole = new VirtualConsole();
virtualConsole.on('jsdomError', error => errors.push(error.message));
const dom = new JSDOM(html, {
  url: 'https://fanmap.com/app.html?view=home', runScripts: 'dangerously',
  resources: localAssets, virtualConsole,
  beforeParse(w) {
    const NativeDate = w.Date, now = Date.parse('2026-09-08T12:00:00Z');
    w.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now; }
    };
    w.structuredClone = structuredClone;
    w.scrollTo = () => {};
    w.HTMLElement.prototype.scrollIntoView = () => {};
    w.SVGSVGElement.prototype.createSVGRect = () => ({});
    w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
    w.HTMLDialogElement.prototype.close = function () { this.open = false; };
    // jsdom has no layout engine: supply the map container's measured dimensions only.
    Object.defineProperties(w.HTMLElement.prototype, {
      clientWidth: {configurable: true, get() { return this.id === 'leafletMap' ? 700 : 0; }},
      clientHeight: {configurable: true, get() { return this.id === 'leafletMap' ? 420 : 0; }}
    });
    Object.defineProperty(w.navigator, 'geolocation', {configurable: true, value: {
      getCurrentPosition(success, failure, options) { geoRequests.push({success, failure, options}); },
      clearWatch() {}
    }});
    w.fetch = () => { throw Error('Unexpected network dependency'); };
    w.addEventListener('error', event => errors.push(event.message));
    w.addEventListener('unhandledrejection', event => errors.push(String(event.reason)));
  }
});
const tick = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const w = dom.window, $ = id => w.document.getElementById(id);
  if (w.document.readyState !== 'complete') await new Promise(resolve => w.addEventListener('load', resolve, {once: true}));
  await tick();
  assert.deepEqual(requested, ['/assets/data/team-catalog.js', '/assets/data/verified-locations.js', '/assets/data/team-colors.js', '/assets/data/team-stadiums.js']);
  assert.equal(typeof w.L.Map, 'function', 'Shipped Leaflet runs; map implementation is not mocked');

  function choose(key) {
    const meta = catalog.metadata[key];
    for (const [id, value] of [['teamCategory', meta.category], ['teamLeague', meta.league], ['teamChoice', key]]) {
      $(id).value = value;
      $(id).dispatchEvent(new w.Event('change', {bubbles: true}));
    }
    assert.equal($('teamChoice').value, key);
  }
  async function signup(key) {
    const session = await w.api('session');
    if (session.profile) {
      await w.api('account', {method: 'DELETE', body: {confirm: 'DELETE'}});
      w.resetPreviewAccount();
      await w.boot();
    }
    choose(key);
    $('accountName').value = 'Team presentation tester';
    $('accountCity').value = 'Test city';
    $('teamConfirm').checked = true;
    await $('signupForm').onsubmit({preventDefault() {}});
    await tick();
    assert.equal($('signupError').textContent, '');
    assert.equal($('app').style.display, 'block');
    assert.equal((await w.api('session')).profile.team, key);
    const p = palettes[key], style = w.document.documentElement.style;
    assert.equal(style.getPropertyValue('--team'), p.primary, key + ': actual signed-in primary');
    assert.equal(style.getPropertyValue('--team-secondary'), p.secondary, key + ': actual signed-in secondary');
    assert.equal(style.getPropertyValue('--team-on-primary'), p.onPrimary, key + ': actual signed-in button text');
    // A stale change event from the now-hidden welcome picker cannot repaint a locked account.
    const other = key === 'asu' ? 'arkansas' : 'asu';
    choose(other);
    assert.equal(style.getPropertyValue('--team'), p.primary, key + ': hidden picker preserves locked primary');
    assert.equal(style.getPropertyValue('--team-secondary'), p.secondary, key + ': hidden picker preserves locked secondary');
    assert.equal((await w.api('session')).profile.team, key, key + ': hidden picker preserves account team');
    assert.equal(w.eval('S.key'), key, key + ': hidden picker preserves active school');
    w.selectSchool(other);
    assert.equal(w.eval('S.key'), key, key + ': selectSchool cannot switch a locked account');
    assert.equal(style.getPropertyValue('--team'), p.primary, key + ': rejected switch preserves appearance');
    await assert.rejects(w.api('account', {method: 'POST', body: {name: 'Second profile', team: other, confirm: true}}), /locked/);
    assert.equal((await w.api('session')).profile.team, key, key + ': duplicate signup preserves team');
  }
  function checkCenter(expected, label) {
    const map = w.eval('lmap');
    assert.ok(map instanceof w.L.Map, label + ': real Leaflet map exists');
    const center = map.getCenter();
    assert.ok(Math.abs(center.lat - expected[0]) < 0.00001, label + ': map latitude');
    assert.ok(Math.abs(center.lng - expected[1]) < 0.00001, label + ': map longitude');
    return map;
  }
  function openTailgates() {
    w.switchScreen('tailgates');
    w.ensureTailgateMap();
  }

  // Browsing at login must preview the selected team before any account exists.
  assert.equal((await w.api('session')).profile, null);
  // Traverse every selectable team, including palettes whose accessible text differs from the pin.
  const swatchRule = Array.from(w.document.styleSheets).flatMap(sheet => Array.from(sheet.cssRules))
    .find(rule => rule.selectorText === '.school-swatch');
  assert.ok(swatchRule, 'The picker swatch has a shipped style rule');
  // jsdom does not resolve inherited custom properties into computed colors. Verify their actual
  // DOM values and CSS binding. This test does not claim to verify browser pixels.
  assert.match(swatchRule.style.background, /var\(--sc\)/);
  assert.match(swatchRule.style.color, /var\(--scText/);
  for (const key of keys) {
    choose(key);
    const card = $('schoolList').querySelector('[data-team="' + key + '"]');
    const swatch = card.querySelector('.school-swatch'), pin = swatch.querySelector('svg');
    assert.equal(card.style.getPropertyValue('--sc'), palettes[key].primary);
    assert.equal(card.style.getPropertyValue('--scText'), palettes[key].secondary);
    const previewStyle=w.document.documentElement.style;
    assert.equal(previewStyle.getPropertyValue('--team'),palettes[key].primary,key+': login preview primary follows selection');
    assert.equal(previewStyle.getPropertyValue('--team-secondary'),palettes[key].secondary,key+': login preview secondary follows selection');
    assert.equal(previewStyle.getPropertyValue('--team-on-primary'),palettes[key].onPrimary,key+': login button follows selection');
    assert.equal((await w.api('session')).profile,null,'Previewing a color does not create or lock an account');
    assert.equal(pin.namespaceURI, 'http://www.w3.org/2000/svg', 'Team pin is an SVG, not a platform-colored emoji');
    assert.equal(pin.querySelector('path').getAttribute('fill'), 'currentColor');
    assert.equal(swatch.querySelector('img'), null, 'Picker colors do not depend on remote imagery');
  }

  let previousMap;
  for (const key of ['asu', 'nba-nba-los-angeles-lakers', 'soccer-la-liga-real-madrid']) {
    await signup(key);
    openTailgates();
    const start = copy(stadiums[key].start);
    assert.ok(start, key + ': test team has a known home');
    assert.deepEqual(copy(w.eval('pinPos')), start);
    const map = checkCenter(start, key);
    if (previousMap) assert.notEqual(map, previousMap, 'A new account gets a new map, not stale stadium state');
    previousMap = map;
    const moved = [start[0] + 0.001, start[1] - 0.001];
    map.fire('click', {latlng: w.L.latLng(...moved)});
    assert.deepEqual(copy(w.eval('pinPos')), moved, 'Map click moves the saveable pin');
    const marker = w.eval('lmarker').getLatLng();
    assert.deepEqual([marker.lat, marker.lng], moved, 'Leaflet marker follows the clicked coordinates');
    $('resetStadium').click();
    assert.deepEqual(copy(w.eval('pinPos')), start, 'Reset restores the sourced stadium');
    checkCenter(start, 'Reset ' + key);
  }

  const noHome = 'cricket-major-league-cricket-mi-new-york';
  assert.equal(stadiums[noHome].start, null, 'MI New York has no fabricated home venue');
  await signup(noHome);
  openTailgates();
  const world = w.eval('lmap');
  assert.ok(world instanceof w.L.Map);
  assert.ok(world.getZoom() <= 3, 'No-home team starts with a world overview');
  assert.equal(w.eval('pinPos'), null);
  assert.equal(w.eval('lmarker'), null, 'World map center is not an automatic pin');
  assert.equal($('mmCoords').textContent, 'No pin selected');
  assert.equal($('resetStadium').hidden, true, 'No reset-to-stadium claim without a home');
  $('tgName').value = 'Choose our own venue';
  await $('tgAdd').onclick();
  assert.equal(w.eval('myTailgates.length'), 0, 'Saving without coordinates is blocked');
  assert.match($('toast').textContent, /spot first/i);

  const chosen = [40.754, -73.984];
  world.fire('click', {latlng: w.L.latLng(...chosen)});
  assert.deepEqual(copy(w.eval('pinPos')), chosen, 'No-home team can choose a map pin');
  $('useTailgateLocation').click();
  assert.equal($('useTailgateLocation').disabled, true);
  const gps = [40.74844, -73.98566];
  geoRequests.pop().success({coords: {latitude: gps[0], longitude: gps[1]}});
  assert.deepEqual(copy(w.eval('pinPos')), gps, 'User-authorized GPS sets the pin');
  checkCenter(gps, 'GPS');
  assert.equal($('useTailgateLocation').disabled, false);
  await $('tgAdd').onclick();
  assert.equal(w.eval('myTailgates.length'), 1, 'A GPS pin can be saved');
  const saved = w.eval('myTailgates[0]');
  assert.deepEqual([saved.lat, saved.lng], gps);
  w.hideDialog();

  // A late permission response must not resurrect the deleted account's map or location.
  $('useTailgateLocation').click();
  const stale = geoRequests.pop();
  await w.api('account', {method: 'DELETE', body: {confirm: 'DELETE'}});
  w.resetPreviewAccount();
  await w.boot();
  assert.doesNotThrow(() => stale.success({coords: {latitude: 1, longitude: 2}}));
  assert.equal(w.eval('lmap'), null, 'Deleting the account disposes of its map');
  assert.equal(w.eval('lmarker'), null);
  assert.equal($('app').style.display, 'none');
  await new Promise(resolve => setTimeout(resolve, 80));
  // Even reusing the same team must not let an old account's GPS response set the new account's pin.
  await signup(noHome);
  openTailgates();
  $('useTailgateLocation').click();
  const previousAccountRequest = geoRequests.pop();
  await signup(noHome);
  openTailgates();
  previousAccountRequest.success({coords: {latitude: 1, longitude: 2}});
  assert.equal(w.eval('pinPos'), null, 'Late GPS from a deleted account cannot change the new same-team account');
  assert.equal(w.eval('lmarker'), null);
  await tick();
  assert.deepEqual(errors, [], 'No runtime errors');
  process.stdout.write('PASS: 620 palettes and stadium decisions; accessible text; all 620 login previews; locked signup themes; Leaflet stadium/click/reset; no-home pin guard; GPS save and account teardown.\n');
})().catch(error => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
}).finally(() => dom.window.close());
