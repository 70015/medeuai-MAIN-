import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  BookOpen,
  Brain,
  Calendar,
  Coins,
  Flame,
  PlayCircle,
  Shield,
  Target,
  Trophy,
  Zap,
  Sparkles,
} from "lucide-react";

const EXAM_GRID = [
  { code: "ssc_cgl", label: "SSC CGL", desc: "Combined Graduate Level" },
  { code: "ssc_chsl", label: "SSC CHSL", desc: "Higher Secondary" },
  { code: "wbcs", label: "WBCS", desc: "WB Civil Service" },
  { code: "wbpsc", label: "WBPSC", desc: "Public Service Comm." },
  { code: "railway", label: "Railway", desc: "RRB NTPC / Group D" },
  { code: "banking", label: "Banking", desc: "IBPS, SBI PO/Clerk" },
  { code: "police", label: "Police", desc: "WBP, Kolkata Police" },
  { code: "other", label: "Other", desc: "More test series" },
] as const;

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ParikshaSathi" }] }),
  component: DashboardPage,
});

function useIsAdmin() {
  return useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: u.user.id,
        _role: "admin",
      });
      if (error) return false;
      return !!data;
    },
  });
}

function DashboardPage() {
  const { data: profile, isLoading } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const goal = profile?.daily_goal_minutes ?? 30;
  const minutesToday = 0;
  const goalPct = Math.min(100, Math.round((minutesToday / goal) * 100));

  return (
    <div className="space-y-8">
      <OnboardingFlow name={profile?.full_name?.split(" ")[0]} />

      {/* Welcome */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-8 hero-bg">
        <Badge variant="secondary" className="mb-3">
          {profile?.plan === "free" ? "Free plan" : "Pro plan"}
        </Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, <span className="gradient-text">{name}</span>
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          "Discipline beats motivation. Show up today, your future rank will thank you."
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/tests">
            <Button>
              <PlayCircle className="mr-1.5 h-4 w-4" />
              Start mock test
            </Button>
          </Link>
          <Link to="/ai-teacher">
            <Button variant="outline">
              <Brain className="mr-1.5 h-4 w-4" />
              Ask AI Teacher
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline">
                <Shield className="mr-1.5 h-4 w-4" />
                Admin Panel
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Onboarding: choose target exam if none set */}
      {!isLoading && !profile?.target_exam && (
        <section className="rounded-2xl border border-primary/40 bg-primary/5 p-6">
          <div className="flex items-start gap-3">
            <Target className="mt-0.5 h-5 w-5 text-primary" />
            <div className="flex-1">
              <h2 className="text-base font-semibold">Pick your target exam</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose which exam you're preparing for — we'll personalise mocks and analytics for it.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {EXAM_GRID.map((e) => (
                  <Link
                    key={e.code}
                    to="/tests"
                    search={{ exam: e.code }}
                    className="rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-xs font-medium hover:border-primary/60 hover:text-primary"
                  >
                    {e.label}
                  </Link>
                ))}
              </div>
              <div className="mt-3">
                <Link to="/profile" className="text-xs text-primary hover:underline">
                  Or set it permanently in your profile →
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Browse by exam */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold">Browse by exam</h2>
            <p className="text-xs text-muted-foreground">
              Tap an exam to see all its question papers.
            </p>
          </div>
          <Link to="/tests" search={{ exam: "all" }} className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {EXAM_GRID.map((e) => (
            <Link
              key={e.code}
              to="/tests"
              search={{ exam: e.code }}
              className="group rounded-xl border border-border/60 bg-card/40 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary transition-transform group-hover:scale-105">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{e.label}</div>
                  <div className="truncate text-xs text-muted-foreground">{e.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stat row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Current streak"
          value={`${profile?.current_streak ?? 0} days`}
          hint={`Best: ${profile?.longest_streak ?? 0}`}
          tint="warning"
        />
        <StatCard
          icon={Zap}
          label="XP earned"
          value={`${profile?.xp ?? 0}`}
          hint="Level up by practicing"
          tint="primary"
        />
        <StatCard
          icon={Coins}
          label="Coins"
          value={`${profile?.coins ?? 0}`}
          hint="Redeem for perks"
          tint="warning"
        />
        <StatCard
          icon={Target}
          label="Target exam"
          value={examLabel(profile?.target_exam)}
          hint="Change in profile"
          tint="primary"
        />
      </section>

      {/* Today + Quick actions */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-border/60 bg-card/40 p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold">Today's goal</h2>
              <p className="text-xs text-muted-foreground">
                {minutesToday} / {goal} minutes practiced
              </p>
            </div>
            <Badge variant={goalPct >= 100 ? "default" : "secondary"}>
              {goalPct >= 100 ? "Done" : `${goalPct}%`}
            </Badge>
          </div>
          <Progress value={goalPct} className="mt-4" />

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <QuickAction icon={PlayCircle} title="Take a mock" desc="20 mins · 25 Q" />
            <QuickAction icon={BookOpen} title="Practice PYQs" desc="Last 5 years" />
            <QuickAction icon={Trophy} title="Leaderboard" desc="See your rank" />
            <QuickAction icon={Calendar} title="Study planner" desc="AI weekly plan" />
          </div>
        </Card>

        <Card className="border-border/60 bg-card/40 p-6">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? (
              <ActivitySkeleton />
            ) : (
              <p className="text-sm text-muted-foreground">
                No activity yet. Take your first mock test to see analytics here.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  tint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  tint: "primary" | "warning";
}) {
  const tintCls = tint === "primary" ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning";
  return (
    <Card className="border-border/60 bg-card/40 p-5">
      <div className="flex items-center justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tintCls}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-bold">{value}</div>
      <div className="mt-0.5 text-xs font-medium text-foreground">{label}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      className="group flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 p-3 text-left transition-all hover:border-primary/40 hover:bg-accent/30"
    >
      <div className="grid h-9 w-9 place-items-center rounded-md bg-primary/15 text-primary transition-transform group-hover:scale-105">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}

function ActivitySkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-12 animate-pulse rounded-md bg-muted/50" />
      ))}
    </div>
  );
}

function examLabel(code: string | null | undefined) {
  switch (code) {
    case "ssc_cgl":
      return "SSC CGL";
    case "ssc_chsl":
      return "SSC CHSL";
    case "wbcs":
      return "WBCS";
    case "wbpsc":
      return "WBPSC";
    case "railway":
      return "Railway";
    case "banking":
      return "Banking";
    case "police":
      return "Police";
    default:
      return "Not set";
  }
}
