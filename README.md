# MailHQ

MailHQ is a personal outreach management app. Organise contacts, write and send bulk emails, personalise each message with AI, and track opens, clicks, and replies — all in one place.

Built for targeted outreach: emailing professors for research opportunities, pitching clients, cold outreach campaigns, and more.

---

## Features

**Contacts**
- Add contacts manually or bulk import via CSV
- Tag contacts by category (e.g. professor, client, founder)
- Add notes per contact for context

**Campaigns**
- Create campaigns with a subject line and email body
- Target a contact category or hand-pick individual recipients
- Attach reusable files (CV, pitch deck, etc.) to campaigns

**AI Compose**
- AI (Claude) drafts a personalised version of your email for each recipient
- Review and edit each draft individually before sending, or bulk approve
- Use AI to refine emails you wrote yourself — adjust tone, shorten, or improve clarity

**Sending**
- Bulk send to all campaign recipients via Resend
- Each recipient gets their own personalised email
- Attachments delivered automatically with each email

**Tracking**
- Track opens, clicks, and replies per campaign and per contact
- Manually mark reply outcomes: Interested, Meeting Booked, Not Interested, No Response

**Dashboard**
- Overview stats: total sent, open rate, reply rate
- Breakdown by contact category
- Visual charts for sends by category and the reply funnel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Email Sending | Resend (per-user API key) |
| AI | Google Gemini API |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini](https://aistudio.google.com/app/apikey) API key
- A [Resend](https://resend.com) account (each user connects their own)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/mailhq.git
cd mailhq
npm install
```

### 2. Environment variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SETTINGS_ENCRYPTION_KEY=a_long_random_secret_string
GEMINI_API_KEY=your_gemini_api_key
```

> `SETTINGS_ENCRYPTION_KEY` is used to encrypt each user's Resend API key before storing it in the database. Use any long random string (32+ characters).

### 3. Database setup

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), link your project, and push the migrations:

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

Or apply the SQL files in `supabase/migrations/` manually via the Supabase SQL editor, in filename order.

The schema includes:

```
contacts               — contact list per user
attachments            — uploaded files (CV, pitch deck, etc.)
campaigns              — email campaigns
sends                  — per-recipient send records with status and tracking
user_sending_settings  — encrypted Resend API key and sender details per user
```

Row Level Security (RLS) is enabled on all tables — users can only access their own data.

### 4. Supabase Storage

In the Supabase dashboard, create a storage bucket named `attachments`. Set it to **public** (files are served via public URL for email delivery).

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Connecting Resend (per user)

Each user connects their own Resend account from the **Settings** page. Here's how:

1. Sign up at [resend.com/signup](https://resend.com/signup)
2. Go to [Domains](https://resend.com/domains), add your domain, and add the DNS records shown — verification usually takes a few minutes
3. Go to [API Keys](https://resend.com/api-keys) and create a new key
4. In MailHQ Settings, enter your sender name, a verified sender email (e.g. `hello@yourdomain.com`), and your API key

API keys are encrypted before being stored.

---

## Project Structure

```
mailhq/
├── app/
│   ├── (auth)/          — login and signup pages
│   ├── (app)/           — protected app routes
│   │   ├── dashboard/
│   │   ├── contacts/
│   │   ├── campaigns/
│   │   ├── attachments/
│   │   ├── replies/
│   │   └── settings/
│   └── api/
│       └── ai-draft/    — Claude AI draft generation endpoint
├── components/          — shared UI components
├── lib/                 — Supabase client, encryption, Anthropic client
├── supabase/
│   └── migrations/      — database migration files
└── types/               — shared TypeScript types
```

