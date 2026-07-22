import "server-only";

/**
 * Server-only client for the eMessage SMS API (see eGovAI-apidoc.md §8).
 * Credentials never reach the browser -- callers are Next.js API routes.
 */

interface EmessageConfig {
  baseUrl: string;
  token: string;
}

function getConfig(): EmessageConfig {
  const baseUrl = process.env.EMESSAGE_BASE_URL;
  const token = process.env.EMESSAGE_API_TOKEN;
  if (!baseUrl || !token) {
    throw new Error("eMessage is not configured (EMESSAGE_BASE_URL / EMESSAGE_API_TOKEN)");
  }
  return { baseUrl, token };
}

export function isEmessageConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/** Send an SMS via POST {base_url}/messaging/v1/sms/push. */
export async function pushSms(number: string, message: string): Promise<void> {
  const { baseUrl, token } = getConfig();

  const response = await fetch(`${baseUrl}/messaging/v1/sms/push`, {
    method: "POST",
    headers: {
      "X-EMESSAGE-Auth": token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ number, message }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eMessage pushSms failed (${response.status}): ${text}`);
  }
}
