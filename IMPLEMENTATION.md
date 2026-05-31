# MailHQ — Implementation Order

This document outlines the step-by-step build order for MailHQ, from project setup through to deployment and optional subscription billing.

---

## Phase 1: Foundation

### Step 1 — Project Scaffolding & Environment Setup
- Init Next.js 14 with App Router, TypeScript, and Tailwind CSS
- Install and configure shadcn/ui component library
- Create `.env.local` with all required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RESEND_API_KEY`
  - `ANTHROPIC_API_KEY`
- Create client wrappers:
  - `lib/supabase.ts`
  - `lib/resend.ts`
  - `lib/anthropic.ts`
- Set up ESLint, Prettier, and folder structure

### Step 2 — Database Schema (Supabase)
- Create 4 tables in Supabase SQL editor:
  ```sql
  contacts (id, user_id, name, email, category, institution, notes, created_at)
  attachments (id, user_id, file_name, file_url, created_at)
  campaigns (id, user_id, name, subject, body, ai_generated, attachment_id, scheduled_at, created_at)
  sends (id, campaign_id, contact_id, status, opened_at, replied_at, outcome, created_at)
  ```
- Enable Row Level Security (RLS) on all tables
- Set up Supabase Storage bucket for file attachments

---

## Phase 2: Auth

### Step 3 — Login & Signup
- Build `/app/(auth)/login` and `/app/(auth)/signup` pages using Supabase Auth
- Add middleware to protect all routes except auth pages
- Set up session handling with Supabase SSR client (cookie-based)
- Add shared authenticated layout with navigation

---

## Phase 3: Core Modules

### Step 4 — Contacts
- `/app/contacts` — list contacts with search and filter by category
- Add contact form: name, email, category, institution, notes
- Edit and delete contact actions
- CSV bulk import — parse client-side, bulk insert to Supabase

### Step 5 — Attachments
- `/app/attachments` — list uploaded files (CV, pitch deck, etc.)
- Upload file → Supabase Storage → save URL + metadata to `attachments` table
- Delete attachment (removes from storage and DB)
- Attachments are reusable across campaigns

### Step 6 — Campaigns (Create & List)
- `/app/campaigns` — list campaigns with status badges (draft, scheduled, sent)
- Campaign creation form: name, subject, body, pick attachment, pick recipients (by category or hand-pick)
- Save as draft to `campaigns` table
- `/app/campaigns/[id]` — campaign detail showing recipients list

---

## Phase 4: AI & Sending

### Step 7 — AI Compose
- API route `/api/ai-draft`:
  - Input: contact info (name, role, institution) + base email body
  - Calls Claude API and returns a personalised draft
  - Use prompt caching on the system prompt to reduce cost across bulk drafts
- In campaign detail: "Generate AI Drafts" button — calls the route per recipient, displays reviewable drafts
- Each draft is individually editable before sending
- "Refine my email" option — sends current body to Claude for tone/length/clarity improvements

### Step 8 — Sending via Resend
- API route `/api/send`:
  - Loops through selected contacts for a campaign
  - Sends personalised email via Resend with attachment
  - Creates a `sends` row per recipient with status `sent`
- Scheduled sending: check `scheduled_at`, trigger via Vercel Cron or scheduled function
- Rate-limit sends to avoid Resend throttling

---

## Phase 5: Tracking & Replies

### Step 9 — Open & Click Tracking (Resend Webhooks)
- API route `/api/webhooks/resend`:
  - Receives Resend webhook events: opened, clicked, bounced
  - Verifies webhook signature
  - Updates matching `sends` row (`opened_at`, `status`, etc.)
- Click tracking uses Resend's built-in link wrapping

### Step 10 — Replies & Outcome Tracking
- `/app/replies` — list sends where a reply exists or outcome is set
- Manual outcome marking per send: Interested / Meeting Booked / Not Interested / No Response
- Full send history visible on each contact's detail page

---

## Phase 6: Dashboard

### Step 11 — Dashboard
- `/app/dashboard` — overview stat cards: total sent, avg open rate, avg reply rate
- Breakdown table by category (e.g. "50 professors emailed, 7 replied")
- Charts using Recharts:
  - Sends by category (bar chart)
  - Reply funnel: sent → opened → replied → interested (funnel or stacked bar)
- All stats computed from live Supabase queries

---

## Phase 7: Deployment

### Step 12 — Polish & Deploy
- Add loading states, error boundaries, and empty states throughout
- Ensure mobile-responsive layout
- Deploy to Vercel — set all env vars in Vercel dashboard
- Point Resend webhook to deployed `/api/webhooks/resend` endpoint
- Smoke test: contact → campaign → AI draft → send → tracking → dashboard

---

## Phase 8: Monetisation (Post-MVP)

### Step 13 — Stripe Integration
- Add Stripe, create products and prices in Stripe dashboard (Free, Pro, Agency)
- API route `/api/stripe/checkout` — creates Checkout session, redirects to payment
- API route `/api/stripe/webhook` — handles `customer.subscription.created/updated/deleted`
- Store subscription status in Supabase (`subscriptions` table or `plan` column on user profile)

### Step 14 — Enforce Plan Limits
- Gate features by plan server-side in API routes, for example:
  - Free: 50 contacts, 1 campaign, no AI drafts
  - Pro: unlimited contacts, AI drafts, scheduling
  - Agency: multiple sender identities, team members
- Show upgrade prompts in the UI when a limit is hit

### Step 15 — Billing Portal
- API route `/api/stripe/portal` — redirects to Stripe Customer Portal
- Add a Billing page in settings for users to manage subscription, cancel, or update card

---

## Build Order at a Glance

```
Step 1  Scaffolding & env setup
Step 2  Database schema
Step 3  Auth (login / signup)
Step 4  Contacts module
Step 5  Attachments module
Step 6  Campaigns (CRUD)
Step 7  AI compose (Claude)
Step 8  Sending (Resend)
Step 9  Tracking (webhooks)
Step 10 Replies & outcomes
Step 11 Dashboard & charts
Step 12 Polish & deploy
Step 13 Stripe integration      ← post-MVP
Step 14 Plan limits enforcement ← post-MVP
Step 15 Billing portal          ← post-MVP
```
