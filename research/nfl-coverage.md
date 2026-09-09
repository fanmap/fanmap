# NFL watch-party coverage

Updated 2026-09-09.

**2,532 named NFL team–venue listings across all 32 teams**, up from 889 in v3.11. Counts are team affiliations, not distinct physical businesses. Listings are launch content from public sources; they are not guarantees of current opening hours or a hosted event.

## Two separate plans

- **Watch parties:** publicly open bars and restaurants, including public taprooms. Private homes, members-only club meeting rooms, stadiums and arenas are excluded from this research track. A named public bar inside a larger facility may qualify when its access is supported.
- **Tailgating:** stadiums and arenas remain in the separate team home-venue map. All 32 NFL teams retain sourced tailgate centers. Those centers and the existing satellite map behavior are unchanged by this watch-party expansion.

## Coverage by team

| Team | Named watch venues | Coverage and follow-up |
| --- | ---: | --- |
| Arizona Cardinals | 7 | Full eight-entry Birds & Brews map reviewed; standalone casino excluded. |
| Atlanta Falcons | 20 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Baltimore Ravens | 78 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Buffalo Bills | 526 | All 543 official chapter-map entries reviewed. Only named public bars/restaurants included. |
| Carolina Panthers | 41 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Chicago Bears | 172 | Both published Bears bar maps reviewed; public venues consolidated. |
| Cincinnati Bengals | 79 | Full 82-entry team bar map reviewed; event-space and airport entries excluded. |
| Cleveland Browns | 18 | Indexed chapter pages added. Full Browns Backers directory was unavailable; the remaining chapters still need a pass. |
| Dallas Cowboys | 132 | Full 130-entry Cowboys Central Texas map plus Southern California club venues reviewed. |
| Denver Broncos | 45 | Full 45-entry team bar-network feed reviewed. |
| Detroit Lions | 4 | 2026 Canadian Bar Tour and a venue-published supporter location added; broader chapter coverage remains open. |
| Green Bay Packers | 53 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Houston Texans | 3 | Targeted club and venue pass; additional regional fan clubs remain to research. |
| Indianapolis Colts | 20 | Full 26-entry club page reviewed; stadium, private lodge and unnamed locations excluded. |
| Jacksonville Jaguars | 13 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Kansas City Chiefs | 31 | Full 30-entry team fan-venue map reviewed. |
| Las Vegas Raiders | 5 | Named public venues from team and venue announcements added. Booster contact addresses are not watch-party locations; individual club venues remain to resolve. |
| Los Angeles Chargers | 19 | Map and page reviewed together, including bars missing from the embedded map. One entertainment-facility entry remains unresolved. |
| Los Angeles Rams | 2 | Targeted club and venue pass; additional regional fan clubs remain to research. Pico Rivera club has a season-opener exception. |
| Miami Dolphins | 17 | Complete 305 Sports Babe out-of-town bar list reviewed. The official fan-club directory was unavailable. |
| Minnesota Vikings | 49 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| New England Patriots | 256 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| New Orleans Saints | 3 | Targeted venue pass; additional regional fan clubs remain to research. The older Frontier listing is labeled for an update. |
| New York Giants | 84 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| New York Jets | 83 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Philadelphia Eagles | 148 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Pittsburgh Steelers | 69 | Both public map layers reviewed. Named bars and chapter addresses matched to named public businesses are included; other club venues need follow-up. |
| San Francisco 49ers | 308 | Both overlapping chapter layers reviewed. Private/unclear venues, malformed locations and conflicting cities excluded; remaining chapter details need follow-up. |
| Seattle Seahawks | 101 | Washington Bar Alliance page reviewed; broader international coverage remains open. |
| Tampa Bay Buccaneers | 54 | Retained from the prior directory pass; this release does not claim a new exhaustive review. |
| Tennessee Titans | 67 | Full 70-entry map and 50-entry detailed page reviewed together. Club-only map pins excluded from watch venues. |
| Washington Commanders | 25 | Full 25-entry Rally Bar Network page reviewed. |

## What is complete

This pass provides named watch-party venues for all 32 NFL teams and reviews the full visible directories listed above. It does **not** finish every fan-club venue worldwide. Club directories often publish contact addresses or club names without a public meeting venue. Those entries remain in the [directory follow-up notes](directory-traversal.json), without importing personal contact details or private-home addresses.

Full chapter follow-up is still needed for Browns, Raiders and Steelers, plus further regional discovery for Rams, Texans, Saints and other teams without a comprehensive public bar directory. Dolphins official-directory access and broader Seahawks international coverage also remain open.

## Sources and use

Each accepted location has a source URL in [venue-research.json](venue-research.json); the [machine-readable NFL report](nfl-coverage.json) includes source pages per team. Team bar maps sometimes name a business without a city. Those public-business pins were screened before using OpenStreetMap/Photon for city context. This lookup does not independently verify a business, and no city-center coordinates are substituted for a venue pin.

Fans can open driving directions and share SMS invites from venue cards. Stadium and arena coordinates remain in [team-stadiums.json](team-stadiums.json), separate from watch-party venue records.

Rebuild with `node scripts/build-location-research.cjs`, then `node scripts/write-nfl-report.cjs` and `node scripts/write-location-report.cjs`.
