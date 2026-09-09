// Run with jsdom available in NODE_PATH: node tests/verified-locations.cjs
// No network requests, account writes, or messages are sent by this test.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {JSDOM, requestInterceptor, VirtualConsole} = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const html = read('research/legacy-app.source.txt');
const catalogCode = read('assets/data/team-catalog.js');
const venueCode = read('assets/data/verified-locations.js');
const context = {window: {}};
vm.runInNewContext(catalogCode, context);
vm.runInNewContext(venueCode, context);
const catalog = copy(context.window.FANMAP_CATALOG);
const layer = copy(context.window.FANMAP_VERIFIED_LOCATIONS);
const apply = context.window.applyFanMapVerifiedLocations;
const original = JSON.parse(html.match(/const PREVIEW_SCHOOLS=(.*);\nconst PREVIEW_AFFILIATES=/)[1]);
const baseline = {...original, ...copy(catalog.teams)};
const research = JSON.parse(read('research/venue-research.json'));
const identity = r => JSON.stringify([r.teamKey, r.venue, r.city, r.addr || '']);
const eligible = research.filter(r => r.disposition !== 'hold');

assert.equal(Object.keys(baseline).length, 620, 'The full team catalog must survive the merge');
assert.equal(new Set(Object.values(catalog.metadata).map(r => r.category)).size, 8);
assert.equal(new Set(Object.values(catalog.metadata).map(r => r.league)).size, 39);
assert.ok(eligible.length > 0, 'The reviewed research must contain current venues');
assert.deepEqual(layer.records.map(identity).sort(), eligible.map(identity).sort(),
  'Public records include sourced venue leads while keeping unresolved conflicts on hold');
assert.equal(new Set(layer.records.map(r => r.id)).size, layer.records.length, 'Venue IDs are unique');
for (const r of layer.records) {
  const evidence = eligible.find(item => identity(item) === identity(r));
  assert.ok(baseline[r.teamKey], 'Every venue belongs to a selectable team');
  assert.equal(r.src, evidence.src);
  assert.equal(r.sourceCheckedAt, evidence.checkedAt);
  assert.equal(r.sourceBasis, evidence.verification);
  if(r.listingStatus==='needs-update'){
    assert.equal(r.eventDate,null,'Historical venues must not appear as upcoming events');
    assert.equal(r.sourceVerification,null,'A historical source must not imply current verification');
    assert.equal(r.verified,false);
  }else{
    assert.equal(r.eventDate,evidence.eventDate||null);
    assert.equal(r.validThrough,evidence.validThrough||null);
  }
  assert.equal(r.addressSource || '', evidence.addressSource || '');
  assert.match(r.src, /^https?:\/\//);
  assert.equal(r.lat, null, 'Research must not invent venue coordinates');
  assert.equal(r.lng, null);
}

const merged = copy(baseline);
apply(merged, layer.checkedAt);
const once = JSON.stringify(merged);
apply(merged, layer.checkedAt);
assert.equal(JSON.stringify(merged), once, 'Applying the layer twice must not duplicate or change records');
for (const [key, team] of Object.entries(baseline)) {
  for (const old of team.chapters) {
    const kept = merged[key].chapters.find(r => r.id === old.id);
    assert.ok(kept, 'Existing venue ID must remain usable: ' + key + '/' + old.id);
    if (kept.addr === old.addr) {
      assert.equal(kept.lat, old.lat, 'Unchanged addresses retain their existing map coordinates');
      assert.equal(kept.lng, old.lng);
    } else {
      assert.equal(kept.lat, null, 'Corrected addresses must not inherit coordinates from an old address');
      assert.equal(kept.lng, null);
    }
  }
}

const emptyTeams = () => Object.fromEntries(Object.keys(baseline).map(key => [key, {chapters: []}]));
const future = new Date(Math.max(...layer.records.flatMap(r => [r.eventDate, r.validThrough])
  .filter(Boolean).concat(layer.checkedAt).map(date => Date.parse(date + 'T12:00:00Z'))) + 86400000)
  .toISOString().slice(0, 10);
const expired = emptyTeams();
apply(expired, future);
const remaining = Object.values(expired).flatMap(t => t.chapters);
assert.equal(remaining.length, layer.records.length,
  'An expired event remains discoverable as a venue lead');
assert.ok(remaining.every(r => !r.eventDate && !r.validThrough));

// Check the inclusive boundary for both expiry types independently of the current dataset.
const boundary = {window: {}};
vm.runInNewContext(venueCode, boundary);
boundary.window.FANMAP_VERIFIED_LOCATIONS.records = [
  {teamKey: 'test', id: 'event', venue: 'Event venue', city: 'Test city', eventDate: '2026-09-09'},
  {teamKey: 'test', id: 'season', venue: 'Season venue', city: 'Test city', validThrough: '2026-09-09'},
  {teamKey: 'test', id: 'standing', venue: 'Standing venue', city: 'Test city'}
];
for (const [date, expected] of [['2026-09-08', 0], ['2026-09-09', 0], ['2026-09-10', 2]]) {
  const fresh = {test: {chapters: []}};
  boundary.window.applyFanMapVerifiedLocations(fresh, date);
  assert.equal(fresh.test.chapters.length,3,'Venue leads remain available');
  assert.equal(fresh.test.chapters.filter(r=>r.listingStatus==='needs-update').length,expected,'Expiry downgrades the event claim: '+date);
}

boundary.window.FANMAP_VERIFIED_LOCATIONS.records = [
  {teamKey: 'test', id: 'original-moved-id', venue: 'Moved Bar', city: 'Test City', addr: '2 Main St', lat: null, lng: null},
  {teamKey: 'test', id: 'same-address-id', venue: 'Stable Bar', city: 'Test City', addr: '3 Main St.', lat: null, lng: null},
  {teamKey: 'test', id: 'second-branch', venue: 'Stable Bar', city: 'Test City', addr: '8 Main St', lat: null, lng: null}
];
const corrected = {test: {chapters: [
  {id: 'original-moved-id', venue: 'Moved Bar', city: 'Test City', addr: '1 Main St', lat: 33, lng: -112},
  {id: 'original-stable-id', venue: 'Stable Bar', city: 'Test City', addr: '3 MAIN ST', lat: 34, lng: -113}
]}};
boundary.window.applyFanMapVerifiedLocations(corrected, layer.checkedAt);
assert.equal(corrected.test.chapters.length, 3, 'Distinct street addresses preserve separate branches');
assert.deepEqual(corrected.test.chapters.map(r => r.id), ['original-moved-id', 'original-stable-id','second-branch']);
assert.equal(corrected.test.chapters[0].addr, '2 Main St');
assert.equal(corrected.test.chapters[0].lat, null, 'A changed address invalidates old coordinates');
assert.equal(corrected.test.chapters[0].lng, null);
assert.equal(corrected.test.chapters[1].lat, 34, 'Formatting-only address changes retain existing coordinates');
assert.equal(corrected.test.chapters[1].lng, -113);

const errors = [];
const requested = [];
const localAssets = {
  interceptors: [requestInterceptor((request, {element}) => {
    const u = new URL(request.url);
    if (u.origin === 'https://fanmap.com' && /^\/assets\/data\/(team-catalog|verified-locations|team-colors|team-stadiums)\.js$/.test(u.pathname)) {
      requested.push(u.pathname);
      return new Response(read(u.pathname.slice(1)), {headers: {'Content-Type': 'application/javascript'}});
    }
    // Fonts, imagery, and remote stylesheet delivery are outside this runtime test.
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
    const NativeDate = w.Date;
    const now = Date.parse(layer.checkedAt + 'T12:00:00Z');
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
    w.fetch = () => { throw Error('Unexpected network dependency'); };
    w.addEventListener('error', e => errors.push(e.message));
    w.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
  }
});
const tick = () => new Promise(resolve => setImmediate(resolve));

(async () => {
  const w = dom.window;
  const $ = id => w.document.getElementById(id);
  if (w.document.readyState !== 'complete') await new Promise(resolve => w.addEventListener('load', resolve, {once: true}));
  await tick();
  assert.deepEqual(requested, ['/assets/data/team-catalog.js', '/assets/data/verified-locations.js', '/assets/data/team-colors.js', '/assets/data/team-stadiums.js']);
  assert.equal($('signupForm').style.display, 'block', 'Signup starts without a server dependency');
  assert.equal((await w.api('session')).teams.length, 620);
  assert.equal($('teamCategory').options.length, 8);
  const leagueChoices = new Set();
  for (const option of Array.from($('teamCategory').options)) {
    $('teamCategory').value = option.value;
    $('teamCategory').dispatchEvent(new w.Event('change', {bubbles: true}));
    for (const league of $('teamLeague').options) leagueChoices.add(league.value);
  }
  assert.equal(leagueChoices.size, 39, 'All leagues remain reachable through the dropdown');

  const sample = layer.records.find(r => !r.eventDate && !r.validThrough &&
    baseline[r.teamKey].chapters.length === 0 && r.addr);
  assert.ok(sample, 'Need a newly researched team for actual signup');
  const metadata = catalog.metadata[sample.teamKey];
  $('teamCategory').value = metadata.category;
  $('teamCategory').dispatchEvent(new w.Event('change', {bubbles: true}));
  $('teamLeague').value = metadata.league;
  $('teamLeague').dispatchEvent(new w.Event('change', {bubbles: true}));
  $('teamChoice').value = sample.teamKey;
  $('teamChoice').dispatchEvent(new w.Event('change', {bubbles: true}));
  assert.ok($('schoolList').textContent.includes('locations'));
  $('accountName').value = 'Venue integration tester';
  $('accountCity').value = sample.city;
  $('teamConfirm').checked = true;
  await $('signupForm').onsubmit({preventDefault() {}});
  await tick();
  assert.equal($('signupError').textContent, '');
  assert.equal($('app').style.display, 'block');
  assert.equal((await w.api('session')).profile.team, sample.teamKey);
  assert.match($('teamPillName').textContent, /LOCKED/);
  const selected=w.eval('S'),palette=w.FANMAP_TEAM_COLORS[sample.teamKey];
  assert.equal(w.document.documentElement.style.getPropertyValue('--team'),palette.primary);
  assert.equal(w.document.documentElement.style.getPropertyValue('--team-secondary'),palette.secondary);
  assert.equal(w.document.documentElement.style.getPropertyValue('--team-on-primary'),palette.onPrimary);
  assert.deepEqual(copy(w.eval('pinPos')),copy(w.FANMAP_TEAM_STADIUMS[sample.teamKey].start),'Tailgate starts at this team’s home venue');
  const otherTeam = Object.keys(baseline).find(key => key !== sample.teamKey);
  await assert.rejects(w.api('account', {method: 'POST', body: {name: 'Switch attempt', team: otherTeam, confirm: true}}), /locked/i);
  w.selectSchool(otherTeam);
  assert.equal(w.eval('S.key'), sample.teamKey, 'UI cannot switch a locked team');

  // One older research record makes the filter test prove exclusion as well as inclusion.
  const legacy = {id: 'filter-old-research', name: 'Older research', venue: 'Venue announced per game', city: 'Test city', verified: false, lat: null, lng: null};
  w.eval('S').chapters.push(legacy);
  w.switchScreen('parties');
  const checkedChip = w.document.querySelector('#partyChips [data-f="checked"]');
  assert.ok(checkedChip, 'Source checked filter is visible');
  checkedChip.click();
  const checkedRows = w.eval('S').chapters.filter(r => r.sourceVerification);
  assert.equal($('partyList').querySelectorAll('.pcard').length, checkedRows.length);
  assert.equal($('pcard-' + legacy.id), null, 'Source checked filter excludes older research');
  for (const row of checkedRows) {
    const card = $('pcard-' + row.id);
    assert.ok(card, 'Checked venue renders: ' + row.venue);
    assert.equal(card.querySelector('.badge').textContent, 'Source checked');
    assert.equal(card.querySelector('.source-link').href, row.src);
    assert.ok(card.textContent.includes('Checked: ' + row.sourceCheckedAt));
  }
  w.document.querySelector('#partyChips [data-f="all"]').click();
  assert.ok($('pcard-' + legacy.id), 'All restores the older research record');
  checkedChip.click();

  const c = w.eval('S').chapters.find(r => r.id === sample.id);
  assert.equal(c.lat, null);
  assert.equal(c.lng, null);
  const card = $('pcard-' + c.id);
  card.querySelector('[data-party-directions]').click();
  assert.equal($('actionDialog').open, true);
  assert.equal($('directionsStreetMap').hidden, true, 'Missing coordinates must not create a false map pin');
  assert.match($('streetMapStatus').textContent, /venue address/i);
  const directions = $('dialogBody').querySelector('a[href*="travelmode=driving"]');
  const route = new URL(directions.href);
  assert.equal(route.searchParams.get('travelmode'), 'driving');
  assert.ok(route.searchParams.get('destination').includes(c.venue));
  assert.ok(route.searchParams.get('destination').includes(c.addr));
  const textLinks = [card.querySelector('[data-party-text]'), $('dialogBody').querySelector('a[href^="sms:"]')];
  for (const link of textLinks) {
    assert.ok(link, 'SMS invite link exists');
    const body = decodeURIComponent(link.href.split('body=')[1]);
    assert.ok(body.includes(c.venue), 'SMS includes venue');
    assert.ok(body.includes(c.addr), 'SMS includes address');
    assert.ok(body.includes('travelmode=driving'), 'SMS includes destination route');
    assert.ok(body.includes('https://fanmap.com/'), 'SMS includes Fan Map discovery link');
  }
  w.hideDialog();
  // A venue can support launch discovery and invites before its details are verified.
  const listed={id:'listed-test',name:'Fan club',venue:'Neighborhood Sports Pub',city:'Phoenix, AZ',addr:'',verified:false,namedVenue:true,sourceVerification:null,listingStatus:'listed',src:'https://example.com/club',lat:null,lng:null};
  w.eval('S').chapters.push(listed);
  w.document.querySelector('#partyChips [data-f="verified"]').click();
  const listedCard=$('pcard-'+listed.id);
  assert.ok(listedCard,'Listed venues are discoverable without verification');
  assert.equal(listedCard.querySelector('.badge').textContent,'Listed venue');
  listedCard.querySelector('[data-party-directions]').click();
  const listedRoute=new URL($('dialogBody').querySelector('a[href*="travelmode=driving"]').href);
  assert.equal(listedRoute.searchParams.get('destination'),listed.venue+' '+listed.city);
  assert.ok(decodeURIComponent(listedCard.querySelector('[data-party-text]').href).includes(listed.venue));
  w.hideDialog();
  checkedChip.click();
  assert.equal($('pcard-'+listed.id),null,'Source-checked filter does not overstate an unconfirmed listing');
  await tick();
  assert.deepEqual(errors, [], 'No runtime errors');
  process.stdout.write('PASS: 620 teams, 8 categories, 39 leagues; ' + layer.records.length + ' directory listings; held conflicts excluded, past events become leads, branch-safe merge, preserved IDs, locked signup, confidence filters, unverified venue driving and SMS, zero runtime errors.\n');
})().catch(error => {
  process.stderr.write(error.stack + '\n');
  process.exitCode = 1;
}).finally(() => dom.window.close());
