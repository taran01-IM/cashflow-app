# Deploying to Vercel + Neon

This app is structured for Vercel hosting with a Neon Postgres database.
You will get a live URL once you complete the steps below.

> **Why I can't deploy this for you:** the deploy needs your accounts/tokens
> for Vercel and Neon. Run the steps below and you'll have a live URL.
> Each step takes ~1 minute. Total time: ~10 minutes.

---

## 1. Create a Neon database

1. Go to <https://console.neon.tech> and sign up (free tier is fine).
2. Click **Create project**. Pick any region close to your users (e.g. `aws-ap-south-1` for India).
3. After it's created, copy the **connection string** — it looks like:
   ```
   postgresql://USER:PASS@ep-xxxxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   This is your `DATABASE_URL`.

## 2. Push your code to GitHub

If you haven't already:
```bash
cd /path/to/this/repo
git add .
git commit -m "Vercel + Neon migration"
git remote add origin git@github.com:<your-username>/cashflow.git
git push -u origin main
```

## 3. Deploy to Vercel

### Option A — Web UI (easiest)

1. Go to <https://vercel.com/new>.
2. **Import** the GitHub repo you just pushed.
3. Vercel auto-detects the build. Confirm:
   - **Framework preset:** Other
   - **Build command:** `npm run vercel-build`
   - **Output directory:** `client/dist`
4. Open the **Environment Variables** section and add three values:

   | Name | Example value | Notes |
   |---|---|---|
   | `DATABASE_URL` | `postgresql://...neon.tech/...?sslmode=require` | from step 1 |
   | `JWT_SECRET` | a random 32+ character string | generate with `openssl rand -hex 32` |
   | `SEED_TOKEN` | another random string | only you know this; needed for the one-time seed call |

5. Click **Deploy**. Wait ~1 minute. Vercel gives you a URL like
   `https://cashflow-app-yourname.vercel.app`. **This is your final URL.**

### Option B — CLI

```bash
npm i -g vercel
vercel login
vercel link            # link to a new project
vercel env add DATABASE_URL production   # paste your Neon URL
vercel env add JWT_SECRET   production   # paste a random secret
vercel env add SEED_TOKEN   production   # paste another random secret
vercel --prod                            # deploys, prints the URL
```

## 4. Seed the database (one time, after first deploy)

Replace `<URL>` with your deployed URL and `<SEED_TOKEN>` with the token you set:
```bash
curl -X POST "https://<URL>/api/admin/seed?token=<SEED_TOKEN>"
```

You should see something like:
```json
{
  "ok": true,
  "seeded": [
    "3 business units",
    "3 users (+919810011111, +919810022222, +919810033333)",
    "7 banks",
    "52 inflows",
    "65 outflows"
  ]
}
```

> The seed endpoint is idempotent — calling it again does nothing. To wipe and
> reseed: `curl -X POST "https://<URL>/api/admin/seed?token=<TOKEN>&reset=1"`

## 5. Sign in

Open your URL. Use any of the seeded phone numbers:

| Phone | Role | Units |
|---|---|---|
| `+919810011111` | Admin | All |
| `+919810022222` | User  | MOPL, TAF |
| `+919810033333` | User  | IMS |

In production the OTP would be sent via SMS — to wire that up, replace the
`sendOtpSms()` stub in `lib/auth.js` with a Twilio/MSG91 call.

> **Dev mode:** when `NODE_ENV !== 'production'` (i.e. on `vercel dev` locally),
> the OTP is returned in the API response and auto-filled in the UI.
> In production it's only logged to Vercel's function logs — you'll either need
> an SMS provider or a peek at the logs to grab it.

---

## Local development

```bash
npm install
cp .env.local.example .env.local        # then edit to add DATABASE_URL etc.
npx vercel dev                          # starts local Vercel runtime on :3000
```

`vercel dev` runs the same serverless functions as production, against your
local `.env.local` values. You can point it at the same Neon DB or create a
separate Neon branch for dev (Neon supports DB branching).

If you don't want to use `vercel dev`, you can still build the frontend with
`npm run build` and serve `client/dist`, but the `/api/*` routes won't work.

---

## Architecture summary

```
/
├── api/                  Vercel serverless functions
│   ├── auth/             phone+OTP endpoints
│   ├── banks/            CRUD
│   ├── inflows/          CRUD
│   ├── outflows/         CRUD
│   ├── business-units.js
│   └── admin/seed.js     one-time seed (token-protected)
├── lib/                  shared code used by API functions
│   ├── db.js             Neon SQL client
│   ├── auth.js           JWT cookie + OTP logic
│   ├── seed.js           schema migration + seed data
│   ├── reference.js      static reference data
│   └── handler.js        cookie + JSON helpers
├── client/               Vite React SPA
└── vercel.json           build config + SPA rewrite
```

Cookie name: `cf_session` (HTTP-only JWT, 7-day TTL, `Secure` in production).
OTP store: `otp_codes` table in Postgres (TTL 5 min, max 5 attempts, 30s resend cooldown).
