"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type { FocusEvent } from "react";
import { signInAction, type FormState } from "@/app/actions/auth";
import { useT } from "@/lib/i18n";
import { TurnstileWidget } from "./TurnstileWidget";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { EgovSignInButton } from "./EgovSignInButton";

const inputCls =
  "rounded-egov border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue";

/** Chrome (and others) ignore autoComplete="off" on sign-in fields and autofill saved credentials anyway -- a field can't be autofilled while readOnly, so drop it the moment the citizen actually focuses in. */
function dropReadOnlyOnFocus(e: FocusEvent<HTMLInputElement>) {
  e.currentTarget.removeAttribute("readonly");
}

export function LoginForm({ confirmNotice }: { confirmNotice?: boolean }) {
  const t = useT();
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    // Browsers can restore this page from bfcache on back/forward
    // navigation without re-running component logic, which would otherwise
    // leave a previously typed email/password sitting in these (uncontrolled)
    // fields -- explicitly clear them whenever that happens.
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) formRef.current?.reset();
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4" autoComplete="off">
      {confirmNotice && (
        <p className="rounded-egov bg-egov-blue-050 px-3 py-2.5 text-sm text-egov-blue-dark">
          {t("Account created. Check your email to confirm your account, then sign in.")}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-semibold text-foreground">
          {t("Email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          readOnly
          onFocus={dropReadOnlyOnFocus}
          className={inputCls}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-semibold text-foreground">
          {t("Password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="off"
          readOnly
          onFocus={dropReadOnlyOnFocus}
          className={inputCls}
        />
      </div>

      <TurnstileWidget />

      {state?.message && (
        <p className="rounded-egov bg-red-50 px-3 py-2 text-sm text-egov-danger">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue disabled:opacity-60"
      >
        {pending ? t("Signing in…") : t("Sign In")}
      </button>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        <span>{t("or")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleSignInButton />
      <EgovSignInButton />

      <p className="text-center text-sm text-muted">
        {t("Don't have an account?")}{" "}
        <Link href="/register" className="font-semibold text-egov-blue">
          {t("Register")}
        </Link>
      </p>
    </form>
  );
}
