# Runbook: Google Maps API key

Owner: **C (QA / DevOps / Security)** · Roadmap task **1C-2** · Related: KNOWN_ISSUES #2

## Why this exists

The Maps key is a **browser key**. Anything prefixed `VITE_` is inlined into the
JS bundle at build time, so it is readable by anyone who opens devtools. That is
normal and supported — a browser key is not protected by secrecy, it is protected
by the **restrictions set on it in Google Cloud Console**. An unrestricted key is
a billing liability: anyone can lift it from the bundle and bill Maps usage to
our project.

## What went wrong

Commit `c31eb81` ("feat: integrate Google Maps and expand user profile",
2026-09-20) added key `AIzaSyBv9If5RVuxomzcSFyz5Z9KBVTC5-WTRVc` in two places:

- `.env.example` — a real key where a placeholder belongs
- a hardcoded fallback in `src/components/maps/EstateMapView.tsx`

`c31eb81` is an ancestor of `origin/main`, so the key is in every clone and fork.

Both are removed from the working tree, **but the key is still in git history and
in any build output produced before this change** (`dist/` holds it until the next
`npm run build`). Scrubbing history would not help: the repo has been pushed and
cloned. The key must be treated as compromised and rotated.

## Rotation (Google Cloud Console — must be done by a project owner)

1. **Create the replacement keys first**, so there is no outage.
   APIs & Services → Credentials → *Create credentials* → *API key*.
   Create **one key per environment**, named so they are obvious:
   `maps-browser-dev`, `maps-browser-staging`, `maps-browser-prod`.
2. **Restrict each new key** (both restrictions, not just one):
   - *Application restrictions* → **Websites (HTTP referrers)**:

     | Key | Referrers |
     |---|---|
     | `maps-browser-dev` | `http://localhost:3000/*` |
     | `maps-browser-staging` | `https://<staging-domain>/*` |
     | `maps-browser-prod` | `https://<production-domain>/*` |

     Use exact hosts. Do **not** use `*` or a bare `*.web.app/*` — every other
     Firebase Hosting site would then be able to spend our quota.
   - *API restrictions* → **Restrict key** → enable only **Maps JavaScript API**
     (add Places / Geocoding only if and when we actually call them).
3. **Cap the spend**: APIs & Services → Maps JavaScript API → *Quotas* → set a
   daily request cap, and add a Billing → *Budgets & alerts* budget on the project.
4. **Roll the keys out**: put each key in that environment's `.env.local` /
   CI secret (`VITE_GOOGLE_MAPS_API_KEY`). Never in a committed file.
5. **Verify the new key works** in each environment (the map renders; no
   `RefererNotAllowedMapError` in the console).
6. **Delete the old key** `AIzaSyBv9If5RVuxomzcSFyz5Z9KBVTC5-WTRVc` from
   Credentials. Delete, don't just disable — a disabled key can be re-enabled.
7. **Check for abuse before and after**: Metrics → Maps JavaScript API, look for
   request spikes from unexpected referrers while the key was unrestricted.
8. Run `npm run build` to replace any `dist/` bundle that still embeds the old key.

## Keeping it from coming back

- `.gitignore` already ignores `.env*` except `.env.example`. `.env.example`
  holds placeholders only.
- There is no fallback key in the source. If `VITE_GOOGLE_MAPS_API_KEY` is unset,
  `EstateMapView` renders a "map unavailable" panel instead of silently using a
  shared key.
- Add a secret scan to CI when 2C-1 lands (e.g. gitleaks, or a grep for `AIza`
  over tracked files as a cheap first pass).

## A note on the Firebase web API key

`firebase-applet-config.json` also contains an `AIza...` key. That one is the
Firebase **web config** key and is *meant* to be public — it identifies the
project, it does not authorise anything. It must not be rotated as part of this
task. What protects Firebase data is Firestore/Storage security rules
(KNOWN_ISSUES #1, task 2A-1), not the secrecy of that key.
