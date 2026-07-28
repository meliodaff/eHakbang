"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-client";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  validateConfirmPassword,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  type FieldErrors,
} from "@/lib/validation/auth";

export type FormState =
  | {
      errors?: FieldErrors;
      message?: string;
    }
  | undefined;

export async function signUpAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const fullName = String(formData.get("fullName") ?? "");
  const email = String(formData.get("email") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const termsAccepted = formData.get("termsAccepted") === "on";
  const captchaToken = formData.get("cf-turnstile-response");

  const errors: FieldErrors = {};
  const fullNameErrors = validateFullName(fullName);
  const emailErrors = validateEmail(email);
  const phoneErrors = validatePhone(phone);
  const passwordErrors = validatePassword(password);
  const confirmErrors = validateConfirmPassword(password, confirmPassword);
  if (fullNameErrors.length) errors.fullName = fullNameErrors;
  if (emailErrors.length) errors.email = emailErrors;
  if (phoneErrors.length) errors.phone = phoneErrors;
  if (passwordErrors.length) errors.password = passwordErrors;
  if (confirmErrors.length) errors.confirmPassword = confirmErrors;
  if (!termsAccepted) {
    errors.termsAccepted = ["You must agree to the Terms and Conditions."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Turnstile verification is handled by Supabase Auth itself (Auth >
  // Protection > Bot and Abuse Protection, configured with the Turnstile
  // secret key) — the token is just passed through here.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      captchaToken: typeof captchaToken === "string" ? captchaToken : undefined,
    },
  });
  if (error || !data.user) {
    return { message: error?.message ?? "Could not create your account. Please try again." };
  }

  const admin = getSupabaseServerClient();
  const { error: profileError } = await admin.from("profiles").insert({
    id: data.user.id,
    full_name: fullName,
    phone,
  });
  if (profileError) {
    return { message: "Account created, but saving your profile failed. Please contact support." };
  }

  if (!data.session) {
    // Email confirmation is enabled on this Supabase project — the user
    // must confirm before they can sign in.
    redirect("/login?confirm=1");
  }
  redirect("/");
}

export async function signInAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const captchaToken = formData.get("cf-turnstile-response");

  if (!email || !password) {
    return { message: "Enter your email and password." };
  }

  // Turnstile verification is handled by Supabase Auth itself (Auth >
  // Protection > Bot and Abuse Protection, configured with the Turnstile
  // secret key) — the token is just passed through here.
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken: typeof captchaToken === "string" ? captchaToken : undefined,
    },
  });
  if (error) {
    return { message: "Invalid email or password." };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function completeOAuthProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const phone = String(formData.get("phone") ?? "");
  const termsAccepted = formData.get("termsAccepted") === "on";

  const errors: FieldErrors = {};
  const phoneErrors = validatePhone(phone);
  if (phoneErrors.length) errors.phone = phoneErrors;
  if (!termsAccepted) {
    errors.termsAccepted = ["You must agree to the Terms and Conditions."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Full name and email come from the authenticated Google identity itself,
  // never from client-submitted form fields — Google already vouched for
  // these, so re-deriving them server-side avoids trusting anything a
  // tampered client could send instead.
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email ??
    "";

  const admin = getSupabaseServerClient();
  const { error: profileError } = await admin.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    phone,
  });
  if (profileError) {
    return { message: "Could not save your profile. Please try again." };
  }

  redirect("/");
}
