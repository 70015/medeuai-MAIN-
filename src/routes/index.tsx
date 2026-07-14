import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Languages,
  LineChart,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { isAdminHost } from "@/lib/host";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ParikshaSathi — AI Mock Tests for Indian Exams" },
      {
        name: "description",
        content:
          "AI mock tests, PYQs and analytics for SSC, WBCS, Railway and Banking — in Bengali, Hindi and English.",
      },
      { property: "og:title", content: "ParikshaSathi — Prepare Smarter. Rank Faster." },
      {
        property: "og:description",
        content: "AI-powered exam prep for SSC, WBCS, Railway, Banking and more.",
      },
      { property: "og:url", content: "https://pariksha-sathi-ai.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://pariksha-sathi-ai.lovable.app/" }],
  }),
  component: LandingPage,
});

const exams = [
  { code: "SSC CGL", desc: "Combined Graduate Level" },
  { code: "SSC CHSL", desc: "Higher Secondary" },
  { code: "WBCS", desc: "West Bengal Civil Service" },
  { code: "WBPSC", desc: "Public Service Commission" },
  { code: "Railway", desc: "RRB NTPC / Group D" },
  { code: "Banking", desc: "IBPS, SBI PO/Clerk" },
  { code: "Police", desc: "WBP, Kolkata Police" },
  { code: "More", desc: "Custom test series" },
];

const features = [
  {
    icon: Brain,
    title: "AI Teacher",
    desc: "Get every wrong answer explained in English, Hindi or Bengali — with similar practice questions on demand.",
  },
  {
    icon: Zap,
    title: "Adaptive Mock Tests",
    desc: "Full mocks, sectional, topic-wise and PYQs. Difficulty adapts to your strengths and weak areas.",
  },
  {
    icon: LineChart,
    title: "Deep Analytics",
    desc: "Topic-wise accuracy, time per question, percentile and rank — with AI suggestions on what to revise next.",
  },
  {
    icon: Trophy,
    title: "Leaderboards & Streaks",
    desc: "Compete state-wide and nationally. Daily streaks, XP and coins keep you accountable.",
  },
  {
    icon: Languages,
    title: "Bengali, Hindi & English",
    desc: "Questions and explanations in your medium of choice. Built for Bengali-medium aspirants first.",
  },
  {
    icon: ShieldCheck,
    title: "Private & Secure",
    desc: "Your data stays yours. Row-level security on every record, encrypted at rest and in transit.",
  },
];

function LandingPage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isAdminHost()) navigate({ to: "/admin", replace: true });
  }, [navigate]);
  if (isAdminHost()) return null;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />


      {/* Hero */}
      <section className="relative overflow-hidden hero-bg">
        <div className="container mx-auto max-w-6xl px-4 pb-24 pt-16 sm:pt-24 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              AI-powered exam prep
            </Badge>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Prepare Smarter.{" "}
              <span className="gradient-text">Rank Faster.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
              AI mock tests, previous year papers, personalized analytics and a 24/7 AI teacher —
              built for SSC, WBCS, Railway, Banking and other Indian government exam aspirants.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Start free <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                <a href="#features">Explore features</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free plan includes 3 mock tests every month. No credit card required.
            </p>
          </div>

          {/* stat strip */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { k: "50k+", v: "Questions" },
              { k: "8", v: "Major exams" },
              { k: "3", v: "Languages" },
              { k: "24/7", v: "AI teacher" },
            ].map((s) => (
              <Card key={s.v} className="border-border/60 bg-card/50 p-4 text-center backdrop-blur">
                <div className="text-2xl font-bold gradient-text">{s.k}</div>
                <div className="mt-1 text-xs text-muted-foreground">{s.v}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Exams */}
      <section id="exams" className="border-t border-border/60 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every exam, one platform
            </h2>
            <p className="mt-3 text-muted-foreground">
              Curated test series and PYQs for every major Indian government exam.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {exams.map((e) => (
              <Card
                key={e.code}
                className="group cursor-pointer border-border/60 bg-card/40 p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{e.code}</div>
                    <div className="text-xs text-muted-foreground">{e.desc}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">
              Why ParikshaSathi
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              The smartest way to crack your exam
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything Testbook, Adda247 and Oliveboard offer — plus an AI teacher in your language.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border-border/60 bg-card/40 p-6 transition-all hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border/60 py-20">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing</h2>
            <p className="mt-3 text-muted-foreground">Start free. Upgrade when you're serious.</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <PricingCard
              plan="Free"
              price="₹0"
              period="forever"
              perks={["3 mock tests / month", "Basic analytics", "1 language", "Limited AI explanations"]}
              cta="Get started"
              href="/auth"
            />
            <PricingCard
              plan="Pro Monthly"
              price="₹99"
              period="/ month"
              highlight
              perks={[
                "Unlimited mock tests",
                "Full analytics & leaderboard",
                "All 3 languages",
                "AI Teacher & study planner",
                "PYQ access",
              ]}
              cta="Start Pro"
              href="/auth"
            />
            <PricingCard
              plan="Pro Yearly"
              price="₹799"
              period="/ year"
              perks={[
                "Everything in Pro Monthly",
                "Save ₹389 vs monthly",
                "Priority AI responses",
                "Early access to features",
              ]}
              cta="Save 33%"
              href="/auth"
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>ParikshaSathi · Prepare Smarter. Rank Faster.</span>
          </div>
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ParikshaSathi. All rights reserved.
          </div>
          <Button asChild variant="link" size="sm" className="h-auto p-0">
            <Link to="/about">About us</Link>
          </Button>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({
  plan,
  price,
  period,
  perks,
  cta,
  href,
  highlight,
}: {
  plan: string;
  price: string;
  period: string;
  perks: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <Card
      className={
        "relative flex flex-col p-6 transition-all " +
        (highlight
          ? "border-primary/60 bg-card shadow-[var(--shadow-glow)]"
          : "border-border/60 bg-card/40 hover:border-primary/40")
      }
    >
      {highlight && (
        <Badge className="absolute -top-3 right-6 bg-primary text-primary-foreground">
          Most popular
        </Badge>
      )}
      <div className="text-sm font-medium text-muted-foreground">{plan}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">{period}</span>
      </div>
      <ul className="mt-6 space-y-2.5">
        {perks.map((p) => (
          <li key={p} className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <Button asChild className="w-full" variant={highlight ? "default" : "outline"}>
          <Link to={href} search={{ mode: "signup" }}>
            {cta}
          </Link>
        </Button>
      </div>
    </Card>
  );
}
