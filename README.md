# AI Review Response Manager

AI-powered Google review management for high-ticket service businesses. Generate unique, professional review responses with built-in risk detection — in seconds.

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (Postgres) with Row Level Security
- **Auth**: Supabase Auth
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe
- **Google Integration**: Google Business Profile API
- **Hosting**: Vercel

## Features

- 🤖 **AI Draft Generation** — GPT-4o-mini generates unique, human responses (no templates)
- 🛡️ **Risk Detection** — Keyword scanning flags legal threats; auto-activates Safe Mode
- 📥 **Review Inbox** — Filter by unanswered, 1–3 stars, >48h old, or risk-flagged
- 📊 **Dashboard** — Response rate, avg response time, urgent & risk review counts
- 🔗 **Google OAuth** — Connect Google Business Profile, sync reviews, post replies
- 💳 **Stripe Billing** — Starter ($29), Professional ($79), Agency ($199) plans
- 🔒 **Row Level Security** — Multi-tenant data isolation per company

## Quick Start

### 1. Clone & Install

```bash
git clone <repo-url>
cd AI-review-respone-manager
npm install
```

### 2. Set up Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o-mini) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_STARTER_PRICE_ID` | Stripe Price ID for Starter plan |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Professional plan |
| `STRIPE_AGENCY_PRICE_ID` | Stripe Price ID for Agency plan |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### 3. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the migration in your Supabase SQL editor:

```bash
# Copy and run the contents of:
supabase/migrations/001_initial_schema.sql
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-domain.com/api/google/callback`
4. Enable: Google Business Profile API, Google My Business API

### 5. Set up Stripe

1. Create products + prices in [Stripe Dashboard](https://dashboard.stripe.com)
2. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
3. Listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

1. Import repository to Vercel
2. Add all environment variables from `.env.example`
3. Deploy

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # Dashboard, Inbox, Settings
│   └── api/             # API routes
├── components/
│   ├── dashboard/       # Dashboard stats components
│   ├── layout/          # Sidebar, header
│   └── reviews/         # Review card, inbox, AI dialog
├── lib/
│   ├── supabase/        # Supabase client (browser + server + middleware)
│   ├── openai.ts        # AI response generation
│   ├── stripe.ts        # Stripe client + plan config
│   ├── google.ts        # Google OAuth client
│   ├── risk-detection.ts # Keyword risk detection
│   └── utils.ts         # Utilities
└── types/
    └── database.ts      # Supabase database types
supabase/
└── migrations/
    └── 001_initial_schema.sql  # Full DB schema with RLS
```

## AI Cost Estimate

Using GPT-4o-mini (~$0.00015/1K input tokens, ~$0.0006/1K output tokens):
- Average review: ~700 tokens total
- 100 reviews/month → ~€0.05–€0.10 per customer/month
