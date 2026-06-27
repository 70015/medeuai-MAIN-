import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ParikshaSathi" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: profile, isLoading } = useProfile();
  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const goal = profile?.daily_goal_minutes ?? 30;
  const minutesToday = 0;
  const goalPct = Math.min(100, Math.round((minutesToday / goal) * 100));

  return (
    <div className="space-y-8">
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
