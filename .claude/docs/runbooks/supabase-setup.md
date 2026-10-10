# Runbook: Supabase project setup

For a new dev or staging project (ADR-014). Do these once per project. Needs
dashboard access to the project.

## 1. Keys into `.env.local`

Dashboard > **Project Settings > API**, and **Database > Connect**:

| Variable | Where | Public? |
|---|---|---|
| `VITE_SUPABASE_URL` | Project URL | yes (RLS protects data) |
| `VITE_SUPABASE_ANON_KEY` | `anon` / publishable key | yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` / secret key | **no**: bypasses RLS. Scripts and tests only |
| `SUPABASE_DB_URL` | Connect > Session pooler URI, password filled in | **no** |

Set `VITE_AUTH_MODE=supabase` to use the backend from the app.

## 2. Apply the schema

```bash
npm run db:push               # applies supabase/migrations/* in order
npm run db:push -- --dry-run  # see what would run
```
The CLI records applied migrations in `supabase_migrations.schema_migrations`;
re-running only applies new files. Never edit a migration that has been
applied anywhere: add a new one.

## 3. Auth providers (dashboard > Authentication > Providers)

- **Phone:** enable. For real SMS, configure Twilio, MessageBird, Vonage or
  Textlocal. For dev, add **test phone numbers** with a fixed OTP (e.g. the seed
  phones `+94771234567`, `+94719876543`, `+94772223344`, `+94773334455`, `+94774445566`, `+94775556677`,
  `+94765551234` with `123456`). Without one of these, `sendOtp` fails (KNOWN_ISSUES #33).
- **Email:** keep enabled (staff sign in with email + password).
- **Google** (Drive page only): create an OAuth client in Google Cloud Console
  (Web application; authorized redirect URI
  `https://<ref>.supabase.co/auth/v1/callback`), enable the Drive API on that
  Google project, paste the client id/secret here.
- **URL configuration:** Site URL = the app URL; Redirect URLs include
  `http://localhost:3000/**` and the Vercel URL `https://<app>/**`.

## 4. Edge Functions

```bash
npx supabase login                       # once per machine (opens a browser)
npx supabase link --project-ref <ref>
npx supabase secrets set PAYHERE_MERCHANT_ID=<id> PAYHERE_MERCHANT_SECRET=<secret> APP_BASE_URL=<app url>
npm run functions:deploy                 # create-payment, payhere-notify
```
`payhere-notify` has JWT verification off (`supabase/config.toml`): PayHere
authenticates with `md5sig`. Its URL, which `create-payment` puts into each
checkout, is `https://<ref>.supabase.co/functions/v1/payhere-notify`. Set
`PAYHERE_SANDBOX=false` only for live merchant credentials (needs 1C-4).

## 5. First admin

There is no public path to admin. After the staff member has an account
(Authentication > Users > Add user, with email + password), run in the SQL editor:

```sql
update public.users set is_admin = true where email = 'staff@example.lk';
```
After that, admins can promote others with `set_admin(uid)`.

## 6. Demo data and tests (dev projects only)

```bash
npm run seed -- --yes   # demo users (phones above, admin niluka.fernando@coconnect.gov.lk), estates, jobs, bids, awards
npm run test:db         # RLS, SQL functions and storage; creates and deletes throwaway test-*@coconnect.test users
```
Never run either against production.
