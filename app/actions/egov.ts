"use server";

import { redirect } from "next/navigation";
import { completeEgovSignIn } from "@/lib/server/egov-session";

export type EgovFormState = { message?: string } | undefined;

/** Used by the /auth/egov/dev fallback form while EGOV_SSO_AUTHORIZE_URL isn't set. */
export async function completeEgovDevSignInAction(
  _prevState: EgovFormState,
  formData: FormData,
): Promise<EgovFormState> {
  const exchangeCode = String(formData.get("exchangeCode") ?? "").trim();
  if (!exchangeCode) {
    return { message: "Paste the exchange code from the eGov dashboard's test tool." };
  }

  const { error } = await completeEgovSignIn(exchangeCode);
  if (error) {
    return { message: error };
  }

  redirect("/");
}
