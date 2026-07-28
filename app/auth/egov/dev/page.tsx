import { EgovDevForm } from "@/components/auth/EgovDevForm";

export const metadata = {
  title: "eGov SSO (test) | eHakbang",
};

/**
 * Stand-in for the real eGov login redirect while EGOV_SSO_AUTHORIZE_URL is
 * unset. Mirrors this repo's existing app/(app)/dev/liveness-mock pattern:
 * a dev-only page that lets the rest of the integration (token exchange,
 * profile fetch, session bridging) be built and tested end to end. Generate
 * an exchange code from the eGov partner dashboard's "Generate an eGov
 * exchange code" tool (test account) and paste it below.
 */
export default function EgovDevPage() {
  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-background px-6 py-10">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <p className="w-fit rounded-full bg-egov-warning-bg px-3 py-1 text-xs font-semibold uppercase tracking-wide text-egov-warning">
            Test mode
          </p>
          <h1 className="text-xl font-bold text-egov-navy">eGov SSO (test)</h1>
          <p className="text-sm text-muted">
            No production eGov login URL is configured yet. Paste an exchange code generated from
            the eGov partner dashboard&apos;s test tool (test account) to sign in as that identity.
          </p>
        </div>
        <EgovDevForm />
      </div>
    </div>
  );
}
