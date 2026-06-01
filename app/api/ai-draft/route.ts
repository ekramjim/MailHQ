import { NextRequest, NextResponse } from "next/server";
import { model } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { baseBody, subject, contact } = await req.json();

  if (!baseBody || !contact?.name || !contact?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `You are helping personalise a cold outreach email.

Recipient details:
- Name: ${contact.name}
- Email: ${contact.email}
- Category: ${contact.category ?? "unknown"}
- Institution: ${contact.institution ?? "unknown"}

Subject: ${subject}

Base email template:
${baseBody}

Rewrite the email to feel personal and genuine for this specific recipient.
- Address them by first name
- Reference their institution naturally if known
- Keep the core message and intent intact
- Keep it concise, professional, and human — not robotic
- Do NOT add subject line, sign-offs like "Best regards", or extra commentary
- Return ONLY the email body text`;

  try {
    const result = await model.generateContent(prompt);
    const draft = result.response.text();
    return NextResponse.json({ draft });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
