"use client";

import Link from "next/link";
import { useActionState } from "react";
import { completeOAuthProfileAction, type FormState } from "@/app/actions/auth";
import { useT } from "@/lib/i18n";

const inputCls =
  "rounded-egov border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue";
const readOnlyCls =
  "rounded-egov border border-border bg-surface-muted px-3 py-2.5 text-sm text-muted";

function FieldErrorList({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <ul className="text-xs text-egov-danger">
      {errors.map((e) => (
        <li key={e}>{e}</li>
      ))}
    </ul>
  );
}

/**
 * Shown after a first-time Google sign-in (session exists, no profiles row
 * yet). Full name and email already came from Google — displayed read-only
 * — so the only thing left to collect is phone number + terms acceptance.
 * No password fields: Google OAuth already authenticated this person.
 */
export function CompleteProfileForm({ fullName, email }: { fullName: string; email: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(
    completeOAuthProfileAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-sm text-muted">
        {t("You're signed in with Google. Just one more step to finish setting up your account.")}
      </p>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{t("Full Name")}</span>
        <span className={readOnlyCls}>{fullName}</span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground">{t("Email")}</span>
        <span className={readOnlyCls}>{email}</span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="phone" className="text-sm font-semibold text-foreground">
          {t("Phone Number")}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          placeholder="09171234567"
          className={inputCls}
        />
        <FieldErrorList errors={state?.errors?.phone} />
      </div>

      <div className="flex items-start gap-2">
        <input
          id="termsAccepted"
          name="termsAccepted"
          type="checkbox"
          required
          className="mt-0.5 h-5 w-5 shrink-0 accent-egov-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue"
        />
        <label htmlFor="termsAccepted" className="text-sm text-foreground">
          {t("I have read and agree to the")}{" "}
          <Link href="/terms" className="font-semibold text-egov-blue" target="_blank">
            {t("Terms and Conditions")}
          </Link>
        </label>
      </div>
      <FieldErrorList errors={state?.errors?.termsAccepted} />

      {state?.message && (
        <p className="rounded-egov bg-red-50 px-3 py-2 text-sm text-egov-danger">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-60"
      >
        {pending ? t("Saving…") : t("Finish Setting Up")}
      </button>
    </form>
  );
}
