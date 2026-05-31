"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = createServerSupabaseClient();
  const { error } = await (await supabase).auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const supabase = createServerSupabaseClient();
  const { error } = await (await supabase).auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}

export async function logout() {
  const supabase = createServerSupabaseClient();
  await (await supabase).auth.signOut();
  redirect("/login");
}
