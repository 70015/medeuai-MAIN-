import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark, SocialLinks } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";

const DESCRIPTION =
  "The terms and conditions that govern your use of MedEuAi, the AI-powered exam preparation platform.";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | MedEuAi" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Terms & Conditions | MedEuAi" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:url", content: "https://medeuai.in/terms-and-conditions" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Terms & Conditions | MedEuAi" },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: "https://medeuai.in/terms-and-conditions" }],
  }),
  component: TermsPage,
});

const LAST_UPDATED = "September 2, 2026";

function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Please read these terms carefully before using MedEuAi.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>
        </header>

        <article className="prose prose-sm max-w-none text-foreground sm:prose-base">
          <Section title="1. Introduction">
            <p>
              These Terms &amp; Conditions govern your access to and use of MedEuAi, an
              AI-assisted preparation platform for Indian government examinations, including
              our website, web application, Android application, and related services
              (together, the "Service"). By using the Service you agree to these terms.
            </p>
          </Section>

          <Section title="2. About MedEuAi">
            <p>
              MedEuAi is an early-stage educational platform operated by its founder and team.
              It is not represented as an incorporated company or registered entity. MedEuAi is
              not affiliated with, endorsed by, or connected to any government body, recruitment
              board, or examination authority.
            </p>
          </Section>

          <Section title="3. Acceptance of Terms">
            <p>
              By creating an account, ticking the agreement checkbox during registration, or
              otherwise using the Service, you confirm that you have read, understood, and
              agreed to these Terms &amp; Conditions and to our Privacy Policy. If you do not
              agree, you must not use the Service.
            </p>
          </Section>

          <Section title="4. Eligibility">
            <p>
              You may use the Service only if you are able to form a binding agreement under
              applicable law. If you are a minor, you may use MedEuAi only with the involvement
              and consent of a parent or guardian, who accepts these terms on your behalf.
            </p>
          </Section>

          <Section title="5. Account Registration">
            <p>
              You must provide accurate information when creating an account and keep it up to
              date. You may register with an email address and password or with Google sign-in.
              One account is intended for one individual user.
            </p>
          </Section>

          <Section title="6. Account Security">
            <p>
              You are responsible for maintaining the confidentiality of your login credentials
              and for all activity that occurs under your account. Notify us promptly at
              hello.medeu.ai@gmail.com if you believe your account has been accessed without
              your permission.
            </p>
          </Section>

          <Section title="7. Permitted Use">
            <p>
              MedEuAi is provided for your personal, non-commercial study and preparation. You
              may use the AI Teacher, practice questions, mock tests, analytics, and articles
              for your own learning.
            </p>
          </Section>

          <Section title="8. Prohibited Conduct">
            <p>You agree not to:</p>
            <ul className="list-disc pl-5">
              <li>Share, resell, or transfer your account or subscription access</li>
              <li>Scrape, bulk-download, copy, or redistribute platform content</li>
              <li>Attempt to bypass usage limits, paywalls, or security controls</li>
              <li>Upload unlawful, abusive, misleading, or infringing content</li>
              <li>Interfere with the operation, integrity, or availability of the Service</li>
              <li>Use the Service for any unlawful or fraudulent purpose</li>
            </ul>
          </Section>

          <Section title="9. AI-Generated Content">
            <p>
              Answers, explanations, summaries, and questions may be generated with the help of
              third-party AI models. AI output can be incomplete, outdated, or incorrect. You
              must independently verify important information against official sources and
              official syllabi before relying on it.
            </p>
          </Section>

          <Section title="10. No Guarantee of Results">
            <p>
              MedEuAi is a preparation aid. We do not guarantee selection, qualification, ranks,
              scores, or any specific examination outcome. Your results depend on your own
              effort and factors outside our control.
            </p>
          </Section>

          <Section title="11. Educational Content Accuracy">
            <p>
              We take reasonable care with questions, solutions, exam patterns, and study
              material, but content may contain errors or may not reflect the latest official
              notification. Official notifications published by the relevant authority always
              prevail.
            </p>
          </Section>

          <Section title="12. Subscriptions and Plans">
            <p>
              Some features are available free of charge with usage limits, and some require a
              paid plan. Plan features, prices, durations, and limits are shown in the app and
              may change. Paid access is valid only for the plan period purchased.
            </p>
          </Section>

          <Section title="13. Payments">
            <p>
              Subscription payments are collected through manual UPI verification. You make the
              payment to the UPI details shown on the payment page and submit the UTR or
              transaction reference along with any requested proof of payment. MedEuAi does not
              collect or store card numbers, CVV, bank passwords, or other financial
              credentials.
            </p>
          </Section>

          <Section title="14. Payment Verification and Activation">
            <p>
              Paid access is activated only after your payment request is reviewed and approved.
              Verification is performed manually and may take some time. Incorrect, duplicate,
              unmatched, or unverifiable payment references may be rejected. Submitting false
              payment information may result in suspension of your account.
            </p>
          </Section>

          <Section title="15. Refunds and Cancellation">
            <p>
              Because access to digital content and AI features is granted immediately on
              activation, payments are generally non-refundable. If you were charged in error,
              paid twice for the same period, or your access was never activated, contact
              hello.medeu.ai@gmail.com and we will review your case in good faith.
            </p>
          </Section>

          <Section title="16. Promotional Codes">
            <p>
              Promotional and referral codes are offered at our discretion, may be limited in
              quantity or validity, cannot be exchanged for cash, and may be withdrawn or
              invalidated if we detect misuse or abuse.
            </p>
          </Section>

          <Section title="17. Fair Usage">
            <p>
              Free and paid plans are subject to fair-usage limits, including daily limits on AI
              Teacher messages and test attempts. We may apply rate limits or temporarily
              restrict features to protect service quality for all users.
            </p>
          </Section>

          <Section title="18. Intellectual Property">
            <p>
              The MedEuAi name, logo, design, interface, question banks, articles, and other
              platform content are owned by MedEuAi or its licensors and are protected by
              applicable law. You receive a limited, personal, revocable, non-transferable
              licence to use them for your own preparation only.
            </p>
          </Section>

          <Section title="19. User Content">
            <p>
              You retain ownership of the content you submit, such as questions you ask the AI
              Teacher, notes, and payment proofs. You grant MedEuAi permission to store and
              process that content as needed to operate, secure, support, and improve the
              Service, as described in the Privacy Policy.
            </p>
          </Section>

          <Section title="20. Service Availability">
            <p>
              We aim to keep MedEuAi available and reliable, but the Service is provided on an
              "as available" basis. Access may be interrupted, suspended, delayed, or limited
              because of maintenance, updates, technical faults, network or hosting issues,
              third-party provider outages including AI providers, security incidents, or events
              beyond our reasonable control. We do not guarantee uninterrupted or error-free
              availability, and features may be added, changed, restricted, or discontinued at
              any time without prior notice.
            </p>
          </Section>

          <Section title="21. Third-Party Services">
            <p>
              MedEuAi relies on third-party providers for hosting, authentication, database,
              AI processing, email delivery, and app distribution. Your use of those services
              through MedEuAi is also subject to their own terms and policies.
            </p>
          </Section>

          <Section title="22. Mobile Application">
            <p>
              The MedEuAi Android application provides access to the same platform. App usage
              may require internet connectivity, and updates may be required for continued
              functionality. Distribution through any app store is additionally subject to that
              store's terms.
            </p>
          </Section>

          <Section title="23. Privacy">
            <p>
              Your use of the Service is also governed by our{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              , which explains what information we collect and how we use and protect it.
            </p>
          </Section>

          <Section title="24. Suspension and Termination">
            <p>
              We may suspend or terminate your access if you breach these terms, misuse the
              Service, submit fraudulent payment information, or create risk for other users or
              for the platform. You may stop using the Service at any time and may request
              account deletion by email.
            </p>
          </Section>

          <Section title="25. Disclaimer of Warranties">
            <p>
              To the maximum extent permitted by law, the Service is provided "as is" and "as
              available" without warranties of any kind, whether express or implied, including
              warranties of accuracy, merchantability, fitness for a particular purpose, or
              non-infringement.
            </p>
          </Section>

          <Section title="26. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, MedEuAi and its founder, team, and
              providers will not be liable for indirect, incidental, special, consequential, or
              exemplary losses, including lost opportunities, lost exam attempts, lost data, or
              lost profits. Our total liability for any claim relating to the Service will not
              exceed the amount you paid to MedEuAi in the three months before the claim arose.
            </p>
          </Section>

          <Section title="27. Indemnity">
            <p>
              You agree to indemnify and hold harmless MedEuAi, its founder, and its team from
              claims, losses, and expenses arising out of your misuse of the Service or your
              breach of these terms or of applicable law.
            </p>
          </Section>

          <Section title="28. Changes to These Terms">
            <p>
              We may update these Terms &amp; Conditions from time to time. The "Last updated"
              date above will reflect material changes. Continued use of the Service after an
              update means you accept the revised terms.
            </p>
          </Section>

          <Section title="29. Governing Law and Jurisdiction">
            <p>
              These terms are governed by the laws of India. Subject to applicable law, courts
              having jurisdiction in West Bengal, India will have exclusive jurisdiction over
              any dispute relating to the Service.
            </p>
          </Section>

          <Section title="30. Contact and Support">
            <p>
              For questions, payment issues, account requests, or support, contact us at:
            </p>
            <ul className="list-none pl-0">
              <li>
                <strong>MedEuAi</strong>
              </li>
              <li>
                Email:{" "}
                <a
                  href="mailto:hello.medeu.ai@gmail.com"
                  className="text-primary hover:underline"
                >
                  hello.medeu.ai@gmail.com
                </a>
              </li>
              <li>Tapan, South Dinajpur, West Bengal, India, 733127</li>
            </ul>
            <p className="mt-4 font-medium text-foreground">
              By creating an account or using MedEuAi, you acknowledge that you have read,
              understood, and accepted these Terms &amp; Conditions and the Privacy Policy.
            </p>
          </Section>
        </article>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow us
            </span>
            <SocialLinks />
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrandMark className="h-7 w-7" />
              <span>MedEuAi · Your Personal AI Teacher, 24/7.</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <Link to="/" className="hover:text-primary">
                Home
              </Link>
              <Link to="/about" className="hover:text-primary">
                About
              </Link>
              <Link to="/privacy-policy" className="hover:text-primary">
                Privacy Policy
              </Link>
              <Link to="/terms-and-conditions" className="hover:text-primary">
                Terms &amp; Conditions
              </Link>
              <span>© {new Date().getFullYear()} MedEuAi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 border-b border-border/60 pb-8 last:mb-0 last:border-b-0 last:pb-0">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
