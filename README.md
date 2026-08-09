# Resolve

**Professional contact enrichment from LinkedIn profiles.**

Resolve is a production-quality B2B lead enrichment tool. You enter a LinkedIn profile URL, and it identifies the person's name, current employer, company domain, and professional work email using authorized third-party data providers.

---

## Features

- LinkedIn profile → professional email enrichment pipeline
- Multi-provider waterfall (Hunter, Apollo, Snov, Findymail, Prospeo)
- Independent email verification (separate from discovery)
- Transparent confidence scoring (0–100, per-signal breakdown)
- Status classification: Verified / Probable / Unverified / Not Found
- Search history with delete and copy actions
- Dashboard with enrichment statistics
- NextAuth.js authentication (GitHub + Google OAuth)
- Neon PostgreSQL for persistent history
- IP-based rate limiting
- Provider adapter architecture — add/remove providers without touching core code
- Fully responsive, monochrome UI

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/MeowMan007/Linkedin-Email-Finder.git
cd Linkedin-Email-Finder/resolve
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Then open `.env.local` and fill in your values.

**Minimum required to function:**
- At least one provider API key (see below)
- `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` (set to your deployment URL)

**Optional but recommended:**
- `DATABASE_URL` (Neon PostgreSQL — for history, caching, rate limiting)
- GitHub or Google OAuth credentials (for auth)

### 4. Configure database (Neon PostgreSQL)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (Pooled connection recommended)
4. Set `DATABASE_URL=<your-connection-string>` in `.env.local`

The schema is applied automatically on first request. You can also apply it manually:

```bash
# Using psql
psql $DATABASE_URL -f src/lib/schema.sql
```

### 5. Configure enrichment providers

At least one provider must be configured. Start with **Hunter.io** (free tier available):

#### Hunter.io (Recommended)
1. Create account at [hunter.io](https://hunter.io)
2. Go to API → Get API Key
3. Set `HUNTER_API_KEY=<your-key>`
4. Free tier: 150 requests/month

#### Apollo.io
1. Create account at [apollo.io](https://app.apollo.io)
2. Settings → Integrations → API → Create API Key
3. Set `APOLLO_API_KEY=<your-key>`

#### Snov.io
1. Create account at [snov.io](https://app.snov.io)
2. OAuth → Create credentials
3. Set `SNOV_CLIENT_ID=<id>` and `SNOV_CLIENT_SECRET=<secret>`

#### Findymail
1. Create account at [findymail.com](https://app.findymail.com)
2. API → Get Key
3. Set `FINDYMAIL_API_KEY=<your-key>`

#### Prospeo
1. Create account at [prospeo.io](https://prospeo.io)
2. API → Create Key
3. Set `PROSPEO_API_KEY=<your-key>`

### 6. Configure OAuth (optional)

#### GitHub
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`

#### Google
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create OAuth 2.0 credentials
3. Set callback URL: `http://localhost:3000/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Build

```bash
npm run build
```

### 9. Deploy to Vercel

**Option A — Vercel CLI:**
```bash
npx vercel deploy
```

**Option B — GitHub integration:**
1. Push this repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Set all environment variables in the Vercel dashboard
4. Deploy

**Important:** Set all `.env.local` variables as Vercel Environment Variables in your project settings.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/  — NextAuth handler
│   │   ├── enrich/              — POST /api/enrich
│   │   ├── history/             — GET/DELETE /api/history
│   │   └── stats/               — GET /api/stats
│   ├── auth/signin/             — Sign-in page
│   ├── dashboard/               — Dashboard
│   ├── history/                 — Search history
│   ├── result/[id]/             — Result detail
│   ├── settings/                — Settings
│   └── page.tsx                 — Home page
│
├── components/
│   ├── SearchInput.tsx
│   ├── LeadCard.tsx
│   ├── VerificationStatus.tsx
│   ├── ConfidenceScore.tsx
│   ├── SearchHistory.tsx
│   ├── LoadingState.tsx
│   ├── CopyButton.tsx
│   └── Navigation.tsx
│
├── lib/
│   ├── validation.ts      — LinkedIn URL validation
│   ├── normalization.ts   — URL normalization, email patterns
│   ├── confidence.ts      — Confidence scoring engine
│   ├── logger.ts          — Structured logging (no key leakage)
│   ├── db.ts              — Neon PostgreSQL client
│   ├── rateLimit.ts       — IP rate limiting
│   ├── auth.ts            — NextAuth configuration
│   └── api.ts             — Client-side API helpers
│
├── pipeline/
│   ├── orchestrator.ts    — Coordinates all stages
│   ├── profileResolver.ts — Stage 1: Profile identity
│   ├── companyResolver.ts — Stage 2: Company + domain
│   ├── emailDiscovery.ts  — Stage 3: Provider waterfall
│   └── emailVerification.ts — Stage 4: Verification
│
├── providers/
│   ├── index.ts           — WaterfallEngine + interface
│   ├── hunter.ts          — Hunter.io adapter
│   ├── apollo.ts          — Apollo.io adapter
│   ├── snov.ts            — Snov.io adapter
│   ├── findymail.ts       — Findymail adapter
│   └── prospeo.ts         — Prospeo adapter
│
├── types/
│   └── index.ts           — All TypeScript interfaces
│
└── __tests__/
    ├── validation.test.ts
    ├── confidence.test.ts
    └── pipeline.test.ts
```

---

## API

### POST /api/enrich

```json
{
  "linkedinUrl": "https://www.linkedin.com/in/example/"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "person": { "name": "Jane Doe", "title": "VP Engineering", "company": "Acme Corp" },
    "company": { "name": "Acme Corp", "domain": "acme.com", "website": "https://acme.com" },
    "email": { "address": "jane.doe@acme.com", "status": "verified", "confidence": 94 },
    "confidence": { "total": 94, "band": "Very High", ... },
    "sources": ["Hunter.io", "Hunter.io Email Verification"],
    "timestamp": "2026-08-09T16:00:00.000Z"
  }
}
```

HTTP status codes:
- `400` Invalid LinkedIn URL
- `404` Profile or company not found
- `422` Insufficient data to complete enrichment
- `429` Rate limited
- `500` Internal server error

---

## Data Principles

- **Accuracy over coverage.** If we can't reliably find an email, we return "Not found" rather than guessing.
- **No personal email addresses.** Only professional/work emails are returned.
- **Verified ≠ discovered.** Email discovery and verification are separate pipeline stages.
- **No LinkedIn scraping.** Only authorized third-party API providers are used.
- **No credential exposure.** All provider API calls happen server-side only.

---

## License

MIT
