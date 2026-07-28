import { redirect } from "next/navigation";
import { EhakbangHeader } from "@/components/layout/EhakbangHeader";
import { createClient } from "@/lib/supabase/server-client";
import { signOutAction } from "@/app/actions/auth";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <EhakbangHeader backHref="/" />
      <main className="flex flex-1 flex-col gap-4 px-5 py-5">
        <h1 className="text-xl font-bold text-egov-navy">My Account</h1>

        <div className="flex flex-col gap-3 rounded-egov border border-border bg-surface p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Full Name</p>
            <p className="text-sm text-foreground">{profile?.full_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Email</p>
            <p className="text-sm text-foreground">{user.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</p>
            <p className="text-sm text-foreground">{profile?.phone ?? "—"}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            className="min-h-12 w-full rounded-egov border border-border bg-surface px-5 py-3 font-semibold text-egov-danger transition-colors hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
          >
            Sign Out
          </button>
        </form>
      </main>
    </>
  );
}
