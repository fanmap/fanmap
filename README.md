# Fan Map — temporary open access

FanMap.com currently opens the functional app without registration or sign-in, at the owner's request while the account backend is being prepared. The public experience has **Home, Watch parties, Tailgates, Fan zone, and Saved**. There is no pilot pitch, early-access form, or signup gate.

## Available now

Visitors choose a team and can search directory locations, view listed addresses and directions, save watch-party places, use the independent stadium-area satellite map, create meeting-point pins, and share those pins with another browser. The existing team-color palettes, stadium data, venue research, merchandise/ticket destinations and available fan-support links are preserved.

Saved teams, places and meeting points are stored in the current browser, not in a cloud account. The startup script recovers a prior `fanmap.legacy.backup.v1` browser backup only when the active browser profile is absent. It does not overwrite a newer profile or delete the backup. Shared tailgate URLs carry the location and user-entered details; anyone receiving a link can open that snapshot without an account. The sharing form discloses this before saving.

## Deliberate temporary access policy

The app's runtime directory and stadium data assets are public in this mode. This reverses the site's account-only restriction; it is not a claim that the public directory is private. Research files, server code, private import files and inactive auth scripts are still excluded from the deployed Pages site. `scripts/build-public.cjs` uses an explicit allowlist.

## Account work preserved for later

`assets/access.js`, `assets/access.css`, `assets/access-config.js`, `supabase/`, and the account-policy tests remain in the repository, but the public entry point does not load them. No Supabase database privileges, policies, credentials or configuration were changed to enable public access. Signup and sign-in remain inactive. The last account-gated release is preserved on `account-required` at `d54d60376ae0a0a35073f6ce81ed3fe96182c60e`. `docs/account-required-setup.md` records that previous release's activation checklist, not the current public site's policy.

Before re-enabling accounts, deploy and test the real backend, update the entry point and public build allowlist, and reinstate private-data exclusions. Do not merely place a login dialog over publicly downloadable data.

## Verification

Run `node scripts/build-public.cjs`, `node tests/open-access.cjs`, the directory regression tests, and the existing public Playwright suite. The additional open-access browser test checks clean guests, old app routes, legacy browser-save recovery, and absence of account API calls. The inactive server authorization unit tests continue to run separately; they do not prove a live backend has been configured.

The public-release workflow checks that the actual domain serves the exact committed app/data assets and opens the directory and tailgate pin tools in a fresh browser with no account. It does not send texts, make purchases, or contact a backend account service.
