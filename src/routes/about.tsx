import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Languages, ShieldCheck, Sparkles, Target, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ParikshaSathi — AI Exam Prep for India" },
      {
        name: "description",
        content:
          "ParikshaSathi is an AI-powered mock-test and study platform for Indian government exams, built for Bengali, Hindi and English-medium aspirants.",
      },
      { property: "og:title", content: "About ParikshaSathi" },
      {
        property: "og:description",
        content:
          "Learn about our mission to make world-class exam preparation accessible to every Indian aspirant.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Target,
    title: "Mission",
    desc: "Make rank-worthy exam preparation accessible, affordable and personalised for every Indian aspirant — regardless of medium or city.",
  },
  {
    icon: Brain,
    title: "Vision",
    desc: "An AI-powered teacher in every aspirant's pocket — explaining, practising and planning until selection day.",
  },
  {
    icon: Languages,
    title: "Built trilingual",
    desc: "Every question, explanation and analytic in English, বাংলা and हिन्दी. Bengali-medium first — a gap no big platform fills.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    desc: "Your attempts, notes and progress stay yours. Row-level security on every record, encrypted at rest and in transit.",
  },
  {
    icon: Trophy,
    title: "Outcomes, not vanity",
    desc: "We measure success by your rank, not by hours spent. Analytics tell you exactly what to revise next.",
  },
  {
    icon: Sparkles,
    title: "Made in India",
    desc: "Designed for Indian exam patterns — SSC, WBCS, WBPSC, Railway, Banking, Police and more — by a small, focused team.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden hero-bg">
        <div className="container mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> About us
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            Smarter prep for{" "}
            <span className="gradient-text">every Indian aspirant.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            ParikshaSathi is an AI-first exam preparation platform built for SSC, WBCS, WBPSC,
            Railway, Banking, Police and other Indian government exams. Practice unlimited mock
            tests, get every doubt explained in your language, and track your rank — all in one
            place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>
                Start preparing free
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">What we stand for</h2>
            <p className="mt-3 text-muted-foreground">
              Six principles shape every decision we make about ParikshaSathi.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Card
                key={v.title}
                className="border-border/60 bg-card/40 p-6 transition-all hover:border-primary/40"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight">Our story</h2>
          <p className="mt-4 text-muted-foreground">
            ParikshaSathi started with a simple frustration — the best test-prep platforms in India
            are expensive, English-only, and built for metro students. Aspirants from Bengal, Bihar
            and small towns deserve the same quality of preparation in their language. So we
            combined AI-generated question banks, real previous-year papers and a 24/7 AI teacher
            into one affordable platform. Today thousands of aspirants practice with us every week
            — and we're just getting started.
          </p>
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
        </div>
      </footer>
    </div>
  );
}
