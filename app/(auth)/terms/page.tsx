import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | eHakbang",
};

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-egov-navy">Terms and Conditions</h1>
        <p className="text-xs text-muted">Last updated: July 28, 2026</p>
      </div>

      <p className="rounded-egov bg-egov-blue-050 px-4 py-3 text-sm text-egov-blue-dark">
        Ang iyong personal na impormasyon ay pinoprotektahan alinsunod sa Data
        Privacy Act of 2012. Your personal information is handled in
        accordance with the Data Privacy Act of 2012 (Republic Act No. 10173)
        and its Implementing Rules and Regulations.
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">1. Introduction</h2>
        <p className="text-sm text-muted">
          This Terms and Conditions and Privacy Notice ("Notice") explains how
          eHakbang ("we," "us," "the app") collects, uses, stores, and
          protects your personal information when you create an account and
          use our AI-powered government journey planner. This Notice is
          written to comply with the Philippine Data Privacy Act of 2012 (RA
          10173) and its Implementing Rules and Regulations. By creating an
          account, you acknowledge that you have read and understood this
          Notice and consent to the collection and processing of your
          personal information as described here.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">2. Information We Collect</h2>
        <p className="text-sm text-muted">When you register for an account, we collect:</p>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>Your full name</li>
          <li>Your email address</li>
          <li>Your phone number</li>
          <li>
            Your password — this is never stored in plain text. It is hashed
            using industry-standard cryptographic hashing by our
            authentication provider (Supabase Auth) and we cannot read it.
          </li>
        </ul>
        <p className="text-sm text-muted">
          If you choose to sign in with Google, we instead receive your name,
          email address, and profile photo directly from Google, with your
          consent, and never receive or store your Google password.
        </p>
        <p className="text-sm text-muted">
          We also use Cloudflare Turnstile, a bot-verification service, which
          may process limited technical signals (such as your browser and
          network characteristics) solely to confirm you are a human user
          completing the form — it does not use this information for
          advertising or tracking.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">
          3. eGov SSO
        </h2>
        <p className="text-sm text-muted">
          If you choose to sign in with <strong>eGov SSO</strong>, you are authenticating with your
          existing government-issued digital identity. During the one-time sign-in exchange, eGov's
          response includes your full legal name, email, and mobile number, which we use the same
          way as a normal registration — <strong>we store only your name and phone number</strong>{" "}
          in your account profile, identical to what email/password registration collects.
        </p>
        <p className="text-sm text-muted">
          eGov's response may also include additional details such as your address, national ID, and
          passport information. <strong>We do not store any of this</strong> — it is received only
          transiently to complete the sign-in exchange and is discarded immediately afterward, never
          written to our database.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">4. How We Use Your Information</h2>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>To create and secure your account, and to let you sign in</li>
          <li>
            To personalize the AI-generated checklist of government steps
            relevant to your life event
          </li>
          <li>To send you service-related notices about your account or applications</li>
          <li>To detect, prevent, and respond to fraud, abuse, or unauthorized access</li>
        </ul>
        <p className="text-sm text-muted">
          We do not sell your personal information, and we do not use it for
          third-party advertising.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">5. Legal Basis for Processing</h2>
        <p className="text-sm text-muted">
          Under Sections 12 and 13 of RA 10173, we process your personal
          information on the following legal bases:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>
            <strong>Consent</strong> — you affirmatively agree to this Notice
            when you check the "I agree to the Terms and Conditions" box
            during registration.
          </li>
          <li>
            <strong>Legitimate interest</strong> — processing your account
            information is necessary to provide the government-journey-
            planning service you requested.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">6. Data Sharing and Processors</h2>
        <p className="text-sm text-muted">
          We share your information only with service providers who process
          it on our behalf and under our instructions (personal information
          processors), never as independent owners of your data:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>
            <strong>Supabase</strong> — hosts our authentication system and
            database.
          </li>
          <li>
            <strong>Cloudflare</strong> (Turnstile) — verifies you are human
            during sign-in and registration; does not receive your account
            details.
          </li>
          <li>
            <strong>Google</strong> — only if you choose "Continue with
            Google," to authenticate your identity with your consent.
          </li>
          <li>
            <strong>eGov</strong> (the Philippine government's SSO service) —
            only if you choose "Continue with eGov," to verify your
            government-issued identity, as described in Section 3, with your
            consent.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">7. Data Retention</h2>
        <p className="text-sm text-muted">
          We retain your account information for as long as your account
          remains active. If you request account deletion, we will delete or
          anonymize your personal information, except where retention is
          required by law.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">8. Your Rights Under RA 10173</h2>
        <p className="text-sm text-muted">As a data subject, you have the right to:</p>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>Be informed that your personal information is being processed</li>
          <li>Access your personal information that we hold</li>
          <li>Object to processing of your personal information</li>
          <li>Request erasure or blocking of your personal information</li>
          <li>Request correction (rectification) of inaccurate information</li>
          <li>Data portability — receive a copy of your data in an electronic format</li>
          <li>Be indemnified for damages from unlawful processing</li>
          <li>
            File a complaint with the{" "}
            <strong>National Privacy Commission (NPC)</strong> at{" "}
            <span className="font-semibold">privacy.gov.ph</span>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">9. Security Measures</h2>
        <ul className="list-disc pl-5 text-sm text-muted">
          <li>Passwords are hashed, never stored or transmitted in plain text</li>
          <li>All data in transit is encrypted (HTTPS/TLS)</li>
          <li>Registration and login are protected against automated bot abuse via Cloudflare Turnstile</li>
        </ul>
        <p className="rounded-egov bg-egov-warning-bg px-4 py-3 text-sm text-egov-warning">
          Transparency note: this app is under active development. Database-
          level row access controls (Row Level Security) for account profile
          data are still being finalized and are not yet fully in place. We
          are disclosing this candidly rather than hiding it, and it will be
          completed before any production launch.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-foreground">10. Contact Us / Data Protection Officer</h2>
        <p className="text-sm text-muted">
          For questions about this Notice or to exercise your rights under RA
          10173, contact our Data Protection Officer at{" "}
          <span className="font-semibold">dpo@ehakbang.example</span>{" "}
          (placeholder contact, pending formal DPO designation).
        </p>
      </section>

      <p className="mt-2 text-center text-sm">
        <Link href="/register" className="font-semibold text-egov-blue">
          Back to Registration
        </Link>
      </p>
    </main>
  );
}
