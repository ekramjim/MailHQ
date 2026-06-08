import { NextRequest, NextResponse } from "next/server";
import { genAI } from "@/lib/gemini";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const DAILY_LIMIT = 50;
const MAX_BODY_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { baseBody, subject, contact } = await req.json();

  if (!baseBody || !contact?.name || !contact?.email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (baseBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json({ error: `Email body must be under ${MAX_BODY_LENGTH} characters` }, { status: 400 });
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfDay.toISOString());

  if ((count ?? 0) >= DAILY_LIMIT) {
    return NextResponse.json({ error: "Daily AI limit of 50 drafts reached. Try again tomorrow." }, { status: 429 });
  }

  const prompt = `You are helping personalise a cold outreach email.

Recipient details:
- Name: ${contact.name}
- Email: ${contact.email}
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
- Do NOT use em dashes (—)
- Do NOT use emojis
- Return ONLY the email body text`;

  try {
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
    });
    const result = await model.generateContent(prompt);
    const draft = result.response.text().trim();

    if (!draft) throw new Error("AI generation returned an empty draft.");

    await supabase.from("ai_usage").insert({ user_id: user.id });
    return NextResponse.json({ draft });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
