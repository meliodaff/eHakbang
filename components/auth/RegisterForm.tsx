"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUpAction, completeOAuthProfileAction, type FormState } from "@/app/actions/auth";
import { useT } from "@/lib/i18n";
import { TurnstileWidget } from "./TurnstileWidget";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { EgovSignInButton } from "./EgovSignInButton";

const inputCls =
  "rounded-egov border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue";
const lockedInputCls =
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
 * Registration form — same flow for everyone. For a plain email/password
 * sign-up, all fields are blank and posts to signUpAction. After a
 * first-time Google sign-in (no profiles row yet), the exact same form is
 * shown with fullName/email pre-filled from Google and locked (the server
 * action re-derives them from the authenticated session regardless of what
 * the client submits, so editing them wouldn't do anything) — password,
 * confirm password, Turnstile, and the Google/eGov buttons are hidden since
 * Google already authenticated this person, and it posts to
 * completeOAuthProfileAction instead.
 */
export function RegisterForm({
  defaultFullName,
  defaultEmail,
  completingOAuth = false,
}: {
  defaultFullName?: string;
  defaultEmail?: string;
  completingOAuth?: boolean;
}) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(
    completingOAuth ? completeOAuthProfileAction : signUpAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-semibold text-foreground">
          {t("Full Name")}
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          required
          autoComplete="name"
          defaultValue={defaultFullName}
          readOnly={completingOAuth}
          className={completingOAuth ? lockedInputCls : inputCls}
        />
        <FieldErrorList errors={state?.errors?.fullName} />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          {t("Email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={defaultEmail}
          readOnly={completingOAuth}
          className={completingOAuth ? lockedInputCls : inputCls}
        />
        <FieldErrorList errors={state?.errors?.email} />
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

      {!completingOAuth && (
        <>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-semibold text-foreground">
              {t("Password")}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            <FieldErrorList errors={state?.errors?.password} />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
              {t("Confirm Password")}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className={inputCls}
            />
            <FieldErrorList errors={state?.errors?.confirmPassword} />
          </div>

          <TurnstileWidget />
        </>
      )}

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
        {completingOAuth
          ? pending
            ? t("Saving…")
            : t("Finish Setting Up")
          : pending
            ? t("Creating account…")
            : t("Create Account")}
      </button>

      {!completingOAuth && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            <span>{t("or")}</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <GoogleSignInButton />
          <EgovSignInButton />

          <p className="text-center text-sm text-muted">
            {t("Already have an account?")}{" "}
            <Link href="/login" className="font-semibold text-egov-blue">
              {t("Sign In")}
            </Link>
          </p>
        </>
      )}
    </form>
  );
}
