# Team colors and stadium map defaults

Updated September 8, 2026. This data covers all 620 selectable teams. It is separate from the watch-party directory: a stadium map center does not count as a researched watch-party venue.

## Colors

`team-color-palettes.json` stores each team's primary/secondary interface pair, source, and selection basis. The nine previously approved Fan Map palettes are preserved. Published team colors are used where available; some clubs have several brand colors or no public numeric standard, so the record explains the representative pair chosen for this interface.

`scripts/build-team-colors.cjs` generates `assets/data/team-colors.js`. The picker uses the primary color as its background and the secondary color for the pin. The app uses those same colors for buttons, accents, and map pins. Button text has at least 4.5:1 contrast; small colored text receives a lighter tint where needed on the dark surface. These readability tokens do not change the actual primary/secondary swatches.

## Stadiums

`team-stadiums.json` records 615 sourced stadium or arena centers and five explicit cases without a confirmed fixed home: MI New York, Seattle Orcas, Washington Freedom, Peshawar Zalmi, and Quetta Gladiators. Sources establish the coordinates; `basis`, `homeSource`, and optional `note` describe home-venue choices and exceptions. Clubs using several venues show a reminder to check the game location. These entries are map starting points, not permission to tailgate at a venue.

`scripts/build-team-stadiums.cjs` generates `assets/data/team-stadiums.js`. Team selection loads the appropriate satellite-map center. Fans can move the pin, reset it to the stadium, or use their location. Teams without a fixed home receive no automatic pin; a location must be chosen before a tailgate can be saved. The app preserves existing stadium sketches when their bounds still match the sourced venue.

Northwestern uses Martin Stadium until October 2, 2026, then changes to the announced new Ryan Field. This transition is data-driven and covered by a date-boundary test. Other future venues remain excluded until their use is established.

## Validation and maintenance

- Both build scripts require exactly 620 unique catalog keys and reject missing provenance or invalid values.
- `tests/team-presentation.cjs` checks palettes, text contrast, signup themes, SVG picker pins, real Leaflet map centers/click/reset behavior, location selection, account-deletion races, and the planned stadium transition.
- `tests/verified-locations.cjs` continues to check the watch-party directory, locked team selection, driving directions, and SMS invites.

Update the source JSON before rebuilding its browser asset. Confirm home-venue changes against a current club or league announcement; some sports API venue assignments were stale during this pass.
