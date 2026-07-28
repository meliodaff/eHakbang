import { redirect } from "next/navigation";
import { EhakbangLogo } from "@/components/brand/Logo";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { createClient } from "@/lib/supabase/server-client";

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      redirect("/");
    }

    // First-time Google sign-in: name/email already came from Google, no
    // password to set — only phone number + terms are left to collect.
    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      "";
    const email = user.email ?? "";

    return (
      <main className="flex flex-1 flex-col justify-center gap-8 px-6 py-10">
        <div className="flex flex-col items-center gap-2">
          <EhakbangLogo className="scale-125" />
          <p className="text-sm text-muted">Complete your profile</p>
        </div>
        <RegisterForm defaultFullName={fullName} defaultEmail={email} completingOAuth />
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col items-center gap-2">
        <EhakbangLogo className="scale-125" />
        <p className="text-sm text-muted">Create your account</p>
      </div>
      <RegisterForm />
    </main>
  );
}
