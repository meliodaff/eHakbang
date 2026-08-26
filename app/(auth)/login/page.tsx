import { redirect } from "next/navigation";
import { EhakbangLogo } from "@/components/brand/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server-client";
import { egovSignInMessage } from "@/lib/server/egov-session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ confirm?: string; egov_error?: string; google_error?: string }>;
}) {
  const { confirm, egov_error: egovError, google_error: googleError } = await searchParams;

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
    redirect(profile ? "/" : "/register");
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col items-center gap-2">
        <EhakbangLogo className="scale-125" />
        <p className="text-sm text-muted">Sign in to continue</p>
      </div>
      {egovError && (
        <p className="rounded-egov bg-red-50 px-4 py-2.5 text-sm text-egov-danger">
          {egovSignInMessage(egovError === "1" ? undefined : egovError)}
        </p>
      )}
      {googleError === "1" && (
        <p className="rounded-egov bg-red-50 px-4 py-2.5 text-sm text-egov-danger">
          Could not sign in with Google. Please try again.
        </p>
      )}
      <LoginForm confirmNotice={confirm === "1"} />
    </main>
  );
}
