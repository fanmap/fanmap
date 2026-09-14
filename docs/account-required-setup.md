# FanMap account activation

## Current state — 2026-09-14

Production main remains at 80841e5 in intentional temporary open-access mode. The root entry point and public build are unchanged. Signup is not active on FanMap.com.

The connected project is FanMap, gmabefzpffdydqnpgwqe (us-west-2). It was resumed and reached ACTIVE_HEALTHY. It also contains older empty leagues, teams, organizations, venues and events tables; these were not changed.

Completed remotely:
- Applied the existing member_access schema and the new session_security migration.
- Confirmed all five fanmap_* tables have RLS and no direct anon/authenticated SELECT privileges.
- Confirmed browser roles cannot execute the privileged functions.
- Verified profile creation and valid, wrong-owner, expired, banned and revoked session handling in a rolled-back SQL transaction.
- Deployed fanmap-access version 1, including getUser verification and a live auth.sessions lookup before data access.
- Public Auth settings reported email enabled, email confirmation required, and anonymous sign-in disabled.

Not completed:
- The protected directory import. The workspace disconnected during preparation; the remote payload table was rechecked and contains zero rows.
- Real signup, delivered confirmation/recovery email, and signed-in browser journeys against the actual provider.
- Cross-account API save/share verification with real authenticated accounts.
- Public repository/history exposure and a production account artifact deployment.

The server fails closed while the directory is absent. The frontend remains disabled. A deployed Edge Function or passing mocked test is not evidence of a working registration launch.

## Build and import

Run in a trusted checkout:

```sh
node scripts/build-member-data.cjs
node scripts/import-member-data.mjs
```

The importer requires FANMAP_SUPABASE_URL and FANMAP_SUPABASE_SERVER_KEY in the local process environment. Supply the server-only secret through a secret manager or protected shell environment; never put it in browser config, git, CI output, or chat. The importer performs one atomic row upsert and reads the result back to compare the entire payload. It logs only team counts. The _private directory is ignored by git and excluded from both site artifacts.

```sh
node scripts/build-accounts.cjs
```

This creates account-build with disabled authentication for guest/security tests. To build a connected private preview, set FANMAP_SUPABASE_URL and FANMAP_SUPABASE_PUBLISHABLE_KEY and explicitly pass --configured. Only sb_publishable_ keys are accepted by that build. accounts/index.html and accounts/web-app.js preserve the previous account-aware entry/runtime; the ordinary public build continues to use the root index.html and assets/web-app.js.

Do not upload account-build or _private as public Actions artifacts. Preview on localhost with browser test interception, or configure an exact private-preview origin on both the function CORS allowlist and Auth redirect allowlist before testing real sessions. Do not broaden the production CORS allowlist to arbitrary origins.

## Required launch gates

1. Verify the imported corpus and run tests/account-live-anonymous.mjs against the real project using only its publishable key. Check the deployed function version matches this branch.
2. Configure production SMTP/email delivery, site URL https://fanmap.com/, and approved confirmation/recovery return URLs, including the application's recovery query parameter. Test delivered signup confirmation and password recovery on real accounts. Confirmation in a different browser must have a clear recovery/sign-in path because the frontend uses PKCE.
3. With two real accounts, test signup, confirmation, login, reload, save/reload across devices, opaque share resolution, forged owner IDs, logout, expired/revoked sessions, banned accounts, and independent saved state. Direct anon and ordinary authenticated REST access to every fanmap_* table and RPC must remain denied.
4. Resolve source exposure. The repository is public and contains the corpus and its history. Pages exclusions cannot protect GitHub raw URLs, history, forks, caches, previous artifacts or existing downloads. Make the repository private after verifying the account's GitHub Pages entitlement, or move the complete private corpus/history to controlled storage and remove public copies. Preserve the corpus before removing any source files; do not rewrite shared history blindly. Previously downloaded information cannot be recalled.
5. Deploy ONLY the account-build allowlist through the chosen Pages/hosting pipeline. Do not activate by merely changing access-config.js or putting a dialog over the open-access build. The root Jekyll config intentionally still supports open mode; an account launch must change deployment to the account artifact or reinstate assets/data exclusions alongside the gated entry/runtime.
6. Verify old data/research URLs return 403/404 on fanmap.com, www, the github.io hostname, preview deployments and old artifact URLs. Check fresh guests, forged local storage, legacy #pin links and old /app routes. Verify no static catalog or map requests occur before successful server authorization.
7. Record the exact tested commit and deployment, then activate accounts. Roll back a failed account launch to a maintenance/locked artifact; do not silently republish private data.

No repository visibility, DNS, hosting source, email settings or production frontend activation was changed in this work.

## Tests and known limitations

- node --test tests/account-api.mjs tests/account-session.mjs tests/account-build.mjs
- node tests/account-live-anonymous.mjs (real backend, read-only, no emails)
- tests/account-browser.py (Chromium/WebKit with provider and API doubles)
- supabase/tests/session-security.sql (transactional live database assertions; all fixtures roll back)
- Existing open-access and directory regression tests remain applicable.

The database Security Advisor reports five informational RLS-without-policy findings, expected for service-only tables with browser privileges revoked. A pre-existing public.set_updated_at search_path warning remains outside the new account schema; review before launch: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable.

Session security follows https://supabase.com/docs/guides/auth/sessions: after Auth validates the token, its session_id must still belong to that user in auth.sessions. The check additionally rejects explicit session expiry, banned users and deleted users. The service-only private function is not a browser-authorized RPC.

Migration history created by the management API was aligned to the checked-in migration filenames after verifying the applied versions, so a later CLI push will not try to reapply the same schema.
