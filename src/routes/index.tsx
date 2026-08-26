import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Languages,
  Lightbulb,
  ListChecks,
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-logo";
import { SiteHeader } from "@/components/site-header";
import { isAdminHost } from "@/lib/host";
import { isNativeApp } from "@/lib/native-app";
import {
  APK_MIN_ANDROID,
  APK_SIZE,
  APK_URL,
  APK_VERSION,
  apkAvailable,
} from "@/lib/app-download";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MedEu.Ai — Your Personal AI Teacher, 24/7" },
      {
        name: "description",
        content:
          "Learn smarter with a personal AI teacher, unlimited mock tests, previous-year papers and performance analysis for SSC, Railway, Banking, WBCS and WBPSC.",
      },
      { property: "og:title", content: "MedEu.Ai — Your Personal AI Teacher" },
      {
        property: "og:description",
        content:
          "Learn smarter. Understand better. Prepare with MedEu.Ai — AI teaching plus exam practice in three languages.",
      },
      { property: "og:url", content: "https://medeu-ai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://medeu-ai.lovable.app/" }],
  }),
  component: LandingPage,
});

const stats = [
  { k: "50K+", v: "Questions" },
  { k: "8+", v: "Major Exams" },
  { k: "24/7", v: "AI Teacher" },
  { k: "3", v: "Languages" },
];

const aiCapabilities = [
  {
    icon: MessageSquare,
    title: "Ask any question",
    desc: "Type a doubt in English, Hindi or Bengali and get a clear, exam-focused answer in seconds.",
  },
  {
    icon: Lightbulb,
    title: "Explain difficult concepts",
    desc: "Complex topics broken into simple language, with examples built for your exam syllabus.",
  },
  {
    icon: ListChecks,
    title: "Solve questions step by step",
    desc: "Every step of a numerical or reasoning problem shown in order, never just the final answer.",
  },
  {
    icon: FileText,
    title: "Generate practice instantly",
    desc: "Ask for more questions on any topic and practise them right away at your level.",
  },
  {
    icon: Target,
    title: "Personalised guidance",
    desc: "Study plans, revision priorities and daily targets shaped by your own performance.",
  },
];

const practice = [
  {
    icon: BookOpen,
    title: "Unlimited mock tests",
    desc: "Full-length, sectional and topic-wise tests with a real exam timer and instant scoring.",
  },
  {
    icon: FileText,
    title: "Previous-year papers",
    desc: "Authentic PYQs organised exam by exam, so you practise exactly what gets asked.",
  },
  {
    icon: BarChart3,
    title: "Performance analysis",
    desc: "Accuracy, speed, topic strength and percentile after every single attempt.",
  },
  {
    icon: Target,
    title: "Weak-topic practice",
    desc: "The topics you keep losing marks on are turned into focused practice sets automatically.",
  },
];

const exams = [
  { code: "SSC", desc: "CGL, CHSL, MTS" },
  { code: "Railway", desc: "RRB NTPC, Group D" },
  { code: "Banking", desc: "IBPS, SBI PO & Clerk" },
  { code: "WBCS", desc: "West Bengal Civil Service" },
  { code: "WBPSC", desc: "Public Service Commission" },
  { code: "Police", desc: "WBP, Kolkata Police" },
  { code: "Other", desc: "State & custom test series" },
];

const steps = [
  {
    n: "01",
    title: "Learn",
    desc: "Start with your AI teacher. Ask doubts, understand concepts and build a real foundation before you test yourself.",
  },
  {
    n: "02",
    title: "Practice",
    desc: "Attempt mock tests and previous-year papers under exam conditions, with unlimited attempts on every topic.",
  },
  {
    n: "03",
    title: "Improve",
    desc: "Review your analysis, fix weak topics with targeted practice and watch your accuracy climb week after week.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAdminHost()) {
      navigate({ to: "/admin", replace: true });
      return;
    }
    // Installed Android app opens the app home, not the marketing page.
    if (isNativeApp()) navigate({ to: "/dashboard", replace: true });
  }, [navigate]);
  if (isAdminHost()) return null;


  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* ---------------- HERO ---------------- */}
        <section className="border-b border-border bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-16 sm:py-20 lg:py-24">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="brand-eyebrow">
                  <Sparkles className="h-3.5 w-3.5" />
                  Your Personal AI Teacher, 24/7
                </span>
                <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                  Your Personal
                  <br />
                  <span className="text-primary">AI Teacher.</span>
                </h1>
                <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
                  Learn smarter. Understand better. Prepare with MedEu.Ai.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/auth" search={{ mode: "signup" }}>
                      Start Learning Free <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <a href="#practice">Explore Practice</a>
                  </Button>
                </div>
                <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Free to start
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> No credit card
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Languages className="h-3.5 w-3.5 text-primary" /> English · हिन्दी · বাংলা
                  </span>
                </p>
              </div>

              {/* AI Teacher interface preview */}
              <div className="lg:pl-4">
                <TeacherPreview />
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- BRAND STATISTICS ---------------- */}
        <section className="ink-section">
          <div className="container mx-auto max-w-6xl px-4 py-12 sm:py-14">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.v} className="text-center">
                  <dt className="text-3xl font-extrabold tracking-tight sm:text-4xl">{s.k}</dt>
                  <dd className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                    {s.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ---------------- AI TEACHER ---------------- */}
        <section id="ai-teacher" className="border-b border-border bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <div className="max-w-2xl">
              <span className="brand-eyebrow">
                <Brain className="h-3.5 w-3.5" />
                The AI Teacher
              </span>
              <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                A teacher who never runs out of patience.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                MedEu.Ai teaches the way a good tutor does — it listens to your doubt, explains it in
                your language, checks whether you understood, and gives you practice until it sticks.
              </p>
            </div>

            <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
              <ul className="divide-y divide-border border-y border-border">
                {aiCapabilities.map((c) => (
                  <li key={c.title} className="flex gap-4 py-5">
                    <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-primary">
                      <c.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-base font-bold">{c.title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="lg:pl-2">
                <ChatPreview />
                <div className="mt-6">
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <Link to="/auth" search={{ mode: "signup" }}>
                      Ask your first question <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- PRACTICE ---------------- */}
        <section id="practice" className="border-b border-border hero-bg">
          <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <div className="max-w-2xl">
              <span className="brand-eyebrow bg-background">
                <ListChecks className="h-3.5 w-3.5" />
                Practice
              </span>
              <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Practice until the exam feels easy.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Every attempt is timed, scored and analysed — so practice actually changes your
                result instead of just filling time.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {practice.map((p) => (
                <div key={p.title} className="brand-card bg-background p-6 sm:p-7">
                  <span className="grid h-10 w-10 place-items-center rounded-md bg-secondary text-primary">
                    <p.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-bold">{p.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- EXAMS ---------------- */}
        <section id="exams" className="border-b border-border bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="brand-eyebrow">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Exams
                </span>
                <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Built for the exams you're preparing for.
                </h2>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Browse test series
                </Link>
              </Button>
            </div>

            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {exams.map((e) => (
                <div key={e.code} className="bg-background p-6 transition-colors hover:bg-secondary">
                  <div className="text-lg font-bold tracking-tight">{e.code}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{e.desc}</div>
                </div>
              ))}
              <div className="hidden bg-secondary p-6 lg:block">
                <div className="text-sm font-semibold text-accent-foreground">
                  Syllabus-aligned papers
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Every paper follows the official pattern and marking scheme.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- HOW IT WORKS ---------------- */}
        <section id="how-it-works" className="border-b border-border bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <div className="max-w-2xl">
              <span className="brand-eyebrow">How it works</span>
              <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                Three steps, repeated well.
              </h2>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="bg-background p-7 sm:p-8">
                  <div className="text-sm font-extrabold tracking-[0.18em] text-primary">{s.n}</div>
                  <h3 className="mt-4 text-xl font-bold tracking-tight">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- ANDROID APP ---------------- */}
        <section id="android-app" className="border-b border-border bg-background">
          <div className="container mx-auto max-w-6xl px-4 py-20 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="brand-eyebrow">Android app</span>
                <h2 className="mt-5 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Carry your AI teacher in your pocket.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                  The MedEu.Ai Android app gives you the full platform — AI Teacher, mock tests,
                  previous-year papers and analytics — in a fullscreen, distraction-free app. Same
                  account, same progress, nothing to re-learn.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  {apkAvailable ? (
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <a href={APK_URL} download>
                        <Download className="mr-1.5 h-4 w-4" /> Download APK ({APK_SIZE})
                      </a>
                    </Button>
                  ) : (
                    <Button size="lg" disabled className="w-full sm:w-auto">
                      <Download className="mr-1.5 h-4 w-4" /> APK coming soon
                    </Button>
                  )}
                  <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                    <Link to="/auth" search={{ mode: "signup" }}>Use in browser instead</Link>
                  </Button>
                </div>

                <p className="mt-4 text-xs text-muted-foreground">
                  Version {APK_VERSION} · {APK_MIN_ANDROID} · Direct download, not from the Play
                  Store yet. iOS is not available at the moment.
                </p>
              </div>

              <div className="rounded-lg border border-border bg-secondary/40 p-7 sm:p-8">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-bold tracking-tight">How to install</h3>
                </div>
                <ol className="mt-5 space-y-4">
                  {[
                    "Tap Download APK above and wait for the file to finish downloading.",
                    "Chrome may warn that this file type can harm your device — that is the standard warning for every APK downloaded outside the Play Store. Choose Download anyway.",
                    "Open the file. Android will ask permission to install unknown apps — allow it for your browser or Files app.",
                    "Tap Install, then Open. Sign in with your existing MedEu.Ai account.",
                  ].map((t, i) => (
                    <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ol>
                <div className="mt-6 flex items-start gap-2 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Only download the APK from this page. Files shared on other sites or groups are
                    not published by us and may be unsafe.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------- FINAL CTA ---------------- */}

        <section className="ink-section">
          <div className="container mx-auto max-w-4xl px-4 py-20 text-center sm:py-24">
            <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              You don't have to prepare alone.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed opacity-80">
              Your AI teacher is ready whenever you are — day or night, in the language you think in.
            </p>
            <div className="mt-9 flex justify-center">
              <Button
                asChild
                size="lg"
                className="w-full bg-background text-foreground hover:bg-secondary sm:w-auto"
              >
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start Learning Free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="bg-background">
        <div className="container mx-auto max-w-6xl px-4 py-14">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 font-bold tracking-tight">
                <BrandMark className="h-10 w-10" />
                <span>
                  MedEu<span className="text-primary">.Ai</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                Your Personal AI Teacher, 24/7. Learn smarter, understand better and prepare with
                confidence.
              </p>
            </div>

            <FooterCol
              title="Learn"
              links={[
                { label: "AI Teacher", href: "#ai-teacher" },
                { label: "Practice", href: "#practice" },
                { label: "How it works", href: "#how-it-works" },
              ]}
            />
            <FooterCol
              title="Exams"
              links={[
                { label: "SSC", href: "#exams" },
                { label: "Railway & Banking", href: "#exams" },
                { label: "WBCS & WBPSC", href: "#exams" },
                { label: "Police & Other", href: "#exams" },
              ]}
            />

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Company
              </div>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/about" className="text-foreground hover:text-primary">
                    About us
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    search={{ mode: "signin" }}
                    className="text-foreground hover:text-primary"
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link
                    to="/auth"
                    search={{ mode: "signup" }}
                    className="text-foreground hover:text-primary"
                  >
                    Start Learning
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
            <span>© {new Date().getFullYear()} MedEu.Ai. All rights reserved.</span>
            <span>Made in India for Indian exam aspirants.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {title}
      </div>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="text-foreground hover:text-primary">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * Static, presentational previews of the real MedEu.Ai AI Teacher interface.
 * ------------------------------------------------------------------------ */

function PreviewChrome({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elegant)]">
      <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
        <div className="flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 rounded-md" />
          <div className="leading-tight">
            <div className="text-sm font-bold">MedEu.Ai Teacher</div>
            <div className="text-[11px] text-muted-foreground">{label}</div>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Online
        </span>
      </div>
      {children}
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "ai"; children: React.ReactNode }) {
  if (role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm bg-ink px-3.5 py-2.5 text-sm text-ink-foreground">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground">
        {children}
      </div>
    </div>
  );
}

function FakeInput({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-border bg-card px-3 py-3">
      <div className="flex h-9 flex-1 items-center rounded-md border border-input px-3 text-sm text-muted-foreground">
        {placeholder}
      </div>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
        <Send className="h-4 w-4" />
      </span>
    </div>
  );
}

function TeacherPreview() {
  return (
    <PreviewChrome label="Beginner · Teach mode · বাংলা">
      <div className="space-y-3 p-4">
        <Bubble role="user">Explain compound interest simply.</Bubble>
        <Bubble role="ai">
          <p className="font-semibold">Compound interest, in one line</p>
          <p className="mt-1.5 text-muted-foreground">
            Interest that also earns interest, because it is added back to your principal each
            period.
          </p>
          <p className="mt-2.5 text-muted-foreground">
            Formula: <span className="font-semibold text-foreground">A = P(1 + r/n)^(nt)</span>
          </p>
        </Bubble>
        <div className="flex flex-wrap gap-2 pt-1">
          {["Give me an example", "Quiz me on this", "Explain in Bengali"].map((c) => (
            <span
              key={c}
              className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-accent-foreground"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
      <FakeInput placeholder="Ask your AI teacher anything…" />
    </PreviewChrome>
  );
}

function ChatPreview() {
  return (
    <PreviewChrome label="Solve step-by-step · English">
      <div className="space-y-3 p-4">
        <Bubble role="user">A train covers 240 km in 3 hours. Find its speed.</Bubble>
        <Bubble role="ai">
          <p className="font-semibold">Step 1 — Write what is given</p>
          <p className="mt-1 text-muted-foreground">Distance = 240 km, Time = 3 h</p>
          <p className="mt-2.5 font-semibold">Step 2 — Apply the formula</p>
          <p className="mt-1 text-muted-foreground">Speed = Distance ÷ Time = 240 ÷ 3</p>
          <p className="mt-2.5 font-semibold">Step 3 — Answer</p>
          <p className="mt-1 text-muted-foreground">
            Speed = <span className="font-semibold text-foreground">80 km/h</span>
          </p>
          <p className="mt-3 border-t border-border pt-2.5 text-muted-foreground">
            Quick check: if the same train ran 4 hours at this speed, how far would it go?
          </p>
        </Bubble>
        <Bubble role="user">320 km</Bubble>
        <Bubble role="ai">
          <p className="inline-flex items-center gap-1.5 font-semibold text-primary">
            <CheckCircle2 className="h-4 w-4" /> Correct — well done.
          </p>
          <p className="mt-1.5 text-muted-foreground">
            Want 5 practice questions on time, speed and distance?
          </p>
        </Bubble>
      </div>
      <FakeInput placeholder="Type your doubt…" />
    </PreviewChrome>
  );
}
