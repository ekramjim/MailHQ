# MailHQ

MailHQ is a personal outreach management app that lets you organise contacts, write and send bulk emails, personalise each email with AI, and track everything from opens to replies in one dashboard.

Built for anyone doing targeted outreach -- whether you're emailing professors for research opportunities, pitching clients, or running cold outreach campaigns.

---

## Features

### Contacts
- Add contacts manually or import in bulk via CSV
- Tag and categorise contacts (e.g. bioinformatics professor, SaaS client, startup founder)
- Add notes per contact for context

### Campaigns
- Create campaigns with a subject line and email body
- Write your own email or use AI to draft and personalise it per recipient
- Target a specific contact category or hand-pick recipients
- Attach files like your CV or pitch deck, reusable across campaigns
- Schedule campaigns to send at a specific time

### AI Compose
- AI drafts a personalised version of your email for each recipient based on their name, role, and institution
- Review and edit each draft before sending, or bulk approve and send
- Use AI to refine emails you wrote yourself -- adjust tone, shorten, or improve clarity

### Sending
- Bulk send to all contacts in a campaign via Resend
- Each recipient gets their own personalised email
- Attachments sent automatically with each email

### Tracking
- Track opens, clicks, and replies per campaign and per contact
- Manually mark reply outcomes -- interested, meeting booked, not interested, no response
- Full send history per contact so you know exactly what you sent and when

### Dashboard
- Overview of all campaigns with key stats -- sent, open rate, reply rate
- Breakdown by category (e.g. 50 bioinformatics professors emailed, 7 replied)
- Visual charts for sends by category and the reply funnel

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| File Storage | Supabase Storage |
| Email Sending | Resend |
| AI | Anthropic API (Claude) |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project
- A Resend account
- An Anthropic API key

### Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/mailhq.git
cd mailhq
```

Install dependencies:

```bash
npm install
```

Set up your environment variables by creating a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SETTINGS_ENCRYPTION_KEY=your_long_random_secret
ANTHROPIC_API_KEY=your_anthropic_api_key
```

Each user connects their own Resend API key and verified sender email from the Settings page.

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Database Schema

```sql
contacts (id, user_id, name, email, category, institution, notes, created_at)
attachments (id, user_id, file_name, file_url, created_at)
campaigns (id, user_id, name, subject, body, ai_generated, attachment_id, scheduled_at, created_at)
sends (id, campaign_id, contact_id, status, opened_at, replied_at, outcome, created_at)
user_sending_settings (user_id, resend_api_key_encrypted, resend_from_name, resend_from_email, created_at, updated_at)
```

---

## Project Structure

```
mailhq/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   ├── contacts/
│   ├── campaigns/
│   ├── settings/
│   ├── replies/
│   └── attachments/
├── components/
├── lib/
│   ├── supabase.ts
│   ├── encryption.ts
│   └── anthropic.ts
└── api/
    ├── send/
    ├── ai-draft/
    └── webhooks/resend/
```

---

## Roadmap

- [ ] Contact import via CSV
- [ ] Campaign builder with rich text editor
- [ ] AI personalised drafts per recipient
- [ ] Bulk send via Resend
- [ ] Open and click tracking via Resend webhooks
- [ ] Reply outcome tracking
- [ ] Dashboard with charts
- [ ] Scheduled sending
- [ ] Follow-up reminders

---

## Built by

[LynkSphere](https://lynksphere.com.au) -- Melbourne-based software studio.
