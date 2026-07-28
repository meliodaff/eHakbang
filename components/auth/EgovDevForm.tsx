"use client";

import { useActionState } from "react";
import { completeEgovDevSignInAction, type EgovFormState } from "@/app/actions/egov";

const inputCls =
  "rounded-egov border border-border bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-egov-blue";

export function EgovDevForm() {
  const [state, action, pending] = useActionState<EgovFormState, FormData>(
    completeEgovDevSignInAction,
    undefined,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="exchangeCode" className="text-sm font-semibold text-foreground">
          Exchange code
        </label>
        <input
          id="exchangeCode"
          name="exchangeCode"
          type="text"
          required
          placeholder="generated_exchange_code"
          className={inputCls}
        />
      </div>

      {state?.message && (
        <p className="rounded-egov bg-red-50 px-3 py-2 text-sm text-egov-danger">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-egov bg-egov-blue px-5 py-3 font-semibold text-white transition-colors hover:bg-egov-blue-dark disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in with test code"}
      </button>
    </form>
  );
}
