import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Layers, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getPoolStats, refillPaperPool } from "@/lib/paper-pool.functions";
import { examLabel } from "@/lib/exam";

export const Route = createFileRoute("/_authenticated/admin/pool")({
  head: () => ({ meta: [{ title: "Paper Pool, Admin" }] }),
  component: PoolPage,
});

function PoolPage() {
  const qc = useQueryClient();
  const statsFn = useServerFn(getPoolStats);
  const refillFn = useServerFn(refillPaperPool);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["pool-stats"],
    queryFn: () => statsFn(),
  });

  const refillAll = useMutation({
    mutationFn: () => refillFn({ data: {} }),
    onSuccess: (r) => {
      toast.success(`Refilled ${r.createdTotal} papers across the pool`);
      qc.invalidateQueries({ queryKey: ["pool-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const refillOne = useMutation({
    mutationFn: (testId: string) => refillFn({ data: { testId } }),
    onSuccess: (r) => {
      toast.success(`Created ${r.createdTotal} paper(s)`);
      qc.invalidateQueries({ queryKey: ["pool-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <Card className="border-border/60 bg-card/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Pre-generated paper pool</h2>
            </div>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Papers ready in the pool are served instantly when a student starts a test , 
              zero waiting. Target: <strong>3 ready papers per test</strong>. When the
              ready pool is empty, the oldest used paper is reused; if no pooled copy exists,
              the app assembles a paper from approved database questions without live AI.
            </p>
          </div>
          <Button onClick={() => refillAll.mutate()} disabled={refillAll.isPending}>
            {refillAll.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-1 h-4 w-4" />
            )}
            Refill all
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <div className="h-32 animate-pulse rounded bg-muted/40" />
      ) : (
        <div className="space-y-2">
          {(stats ?? []).map((t) => (
            <Card
              key={t.id}
              className="border-border/60 bg-card/40 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="text-sm font-semibold">{t.title}</div>
                <div className="mt-0.5 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[10px]">
                    {examLabel(t.target_exam)}
                  </Badge>
                  <Badge
                    variant={t.ready >= 3 ? "default" : "destructive"}
                    className="text-[10px]"
                  >
                    {t.ready} ready
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {t.used} used · {t.serves} serves
                  </Badge>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={refillOne.isPending}
                onClick={() => refillOne.mutate(t.id)}
              >
                <RefreshCw className="mr-1 h-3 w-3" /> Refill
              </Button>
            </Card>
          ))}
          {(stats ?? []).length === 0 && (
            <p className="text-xs text-muted-foreground">No published tests yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
