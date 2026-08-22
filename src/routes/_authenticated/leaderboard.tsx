import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatSeconds } from "@/lib/exam";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — MedEu.Ai" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [testId, setTestId] = useState<string>("");

  const { data: tests } = useQuery({
    queryKey: ["mock-tests", "for-leaderboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mock_tests")
        .select("id, title, slug")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data && data.length > 0 && !testId) setTestId(data[0].id);
      return data;
    },
  });

  const { data: rows, isLoading } = useQuery({
    queryKey: ["leaderboard", testId],
    enabled: !!testId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_leaderboard", {
        p_test_id: testId,
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        user_id: r.user_id as string,
        score: Number(r.score ?? 0),
        time_taken_seconds: r.time_taken_seconds as number | null,
        full_name: (r.full_name as string | null) ?? "Student",
      }));
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top performers by best score per test.</p>
        </div>
        <Select value={testId} onValueChange={setTestId}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder="Select a test" />
          </SelectTrigger>
          <SelectContent>
            {(tests ?? []).map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : !rows || rows.length === 0 ? (
        <Card className="border-dashed border-border/60 bg-card/40 p-10 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No submissions yet. Be the first!</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-border/60 bg-card/40">
          <ul className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <li key={r.user_id} className="flex items-center gap-4 px-5 py-3">
                <RankBadge rank={i + 1} />
                <div className="min-w-0 grow">
                  <div className="truncate text-sm font-semibold">{r.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatSeconds(r.time_taken_seconds ?? 0)}
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono">
                  {r.score.toFixed(2)}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const Icon = rank === 1 ? Crown : rank <= 3 ? Medal : null;
  return (
    <div
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold",
        rank === 1 && "bg-warning/20 text-warning",
        rank === 2 && "bg-muted text-foreground",
        rank === 3 && "bg-warning/10 text-warning",
        rank > 3 && "bg-secondary text-muted-foreground",
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : rank}
    </div>
  );
}
