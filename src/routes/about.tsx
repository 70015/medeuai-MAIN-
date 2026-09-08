import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Brain,
  Facebook,
  Globe,
  Instagram,
  Languages,
  Linkedin,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Twitter,
  Youtube,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { BrandLogoFull, BrandMark, SocialLinks } from "@/components/brand-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";


export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MedEuAi | AI Exam Prep for India" },
      {
        name: "description",
        content:
          "MedEuAi is an AI-powered mock-test platform for Indian government exams, built for Bengali, Hindi and English aspirants.",
      },
      { property: "og:title", content: "About MedEuAi" },
      {
        property: "og:description",
        content:
          "Our mission to make world-class exam preparation accessible to every Indian aspirant. Founded by Rahamat Ali. Support: hello.medeu.ai@gmail.com.",
      },
      { property: "og:url", content: "https://medeuai.in/about" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About MedEuAi" },
      {
        name: "twitter:description",
        content:
          "The mission, founder and principles behind MedEuAi, your personal AI teacher, 24/7.",
      },
    ],
    links: [{ rel: "canonical", href: "https://medeuai.in/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: "About MedEuAi",
          url: "https://medeuai.in/about",
          about: {
            "@type": "EducationalOrganization",
            name: "MedEuAi",
            url: "https://medeuai.in",
            email: "hello.medeu.ai@gmail.com",
            founder: { "@type": "Person", name: "Rahamat Ali" },
          },
        }),
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: Target, title: "Mission", desc: "Make rank-worthy exam preparation accessible, affordable and personalised for every Indian aspirant, regardless of medium or city." },
  { icon: Brain, title: "Vision", desc: "An AI-powered teacher in every aspirant's pocket, explaining, practising and planning until selection day." },
  { icon: Languages, title: "Built trilingual", desc: "Every question, explanation and analytic in English, বাংলা and हिन्दी. Bengali-medium first, a gap no big platform fills." },
  { icon: ShieldCheck, title: "Private by default", desc: "Your attempts, notes and progress stay yours. Row-level security on every record, encrypted at rest and in transit." },
  { icon: Trophy, title: "Outcomes, not vanity", desc: "We measure success by your rank, not by hours spent. Analytics tell you exactly what to revise next." },
  { icon: Sparkles, title: "Made in India", desc: "Designed for Indian exam patterns, SSC, WBCS, WBPSC, Railway, Banking, Police and more, by a small, focused team." },
];

function useAboutContent() {
  return useQuery({
    queryKey: ["about_content"],
    queryFn: async () => {
      const { data } = await supabase.from("about_content").select("*").limit(1).maybeSingle();
      return data;
    },
  });
}

function useSignedImage(rawUrl: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!rawUrl) { setUrl(null); return; }
    // Extract path after /about-media/
    const match = rawUrl.match(/about-media\/(.+)$/);
    if (!match) { setUrl(rawUrl); return; }
    supabase.storage.from("about-media").createSignedUrl(match[1], 60 * 60 * 24)
      .then(({ data }) => setUrl(data?.signedUrl ?? null));
  }, [rawUrl]);
  return url;
}

function AboutPage() {
  const { data: about } = useAboutContent();
  const founderImg = useSignedImage(about?.founder_image_url);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>

      <section className="relative overflow-hidden hero-bg">
        <div className="container mx-auto max-w-4xl px-4 pb-16 pt-16 text-center sm:pt-24">
          <BrandLogoFull className="mb-6 h-32 sm:h-44" />
          <Badge variant="secondary" className="mb-6 gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" /> About us
          </Badge>
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl">
            {about?.hero_title ?? "Smarter prep for every Indian aspirant."}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {about?.hero_subtitle ??
              "MedEuAi is an AI-first exam preparation platform built for SSC, WBCS, WBPSC, Railway, Banking, Police and other Indian government exams."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth" search={{ mode: "signup" }}>Start preparing free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Founder */}
      {(founderImg || about?.founder_name) && (
        <section className="border-t border-border/60 py-16">
          <div className="container mx-auto max-w-4xl px-4">
            <Card className="grid items-center gap-8 border-border/60 bg-card/40 p-6 sm:p-10 md:grid-cols-[200px_1fr]">
              {founderImg ? (
                <img
                  src={founderImg}
                  alt={about?.founder_name ? `${about.founder_name}, Founder of MedEuAi` : "Founder of MedEuAi"}
                  className="mx-auto h-48 w-48 rounded-2xl object-cover shadow-[var(--shadow-elegant)] ring-1 ring-border/60"
                />
              ) : (
                <div className="mx-auto grid h-48 w-48 place-items-center rounded-2xl bg-muted">
                  <Sparkles className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
              <div>
                <Badge variant="secondary" className="mb-3">Meet the founder</Badge>
                <h2 className="text-2xl font-bold tracking-tight">{about?.founder_name ?? "Rahamat Ali"}</h2>
                <p className="mt-1 text-sm text-primary">{about?.founder_position ?? "Founder & CEO"}</p>
                {about?.founder_quote && (
                  <blockquote className="mt-4 border-l-2 border-primary/60 pl-4 text-pretty text-muted-foreground">
                    "{about.founder_quote}"
                  </blockquote>
                )}
              </div>
            </Card>
          </div>
        </section>
      )}

      <section className="border-t border-border/60 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">What we stand for</h2>
            <p className="mt-3 text-muted-foreground">Six principles shape every decision we make about MedEuAi.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <Card key={v.title} className="border-border/60 bg-card/40 p-6 transition-all hover:border-primary/40">
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
          <h2 className="text-3xl font-bold tracking-tight">{about?.story_title ?? "Our story"}</h2>
          <div className="mt-4 space-y-4 text-muted-foreground">
            {(about?.story_paragraphs as string[] | null)?.length
              ? (about!.story_paragraphs as string[]).map((p, i) => <p key={i}>{p}</p>)
              : (
                <p>
                  MedEuAi started with a simple frustration, the best test-prep platforms in India are
                  expensive, English-only, and built for metro students. Aspirants from Bengal, Bihar and small
                  towns deserve the same quality of preparation in their language.
                </p>
              )}
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 py-16">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/15 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-2xl font-bold tracking-tight">Help &amp; support</h2>
          <p className="mt-2 text-muted-foreground">
            Have a question, feedback, or need help with anything on MedEuAi?
          </p>
          <a
            href="mailto:hello.medeu.ai@gmail.com"
            className="mt-5 inline-block text-base font-semibold text-primary hover:underline sm:text-lg"
          >
            hello.medeu.ai@gmail.com
          </a>
        </div>
      </section>
      </main>

      <footer className="border-t border-border/60 py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Follow us
            </span>
            <SocialLinks />
          </div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
            <Link to="/" className="hover:text-primary">
              Home
            </Link>
            <Link to="/about" className="hover:text-primary">
              About
            </Link>
            <Link to="/privacy-policy" className="hover:text-primary">
              Privacy Policy
            </Link>
          </div>
          <div className="mt-4 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BrandMark className="h-7 w-7" />
              <span>MedEuAi · Your Personal AI Teacher, 24/7.</span>
            </div>
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} MedEuAi. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
