import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark, SocialLinks } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | MedEuAi" },
      {
        name: "description",
        content:
          "Learn how MedEuAi collects, uses, protects, and manages your information.",
      },
      { property: "og:title", content: "Privacy Policy | MedEuAi" },
      {
        property: "og:description",
        content:
          "Learn how MedEuAi collects, uses, protects, and manages your information.",
      },
      { property: "og:url", content: "https://medeuai.in/privacy-policy" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Privacy Policy | MedEuAi" },
      {
        name: "twitter:description",
        content:
          "Learn how MedEuAi collects, uses, protects, and manages your information.",
      },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://medeuai.in/privacy-policy" },
    ],
  }),
  component: PrivacyPolicyPage,
});

const LAST_UPDATED = "August 26, 2026";

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            How MedEuAi collects, uses, protects, and manages your information.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <article className="prose prose-sm max-w-none text-foreground sm:prose-base">
          <PolicySection title="Operator">
            <p>
              This Privacy Policy describes how <strong>MedEuAi</strong> handles personal
              information for users of the MedEuAi exam-preparation platform and related
              services. MedEuAi is an early-stage platform operated by its founder and
              team; it is not represented as an incorporated company or registered entity.
            </p>
          </PolicySection>

          <PolicySection title="1. Account Information">
            <p>
              When you create or sign in to a MedEuAi account, we collect the information
              needed to identify and authenticate you. If you use Google sign-in, Google may
              make available your name, email address, account/authentication identifier, and
              basic profile information where applicable. We do not collect or store a phone
              number as part of account creation.
            </p>
            <p>
              Google authentication is provided through third-party authentication infrastructure.
              Your use of Google sign-in is also subject to Google's own terms and privacy
              practices.
            </p>
          </PolicySection>

          <PolicySection title="2. Learning & Preparation Information">
            <p>
              To personalise your preparation, we collect learning-related information you
              provide or generate while using MedEuAi. This may include:
            </p>
            <ul className="list-disc pl-5">
              <li>Target examination or category (for example, SSC, Railway, Banking, WBCS, WBPSC, Police, or Other)</li>
              <li>Subjects, topics, goals and study preferences</li>
              <li>Progress, including attempted, correct and incorrect questions</li>
              <li>Scores, results and performance summaries</li>
              <li>Study activity, topics engaged with and time spent where tracked</li>
              <li>Streaks and other personalisation data used to shape your learning experience</li>
            </ul>
          </PolicySection>

          <PolicySection title="3. AI Interaction Data">
            <p>
              When you use the AI Teacher or other AI-assisted features, the prompts or
              questions you submit and any relevant conversation context may be processed to
              generate answers, preserve context, provide explanations, personalise your
              learning, and improve service functionality.
            </p>
            <p>
              MedEuAi does not train its own AI models. We may use third-party AI providers
              to generate responses. The specific provider or model can change over time. Only
              the data reasonably necessary to generate a response is transmitted to the
              relevant provider. MedEuAi aims to use appropriate configurations and providers
              that are consistent with our privacy commitments.
            </p>
          </PolicySection>

          <PolicySection title="4. Payment Information">
            <p>
              MedEuAi uses manual UPI-based payment verification for subscriptions. When you
              make a payment, we may collect:
            </p>
            <ul className="list-disc pl-5">
              <li>UTR or transaction reference number</li>
              <li>Payment-confirmation information, including screenshots you upload as proof</li>
              <li>Status of the payment request and any notes needed to resolve disputes</li>
            </ul>
            <p>
              This information is used only for payment verification, subscription activation,
              customer support, fraud prevention, and related administration. MedEuAi does
              not store card numbers, CVV, bank passwords, or other financial credentials.
            </p>
          </PolicySection>

          <PolicySection title="5. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-5">
              <li>Create, maintain and authenticate your account</li>
              <li>Provide the AI Teacher and generate answers to your study questions</li>
              <li>Personalise learning content, preferences and recommendations</li>
              <li>Track progress, practice and question activity, scores, performance, study history and streaks</li>
              <li>Process and verify subscription payments and manage access to paid features</li>
              <li>Respond to support requests and communicate with you about your account</li>
              <li>Detect abuse, protect security and maintain platform integrity</li>
              <li>Improve reliability and functionality of the service</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
            <p>
              MedEuAi does not sell personal information. We do not intentionally use
              student personal or learning data for targeted advertising.
            </p>
          </PolicySection>

          <PolicySection title="6. AI & Other Service Providers">
            <p>
              We rely on selected service providers to operate MedEuAi. These may include
              providers for hosting, database, authentication, AI processing, payment
              verification and support, and general technical infrastructure. We share
              information with these providers only as reasonably necessary to deliver the
              service, and we do not share data with advertisers or data brokers.
            </p>
            <p>
              The current application infrastructure is associated with Lovable for application
              development and hosting, and Supabase for backend database and authentication
              services. These arrangements may evolve as the platform grows.
            </p>
          </PolicySection>

          <PolicySection title="7. Storage & Security">
            <p>
              We apply reasonable technical and organisational measures to protect your
              information from unauthorised access, loss or misuse. However, no online service
              can guarantee absolute security. You use MedEuAi with the understanding that
              security measures have practical limits.
            </p>
          </PolicySection>

          <PolicySection title="8. Retention">
            <p>
              We retain personal information for as long as reasonably necessary to provide the
              service, support learning history and account functions, fulfil legal obligations,
              resolve disputes, enforce agreements, and maintain legitimate records. We aim not
              to retain information longer than necessary for these purposes.
            </p>
          </PolicySection>

          <PolicySection title="9. Your Choices & Deletion">
            <p>
              MedEuAi does not currently offer self-service account deletion. If you wish to
              request deletion of your account and associated data, please email us at{" "}
              <a href="mailto:hello.medeu.ai@gmail.com" className="text-primary hover:underline">
                hello.medeu.ai@gmail.com
              </a>{" "}
              with enough information to identify your account (such as the email address used
              to sign in). We will process genuine requests in a reasonable timeframe.
            </p>
          </PolicySection>

          <PolicySection title="10. Children & Minors">
            <p>
              MedEuAi is an educational platform designed for government-exam aspirants. If you
              are a minor, you should use MedEuAi only with the involvement and consent of a
              parent or guardian. We do not knowingly collect personal information from children
              without appropriate consent, and we encourage parents and guardians to supervise
              use of the platform.
            </p>
          </PolicySection>

          <PolicySection title="11. Policy Updates">
            <p>
              This Privacy Policy may be updated from time to time to reflect changes in our
              practices or services. We will update the "Last updated" date at the top of this
              page when material changes are made. Continued use of MedEuAi after any update
              means you accept the revised policy.
            </p>
          </PolicySection>

          <PolicySection title="12. Contact">
            <p>
              If you have questions, concerns or requests about this Privacy Policy or how your
              information is handled, please contact us at{" "}
              <a href="mailto:hello.medeu.ai@gmail.com" className="text-primary hover:underline">
                hello.medeu.ai@gmail.com
              </a>
              .
            </p>
          </PolicySection>
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
              <span>© {new Date().getFullYear()} MedEuAi</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 border-b border-border/60 pb-8 last:mb-0 last:border-b-0 last:pb-0">
      <h2 className="mb-3 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}
