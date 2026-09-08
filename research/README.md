# Fan Map location research — maintainer notes

Research date: September 8, 2026. This is a first batch of US watch-party location research against the existing team catalog. It is not complete coverage of all remaining teams or all locations for the teams researched.

## Batch coverage

The catalog has **620 teams**. This pass reviewed **77 teams** and added **100 source-checked team–venue listings across 40 teams**. These are affiliations, not 100 distinct physical businesses: some venues host multiple teams. **22 historical or held records** remain outside the active list.

There are now **700 total directory records across 61 teams**, including the previous research records. The older records have not all been rechecked. **543 teams were not reviewed in this pass**, and **37 reviewed teams still lack an accepted current venue from this pass**. These figures do not mean that those teams have no fan gathering places.

| Category | Source-checked listings | Teams with accepted listings |
| --- | ---: | ---: |
| College | 20 | 9 |
| NFL | 20 | 6 |
| MLB | 5 | 2 |
| NHL | 14 | 7 |
| NBA | 5 | 3 |
| Soccer | 20 | 10 |
| Rugby | 16 | 3 |
| Cricket | 0 | 0 |

### Teams with accepted listings

| Team | Category | Listings | Evidence |
| --- | --- | ---: | --- |
| Arizona | College | 1 | [Source](https://alumni.arizona.edu/events/seattle-wa-seattle-alumni-chapter-football-watch-parties) |
| Florida | College | 4 | [Source](https://connect.ufalumni.ufl.edu/gatorclubofmiami/events/watchparties) |
| LSU | College | 2 | [Source](https://www.lsusocal.org/watch-parties) |
| Michigan | College | 4 | [Source](https://alumni.umich.edu/athletics/game-watch-parties/) |
| Oklahoma | College | 2 | [Source](https://www.ouclubofhouston.org/Watch-Parties) |
| Oregon | College | 2 | [Source](https://www.uoalumni.com/event/athletic/2026/desert-ducks-watch-party-scottsdale) |
| Tennessee | College | 2 | [Source](https://alumni.utk.edu/vol-watch-parties/) |
| Washington | College | 2 | [Source](https://www.washington.edu/alumni/event/2026-football-watch-parties/) |
| Wisconsin | College | 1 | [Source](https://www.uwalumni.com/events/stl-gw-notre-dame/) |
| Houston Astros | MLB | 3 | [Source](https://www.mlb.com/astros/fans/stros-social-club) |
| Seattle Mariners | MLB | 2 | [Source](https://www.hatback.com/seattle-mariners/) |
| Atlanta Hawks | NBA | 2 | [Source](https://www.nba.com/hawks/barnetwork) |
| Dallas Mavericks | NBA | 1 | [Source](https://www.happiesthourdallas.com/news-item/mavericks/) |
| Memphis Grizzlies | NBA | 2 | [Source](https://www.nba.com/grizzlies/barnetwork) |
| Baltimore Ravens | NFL | 5 | [Source](https://www.baltimoreravens.com/fans/find-a-flock/domestic-flock-groups) |
| Buffalo Bills | NFL | 3 | [Source](https://dfwbillsbackers.org/about/) |
| Cleveland Browns | NFL | 2 | [Source](https://brownsbackersworldwide.com/chapters/phx-area-browns-backers/) |
| Kansas City Chiefs | NFL | 1 | [Source](https://chiefsfansofdallas.com/) |
| Minnesota Vikings | NFL | 4 | [Source](https://www.vikings.com/fans/clubs-watch-bars) |
| New England Patriots | NFL | 5 | [Source](https://nepfca.com/) |
| Carolina Hurricanes | NHL | 2 | [Source](https://www.nhl.com/hurricanes/fans/canes-bars) |
| Columbus Blue Jackets | NHL | 2 | [Source](https://www.nhl.com/bluejackets/fans/bar-network) |
| Florida Panthers | NHL | 2 | [Source](https://www.nhl.com/panthers/fans/catsontap) |
| Nashville Predators | NHL | 2 | [Source](https://www.nhl.com/predators/fans/preds-approved) |
| New York Rangers | NHL | 2 | [Source](https://www.nhl.com/rangers/fans/bar-network) |
| Seattle Kraken | NHL | 2 | [Source](https://www.nhl.com/kraken/fans/watch-parties) |
| St. Louis Blues | NHL | 2 | [Source](https://www.nhl.com/blues/fans/bars) |
| Munster | Rugby | 6 | [Source](https://www.mrsc.ie/branches/usa/) |
| New England Free Jacks | Rugby | 6 | [Source](https://freejacks.com/2026-pub-partners/) |
| Old Glory DC | Rugby | 4 | [Source](https://oldglorydc.com/bar-network/) |
| Arsenal | Soccer | 5 | [Source](https://arsenalamerica.com/branches/) |
| Barcelona | Soccer | 2 | [Source](https://www.fcbarcelonanyc.com/) |
| Bayern Munich | Soccer | 2 | [Source](https://fcbayern.com/en/fans/fan-clubs/us-where-to-watch) |
| Chelsea | Soccer | 2 | [Source](https://www.chelseainamerica.com/locals/phoenix-blues) |
| Everton | Soccer | 1 | [Source](https://www.turnmillnyc.com/everton-fc/) |
| Liverpool | Soccer | 3 | [Source](https://www.lfcboston.com/) |
| Manchester City | Soccer | 1 | [Source](https://www.newyorkskyblues.com/) |
| Manchester United | Soccer | 1 | [Source](https://smithfieldnyc.com/fan-clubs/manchester-united-fc/) |
| Real Madrid | Soccer | 1 | [Source](https://www.playwrightirishpubnyc.com/real-madrid/) |
| Tottenham Hotspur | Soccer | 2 | [Source](https://dcspurs.org/) |

### Files and rebuild

- [Venue research](venue-research.json): all evidence, address sources, event dates, and held records.
- [Team coverage queue](location-coverage.json): every catalog team and its status in this pass.
- [Team review notes](reviewed-teams.json): inspected sources and unresolved leads.
- [Additional leads](additional-leads.json): broader research notes without a single team assignment.
- [Public venue layer](../assets/data/verified-locations.js): accepted records loaded by the demo.

After editing reviewed evidence, run `node scripts/build-location-research.cjs` from the repository root. The script validates keys, required source fields, and duplicates; regenerates the public layer and coverage queue; and does not fetch websites. To run the interaction test, install jsdom 30 in your development environment and run `node tests/verified-locations.cjs`. The deployed site has no build dependency on jsdom.

## What the evidence means

Use **Source checked** for a location supported by an inspected team, alumni chapter, supporter group, or venue page. The date records when the page was reviewed; it is not a date when the business or host personally confirmed the location.

- `official-directory`: a team, alumni, or supporter organization publishes the location. Describe official affiliation only when the source explicitly establishes it.
- `venue-published`: the venue itself advertises the team gathering. This establishes a published host claim, not team endorsement.
- `dated-event`: evidence covers the stated event or season. It does not establish a permanent meeting place.
- **Host confirmed** requires a separate, recorded confirmation from the organizer or venue. No direct host outreach was performed for this batch.

Preserve each record's source URL, source title, short evidence note, check date, verification basis, and any event date. A null publication date means no reliable date was found; a copyright year or search crawl date is not a publication date.

## Import and maintenance

1. Match `teamKey` to the catalog and deduplicate by team, venue, and address. Preserve richer existing records and source history. A shared bar may legitimately host several teams.
2. Exclude dated events that ended before the research date from the active location list. Retain them in the research archive as leads. Future dated events should show their actual date and expire after it; do not convert them into standing venues.
3. Resolve notes about conflicting addresses, moved groups, ambiguous branches, or missing street addresses before activating a map pin. Never substitute a stadium, generic national fan-club directory, or opponent's party for a supporter venue.
4. Do not invent coordinates or copy a city center as a venue pin. Keep latitude and longitude empty until an address is geocoded and the result checked against the named venue. An address-based directions link can be used while coordinates are pending.
5. Revisit standing sources before the next season and after a reported move or closure. A listing does not guarantee that every game is shown or that early entry is available; preserve any limitations from the host.
6. Do not import personal contact names, email addresses, or phone numbers from the research pages. Public source links provide the route back to the organizer.

The `reviewed-teams.json` and `additional-leads.json` files distinguish sources that were successfully inspected from search leads, inaccessible pages, historical-only evidence, and unresolved conflicts. A search result or directory landing page alone is not enough to add a venue.

## Strong starting points for the next pass

| Sport/category | Sources already identified | Next action |
| --- | --- | --- |
| College | [Michigan game watches](https://alumni.umich.edu/athletics/game-watch-parties/), [Tennessee watch parties](https://alumni.utk.edu/vol-watch-parties/), [Washington 2026 parties](https://www.washington.edu/alumni/event/2026-football-watch-parties/), [Georgia game watching](https://alumni.uga.edu/gamewatching/) | Work through chapter pages and current-season events; resolve Georgia's inaccessible event pages. |
| NFL | [Ravens domestic flocks](https://www.baltimoreravens.com/fans/find-a-flock/domestic-flock-groups), [Vikings clubs and bars](https://www.vikings.com/fans/clubs-watch-bars), [Browns Backers](https://brownsbackersworldwide.com/), [Patriots fan clubs](https://fanclubs.patriots.com/) | Expand named chapters and venue addresses. Packers, Broncos, and Steelers directories need further interactive review. |
| MLB | [Astros 'Stros Social Club](https://www.mlb.com/astros/fans/stros-social-club), [Rays watch parties](https://www.mlb.com/rays/fans/watch-party) | Extract additional standing venue partners; inspect the Rays Bar League. Keep old postseason announcements archived. |
| NBA / WNBA | [Hawks bar network](https://www.nba.com/hawks/barnetwork), [Grizzlies bar network](https://www.nba.com/grizzlies/barnetwork), [Liberty bar network](https://liberty.wnba.com/bar-network) | Expand NBA venue networks and inspect the Liberty's named venues. Do not treat G League gatherings as parent NBA team parties. |
| NHL | [Hurricanes Canes Bars](https://www.nhl.com/hurricanes/fans/canes-bars), [Blue Jackets bar network](https://www.nhl.com/bluejackets/fans/bar-network), [Panthers Cats on Tap](https://www.nhl.com/panthers/fans/catsontap), [Rangers bar network](https://www.nhl.com/rangers/fans/bar-network), [Blues bars](https://www.nhl.com/blues/fans/bars) | Expand these standing networks and check new season listings for clubs whose current pages show no named locations. |
| Soccer | [Arsenal America branches](https://arsenalamerica.com/branches/), [Chelsea in America](https://www.chelseainamerica.com/), [Bayern US watch bars](https://fcbayern.com/en/fans/fan-clubs/us-where-to-watch), [Manchester United US chapters](https://manutdusa.com/chapters/) | Inspect additional local club pages and confirm street addresses. Current OLSC Seattle lists The Westy and Doyle's; older articles naming St. Andrews should not override it. |
| Rugby | [Free Jacks 2026 pub partners](https://freejacks.com/2026-pub-partners/), [Munster US branches](https://www.mrsc.ie/branches/usa/), [Old Glory DC bar network](https://oldglorydc.com/bar-network/) | Expand partner venues with resolved addresses. Check current team identity before reusing older RFCLA or other predecessor-team events. |
| Cricket | [Seattle Orcas official watch-party announcement](https://www.seattleorcas.com/news/seattle-orcas-announce-official-watch-parties-and-broadcast-lineup-for-major-league-cricket-season-four), [Washington Freedom](https://www.washingtonfreedom.com/), [San Francisco Unicorns events](https://www.sfunicorns.com/events/) | Seek new dated announcements or an explicit standing arrangement. The Orcas evidence in this batch is historical; a World Cup screening hosted by a franchise does not establish viewing of that franchise's matches. |

Cricket remains an active research gap. This pass did not establish current standing US venues for the researched MLC clubs. That means the evidence threshold was not met here, not that no fan communities or venues exist. IPL and other cricket leagues require separate research. Do not mark the category, its teams, or the overall catalog as comprehensively verified.
