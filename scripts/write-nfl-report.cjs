// Generate NFL watch-party coverage. Stadium/arena data remains a separate tailgate layer.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const coverage=read('research/location-coverage.json'),audits=read('research/directory-traversal.json');
const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/data/team-stadiums.js'),'utf8'),context);
const stadiums=context.window.FANMAP_TEAM_STADIUMS;
const teams=coverage.teams.filter(t=>t.category==='NFL').sort((a,b)=>a.team.localeCompare(b.team));
const notes={
 'Cleveland Browns':'Indexed chapter pages added. Full Browns Backers directory was unavailable; the remaining chapters still need a pass.',
 'Miami Dolphins':'Complete 305 Sports Babe out-of-town bar list reviewed. The official fan-club directory was unavailable.',
 'Pittsburgh Steelers':'Both public map layers reviewed. Named bars and chapter addresses matched to named public businesses are included; other club venues need follow-up.',
 'San Francisco 49ers':'Both overlapping chapter layers reviewed. Private/unclear venues, malformed locations and conflicting cities excluded; remaining chapter details need follow-up.',
 'Las Vegas Raiders':'Named public venues from team and venue announcements added. Booster contact addresses are not watch-party locations; individual club venues remain to resolve.',
 'Houston Texans':'Targeted club and venue pass; additional regional fan clubs remain to research.',
 'Los Angeles Rams':'Targeted club and venue pass; additional regional fan clubs remain to research. Pico Rivera club has a season-opener exception.',
 'New Orleans Saints':'Targeted venue pass; additional regional fan clubs remain to research. The older Frontier listing is labeled for an update.',
 'Detroit Lions':'2026 Canadian Bar Tour and a venue-published supporter location added; broader chapter coverage remains open.',
 'Seattle Seahawks':'Washington Bar Alliance page reviewed; broader international coverage remains open.',
 'Chicago Bears':'Both published Bears bar maps reviewed; public venues consolidated.',
 'Dallas Cowboys':'Full 130-entry Cowboys Central Texas map plus Southern California club venues reviewed.',
 'Buffalo Bills':'All 543 official chapter-map entries reviewed. Only named public bars/restaurants included.',
 'Cincinnati Bengals':'Full 82-entry team bar map reviewed; event-space and airport entries excluded.',
 'Arizona Cardinals':'Full eight-entry Birds & Brews map reviewed; standalone casino excluded.',
 'Los Angeles Chargers':'Map and page reviewed together, including bars missing from the embedded map. One entertainment-facility entry remains unresolved.',
 'Tennessee Titans':'Full 70-entry map and 50-entry detailed page reviewed together. Club-only map pins excluded from watch venues.',
 'Washington Commanders':'Full 25-entry Rally Bar Network page reviewed.',
 'Indianapolis Colts':'Full 26-entry club page reviewed; stadium, private lodge and unnamed locations excluded.',
 'Denver Broncos':'Full 45-entry team bar-network feed reviewed.',
 'Kansas City Chiefs':'Full 30-entry team fan-venue map reviewed.'
};
const report={checkedAt:coverage.summary.checkedAt,scope:{watchParties:'Publicly open bars and restaurants, including public taprooms. No private homes, members-only meeting rooms, stadiums or arenas.',tailgating:'Separate stadium and arena map centered on the selected team’s sourced home venue.'},baseline:{version:'3.11',namedNflTeamVenueListings:889},namedNflTeamVenueListings:teams.reduce((n,t)=>n+t.namedVenueCount,0),teamsWithNamedWatchVenues:teams.filter(t=>t.namedVenueCount>0).length,teamsWithSourcedTailgateCenters:teams.filter(t=>stadiums[t.teamKey]?.start).length,completeWorldwideInventory:false,teams:teams.map(t=>({teamKey:t.teamKey,team:t.team,namedWatchVenues:t.namedVenueCount,tailgateHomeVenue:stadiums[t.teamKey]?.name||null,tailgateCenterAvailable:!!stadiums[t.teamKey]?.start,coverageNote:notes[t.team]||'Retained from the prior directory pass; this release does not claim a new exhaustive review.',sources:t.sources,directories:audits.filter(a=>a.teamKey===t.teamKey).map(a=>({src:a.src,checkedAt:a.checkedAt,traversal:a.traversal,observedEntries:a.observedEntries,acceptedRecords:a.acceptedRecords,unresolvedEntries:(a.unresolved||[]).length}))}))};
fs.writeFileSync(path.join(root,'research/nfl-coverage.json'),JSON.stringify(report,null,2)+'\n');
let md=`# NFL watch-party coverage\n\nUpdated ${report.checkedAt}.\n\n**${report.namedNflTeamVenueListings.toLocaleString('en-US')} named NFL team–venue listings across all ${report.teamsWithNamedWatchVenues} teams**, up from 889 in v3.11. Counts are team affiliations, not distinct physical businesses. Listings are launch content from public sources; they are not guarantees of current opening hours or a hosted event.\n\n## Two separate plans\n\n- **Watch parties:** publicly open bars and restaurants, including public taprooms. Private homes, members-only club meeting rooms, stadiums and arenas are excluded from this research track. A named public bar inside a larger facility may qualify when its access is supported.\n- **Tailgating:** stadiums and arenas remain in the separate team home-venue map. All ${report.teamsWithSourcedTailgateCenters} NFL teams retain sourced tailgate centers. Those centers and the existing satellite map behavior are unchanged by this watch-party expansion.\n\n## Coverage by team\n\n| Team | Named watch venues | Coverage and follow-up |\n| --- | ---: | --- |\n`;
for(const t of report.teams)md+=`| ${t.team} | ${t.namedWatchVenues} | ${t.coverageNote} |\n`;
md+=`\n## What is complete\n\nThis pass provides named watch-party venues for all 32 NFL teams and reviews the full visible directories listed above. It does **not** finish every fan-club venue worldwide. Club directories often publish contact addresses or club names without a public meeting venue. Those entries remain in the [directory follow-up notes](directory-traversal.json), without importing personal contact details or private-home addresses.\n\nFull chapter follow-up is still needed for Browns, Raiders and Steelers, plus further regional discovery for Rams, Texans, Saints and other teams without a comprehensive public bar directory. Dolphins official-directory access and broader Seahawks international coverage also remain open.\n\n## Sources and use\n\nEach accepted location has a source URL in [venue-research.json](venue-research.json); the [machine-readable NFL report](nfl-coverage.json) includes source pages per team. Team bar maps sometimes name a business without a city. Those public-business pins were screened before using OpenStreetMap/Photon for city context. This lookup does not independently verify a business, and no city-center coordinates are substituted for a venue pin.\n\nFans can open driving directions and share SMS invites from venue cards. Stadium and arena coordinates remain in [team-stadiums.json](team-stadiums.json), separate from watch-party venue records.\n\nRebuild with \`node scripts/build-location-research.cjs\`, then \`node scripts/write-nfl-report.cjs\` and \`node scripts/write-location-report.cjs\`.\n`;
fs.writeFileSync(path.join(root,'research/nfl-coverage.md'),md);
console.log(`${report.namedNflTeamVenueListings} NFL listings, ${report.teamsWithNamedWatchVenues} teams, ${report.teamsWithSourcedTailgateCenters} separate tailgate centers.`);
