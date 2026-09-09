# Fan Map — account-required access

The public homepage explains Fan Map and routes visitors to **Create account** or **Sign in**. Guests cannot load the location directory, tailgate map, saved places, or member invitations. No demo profile or local flag is accepted as authorization.

## Current deployment status

The public access gate is fail closed. `assets/access-config.js` intentionally has `enabled: false` and no project credentials because a backend has not yet been connected. Registration/sign-in are not operational in that state, and the UI clearly says so. Do not enable it until the activation checklist below is complete.

## Public data exclusion

GitHub Pages/Jekyll must honor `_config.yml`: the entire `assets/data`, `research`, `scripts`, `tests`, and `supabase` trees are excluded. `scripts/build-public.cjs` provides a strict allowlisted equivalent for testing and future custom deployment. The location and stadium corpus is never an anonymous application download. Old `/app` and `/app.html` routes redirect to the gated homepage. Old coordinate-bearing `#pin` links are no longer rendered; already-copied URLs/data cannot be erased by this release.

**The repository is currently public. Excluding files from Pages does not restrict GitHub, Git history, forks, previously generated Actions artifacts, or prior downloads. The owner must make the repository private (or move the corpus and its history into private storage). Confirm the account's Pages support before changing repository visibility so the public domain is not inadvertently unpublished. No claim of full data confidentiality is made while the public repository still contains the corpus.**

## Authenticated backend, prepared for connection

The Supabase migration creates profiles, the member-only directory payload, per-user saved state, expiring opaque share IDs, and a request limiter. All tables have RLS enabled and all direct privileges revoked from anon/authenticated roles. Only the server-side service role accesses them. The Edge Function validates the bearer token using Auth `getUser`, rejects anonymous/unconfirmed users and missing profiles, and uses the verified user ID for writes. It never accepts a caller-supplied owner ID. All private responses use `Cache-Control: private, no-store`.

The frontend uses real email/password signup, email confirmation, sign-in, recovery, and sign-out through Supabase Auth when configured. There is no fake fallback. App scripts/maps load only after the private API approves the session and returns its payload. Saves use the account API rather than guest local storage; sign-out removes the in-page data. New tailgate invitation URLs use random server-side identifiers and require a verified member account to resolve. External directions links open only from the member view.

### Activation checklist

1. Connect the owner's Supabase project. Apply `supabase/migrations/20260909030000_member_access.sql` and test that direct anonymous/ordinary-user REST reads on every new table are denied.
2. Configure email/password authentication with email confirmation enabled, production email delivery and production redirect URLs for `https://fanmap.com/` (including allowed query parameters). Test signup, confirmation, password recovery, disabled users and expired sessions with real accounts.
3. Run `node scripts/build-member-data.cjs` in a trusted workspace. Import `_private/member-payload.json` into `fanmap_member_payload` at id `directory` using a server-side credential. Never publish the import file or service-role key.
4. Deploy `supabase/functions/fanmap-access`. Its gateway JWT setting is false only because the function explicitly verifies tokens with Auth before every data access. Confirm unauthenticated calls return 401, anonymous/unverified accounts return 403, and a verified member can load data, save state, and resolve an opaque share. Test cross-account state isolation.
5. Put only the project's public URL and publishable key into `assets/access-config.js`, set enabled true, and run the end-to-end tests against the actual provider before launch.
6. Resolve public GitHub/history exposure, and check all legacy static data URLs on the live domain remain 404/403.

## Tests

`node --test tests/account-api.mjs` covers server policy with injected service doubles. `tests/account-browser.py` covers guests, forged local profiles, deep links, data-path exclusion, responsive layout, a mocked authenticated-member flow and server denial overriding a client session. These tests do not establish that a live Supabase project is configured. Existing directory, color and stadium regressions remain in the repository. No emails are sent by the browser test suite.
