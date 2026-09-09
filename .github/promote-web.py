# One-time, test-gated release migration. Removed after the release checks pass.
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'index.html';s=p.read_text()
assert 'id="homeView"' not in s and '/assets/web-app.js?v=1' in s
s=s.replace('<link rel="stylesheet" href="/assets/web-app.css?v=1">','<link rel="stylesheet" href="/assets/vendor/leaflet.css?v=web1">\n<link rel="stylesheet" href="/assets/web-app.css?v=web2">\n<link rel="stylesheet" href="/assets/web-launch.css?v=web2">\n<script defer src="/assets/vendor/leaflet.js?v=web1"></script>\n<script defer src="/assets/data/team-base.js?v=web2"></script>')
s=s.replace('/assets/web-app.js?v=1','/assets/web-app.js?v=web2')
s=s.replace('<button data-view="watch" class="active" aria-current="page">Watch parties</button>','<button data-view="home" class="active" aria-current="page">Home</button>\n    <button data-view="watch">Watch parties</button>')
s=s.replace('<button data-view="saved">Saved</button>','<button data-view="fan">Fan zone</button>\n    <button data-view="saved">Saved</button>',1)
s=s.replace('  <section id="watchView" aria-label="Watch-party discovery">','''  <section id="homeView" aria-label="Your game-day home">
    <div id="myTeams" class="my-teams" aria-label="Your saved teams"></div>
    <div class="home-actions">
      <button class="home-action" data-view="watch"><span class="action-symbol" aria-hidden="true">⌖</span><span class="eyebrow">WATCH PARTIES</span><h2>Find your people.</h2><p>Explore your team’s bars, watch-party venues, and fan clubs.</p><span class="action-link">Find a place to watch →</span></button>
      <button class="home-action" data-view="tailgate"><span class="action-symbol" aria-hidden="true">◎</span><span class="eyebrow">TAILGATES</span><h2>Make your meeting point.</h2><p>Start at your stadium, drop a pin, and text your crew the exact spot.</p><span class="action-link">Open your stadium map →</span></button>
    </div>
    <div id="homeStats" class="home-stats" aria-label="Team directory coverage"></div>
    <div class="section-heading"><h2>Everything for game day.</h2><button class="text-button" data-view="fan">Open fan zone →</button></div>
    <div id="homeEssentials" class="essentials-grid"></div>
    <div class="section-heading"><h2>Your team’s places</h2><button class="text-button" data-view="watch">See all places →</button></div>
    <div id="homePlaces" class="saved-grid"></div>
    <p class="quiet">Directory listings are starting points. Confirm current game-day plans with the venue or club before heading out.</p>
  </section>
  <section id="watchView" aria-label="Watch-party discovery" hidden>''')
s=s.replace('  <footer>','''  <section id="fanView" aria-label="Fan zone" hidden>
    <div id="fanEssentials" class="essentials-grid"></div>
    <div class="section-heading fan-section"><h2>Sports desk</h2><span class="quiet">Read current coverage at the publisher</span></div><div id="publisherList" class="essentials-grid"></div>
    <div class="section-heading fan-section"><h2>Back your team. Find your community.</h2></div><div id="supportLinks" class="essentials-grid"></div>
    <p class="quiet" style="margin-top:20px">Purchases, donations, and subscriptions take place with the linked provider—not with Fan Map. Fan Map may earn a commission from qualifying merchandise purchases through affiliate links.</p>
  </section>
  <footer>''')
s=s.replace('Choose a team to find your people. No sign-up required to explore.','Choose a team and get your whole game-day experience. No sign-up required to explore.')
s=s.replace('<title>Fan Map — Find Your Fanhood</title>','<title>Fan Map — Find Your Fanhood</title>\n<link rel="canonical" href="https://fanmap.com/">');p.write_text(s)
p=root/'assets/web-app.js';s=p.read_text()
assert 'sourceHTML' in s and 'function renderHome()' not in s
s=s.replace('/* Fan Map web app. The existing app is read as a data/dependency source only;\n   its preview UI, sample profiles, and simulated APIs are never executed. */','/* Fan Map public web app. Uses generated public data and self-hosted maps. */')
s=s.replace('const teams = {...parseBaseTeams(html), ...env.FANMAP_CATALOG.teams};','const base = env.FANMAP_BASE_TEAMS || parseBaseTeams(html || "");\n    const teams = JSON.parse(JSON.stringify({...base, ...env.FANMAP_CATALOG.teams}));')
s=s.replace("view='watch', selectedVenue", "view='home', selectedVenue").replace("sourceHTML='', sharedPin", "sharedPin")
s=s.replace("let state={teamKey:'',saved:[],pins:[]};","let state={teamKey:'',myTeams:{},saved:[],pins:[]};")
s=s.replace("state.teamKey=own(teams,raw.teamKey)?raw.teamKey:'';", "state.teamKey=own(teams,raw.teamKey)?raw.teamKey:'';\n        if(raw.myTeams && typeof raw.myTeams==='object')for(const [category,key] of Object.entries(raw.myTeams)){if(own(teams,key)&&teams[key].category===category)state.myTeams[category]=key;}\n        if(state.teamKey)state.myTeams[teams[state.teamKey].category]=state.teamKey;")
s=s.replace("view=sharedPin?'tailgate':['watch','tailgate','saved'].includes(requestedView)?requestedView:'watch';", "const aliases={map:'watch',parties:'watch',tailgates:'tailgate',more:'fan',shop:'fan'};\n    view=sharedPin?'tailgate':['home','watch','tailgate','fan','saved'].includes(requestedView)?requestedView:(own(aliases,requestedView)?aliases[requestedView]:'home');")
s=s.replace("teamKey=key; state.teamKey=key; selectedVenue", "teamKey=key; state.teamKey=key; state.myTeams[teams[key].category]=key; selectedVenue")
s=s.replace("$('teamDialog').close(); setTheme();", "if($('teamDialog').open)$('teamDialog').close(); setTheme();")
s=s.replace("if(selectedVenue)showVenue(selectedVenue,false);\n    toast(had?", "if(view==='watch'&&selectedVenue)showVenue(selectedVenue,false);\n    if(view==='home')renderHome();\n    toast(had?")
start=s.index('  function library() {');end=s.index('  function pinIcon(', start)
s=s[:start]+'''  function library() {
    if(root.L||root.leaflet)return root.L||root.leaflet;
    throw new Error('The map library is unavailable.');
  }
'''+s[end:]
s=s.replace("$('watchView').hidden=view!=='watch';$('tailgateView').hidden=view!=='tailgate';$('savedView').hidden=view!=='saved';", "$('homeView').hidden=view!=='home';$('watchView').hidden=view!=='watch';$('tailgateView').hidden=view!=='tailgate';$('savedView').hidden=view!=='saved';$('fanView').hidden=view!=='fan';")
s=s.replace("view==='tailgate'?'Make game day a meet-up.':view==='saved'?", "view==='home'?(t?t.display+'. Your game day.':'Find your fanhood.'):view==='fan'?'All in for your team.':view==='tailgate'?'Make game day a meet-up.':view==='saved'?")
s=s.replace("view==='tailgate'?'Your stadium. Your meeting point. One text to your crew.':", "view==='home'?'Watch parties. Tailgates. Tickets. Team gear. Your people.':view==='fan'?'Wear your colors, find tickets, follow the news, and support your team.':view==='tailgate'?'Your stadium. Your meeting point. One text to your crew.':")
s=s.replace("if(view==='watch'){renderVenues();", "if(view==='home')renderHome();if(view==='fan')renderFanZone();\n    if(view==='watch'){renderVenues();")
s=s.replace("const response=await fetch('/app.html',{cache:'no-cache'});if(!response.ok)throw new Error('Shared directory request failed: '+response.status);\n      sourceHTML=await response.text();teams=buildTeams(root,sourceHTML);restore();readRoute();", "teams=buildTeams(root);restore();readRoute();")
s=s.replace("Your last selected team, starred locations, and meeting points", "Your team choices (one per sport category), starred locations, and meeting points")
s=s.replace("<h3>Watch parties</h3><p>Choose", "<h3>One team. Your whole game day.</h3><p>Home brings together watch-party discovery, stadium tailgates, merchandise, tickets, sports coverage, and available team-support links.</p><h3>Watch parties</h3><p>Choose")
s=s.replace("<h3>Saved, not simulated</h3>","<h3>Your saved places</h3>")
insert=s.index('  function render() {')
extra='''  function externalCard(label,title,description,url,action,sponsored=false) {
    const safe=safeURL(url);if(!safe)return '';
    return '<article class="essential-card"><p class="eyebrow">'+esc(label)+'</p><h3>'+esc(title)+'</h3><p class="muted">'+esc(description)+'</p><a class="button secondary wide" href="'+esc(safe)+'" target="_blank" rel="noopener noreferrer'+(sponsored?' sponsored':'')+'">'+esc(action)+' ↗</a></article>';
  }
  function merchandiseURL() {
    const affiliates=root.FANMAP_AFFILIATES||{}, aliases={arkansas:'uark'};
    const known=safeURL(affiliates[teamKey]||affiliates[aliases[teamKey]]);
    if(known)return known;
    const base=safeURL(affiliates.global);if(!base)return 'https://www.fanatics.com/';
    if(!teamKey)return base;
    const url=new URL(base);url.searchParams.set('u','https://www.fanatics.com/?query='+encodeURIComponent(teams[teamKey].display));url.searchParams.set('subId1',teamKey);return url.href;
  }
  function essentials() {
    const t=teams[teamKey],name=t?t.display:'your team';
    return externalCard('TEAM GEAR','Wear your colors.',name+' gear for wherever game day finds you.',merchandiseURL(),'Shop team gear',!!(root.FANMAP_AFFILIATES&&root.FANMAP_AFFILIATES.global))+
      externalCard('TICKETS','Be there for the moment.','Find tickets and choose your seat with StubHub.','https://www.stubhub.com/secure/search?q='+encodeURIComponent(t?t.display:''),'Find tickets');
  }
  function renderHome() {
    const t=teams[teamKey],keys=Object.values(state.myTeams).filter(k=>own(teams,k));
    $('myTeams').innerHTML=keys.length?'<span class="quiet">My teams</span>'+keys.map(k=>'<button class="my-team'+(k===teamKey?' selected':'')+'" data-team="'+esc(k)+'">'+badge(k)+'<span>'+esc(teams[k].display)+'</span></button>').join('')+'<button class="text-button" data-action="choose-team">Choose a team +</button>':'';
    const locations=t?t.chapters:[];
    const cities=new Set(locations.map(v=>normal(v.city)).filter(Boolean));
    $('homeStats').innerHTML=t?'<div><strong>'+locations.length.toLocaleString()+'</strong><span>Directory locations</span></div><div><strong>'+cities.size.toLocaleString()+'</strong><span>Cities / areas</span></div><div><strong>'+state.saved.filter(v=>v.teamKey===teamKey).length+'</strong><span>Saved places</span></div>':'<p class="muted">Choose from '+Object.keys(teams).length+' teams across college and professional sports.</p>';
    $('homeEssentials').innerHTML=essentials();
    $('homePlaces').innerHTML=locations.length?locations.filter(namedVenue).slice(0,3).map(v=>card(v)).join(''):'<div class="empty"><h3>'+(t?'Explore your fan community.':'Start with your team.')+'</h3><p>'+(t?'Visit the team directory while we expand local venue coverage.':'Choose your team to find watch-party venues and make your game-day plan.')+'</p>'+(t?officialLink():'<button class="button" data-action="choose-team">Choose your team</button>')+'</div>';
  }
  function renderFanZone() {
    const t=teams[teamKey];$('fanEssentials').innerHTML=essentials();
    const sports={College:'college-football',NFL:'nfl',NBA:'nba',MLB:'mlb',NHL:'nhl',Soccer:'soccer',Rugby:'rugby',Cricket:'cricket'};
    const sport=t?sports[t.category]||'':'';
    let publishers=externalCard('SPORTS DESK','ESPN','Open the publisher for current sports coverage.','https://www.espn.com/'+(sport?sport+'/':''),'Read ESPN')+externalCard('SPORTS DESK','Yahoo Sports','Headlines, scores, and stories from the sports desk.','https://sports.yahoo.com/','Read Yahoo Sports');
    if(teamKey==='arkansas')publishers=externalCard('ARKANSAS','HawgSports','Follow Arkansas coverage at the publisher.','https://247sports.com/college/arkansas/','Read HawgSports')+publishers;
    $('publisherList').innerHTML=publishers;
    let links='';
    if(t){
      if(t.nil)links+=externalCard('ATHLETE SUPPORT',t.nil.label||'Support your athletes','Review the program and contribute directly with the provider.',t.nil.url,'Visit support program');
      if(t.foundation)links+=externalCard('TEAM SUPPORT',t.foundation.label||'Back your program','Review giving opportunities with the linked organization.',t.foundation.url,'Explore giving');
      links+=externalCard('FAN COMMUNITY',t.display+' fans','Find team, alumni, or supporter information from the directory linked for your team.',t.alumni_url,'Visit fan directory');
    }
    $('supportLinks').innerHTML=links||'<div class="empty"><p>Choose a team to see its available community and support links.</p><button class="button" data-action="choose-team">Choose your team</button></div>';
  }
'''
s=s[:insert]+extra+s[insert:]
assert 'sourceHTML' not in s
p.write_text(s)
for f in ['scripts/build-location-research.cjs','tests/nfl-watch-scope.cjs','tests/team-presentation.cjs','tests/verified-locations.cjs']:
 p=root/f;s=p.read_text().replace("read('app.html')","read('research/legacy-app.source.txt')").replace("path.join(root,'app.html')","path.join(root,'research/legacy-app.source.txt')");p.write_text(s)
redirect='''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Open Fan Map</title><link rel="canonical" href="https://fanmap.com/"><meta name="robots" content="noindex"><script>location.replace('/'+location.search+location.hash);</script><meta http-equiv="refresh" content="0;url=/"></head><body><p><a href="/">Open Fan Map</a></p></body></html>
'''
(root/'app.html').write_text(redirect)
if (root/'app').is_file():(root/'app').unlink()
(root/'app').mkdir(exist_ok=True);(root/'app/index.html').write_text(redirect)
print('Promoted the full game-day home and redirected legacy app entry points.')
