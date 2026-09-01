import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Exam = Database["public"]["Enums"]["target_exam"];
type Syllabus = Database["public"]["Tables"]["exam_syllabi"]["Row"];

const EXAMS: Exam[] = [
  "ssc_cgl",
  "ssc_chsl",
  "wbcs",
  "wbpsc",
  "railway",
  "banking",
  "police",
  "other",
];

export const Route = createFileRoute("/_authenticated/admin/syllabi")({
  head: () => ({ meta: [{ title: "Syllabi, Admin" }] }),
  component: SyllabiPage,
});

function SyllabiPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "syllabi"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exam_syllabi")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Syllabus[];
    },
  });

  const [draft, setDraft] = useState<{
    target_exam: Exam;
    name: string;
    syllabus: string;
    pattern: string;
    is_active: boolean;
  }>({
    target_exam: "ssc_chsl",
    name: "",
    syllabus: "",
    pattern: `{\n  "sections": [\n    { "subject": "quant", "count": 25, "marks_per": 2, "negative": 0.5 }\n  ],\n  "difficulty_mix": { "easy": 40, "medium": 40, "hard": 20 }\n}`,
    is_active: true,
  });

  const create = useMutation({
    mutationFn: async () => {
      let pattern: unknown;
      try {
        pattern = JSON.parse(draft.pattern);
      } catch {
        throw new Error("Pattern must be valid JSON");
      }
      const { error } = await supabase.from("exam_syllabi").insert({
        target_exam: draft.target_exam,
        name: draft.name.trim(),
        syllabus: draft.syllabus.trim(),
        pattern: pattern as never,
        is_active: draft.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Syllabus added");
      setDraft((d) => ({ ...d, name: "", syllabus: "" }));
      qc.invalidateQueries({ queryKey: ["admin", "syllabi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (row: Syllabus) => {
      const { error } = await supabase
        .from("exam_syllabi")
        .update({
          name: row.name,
          syllabus: row.syllabus,
          pattern: row.pattern,
          is_active: row.is_active,
          target_exam: row.target_exam,
        })
        .eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "syllabi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exam_syllabi").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "syllabi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <Card className="border-border/60 bg-card/40 p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <Plus className="h-4 w-4" /> Add syllabus
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Exam</Label>
            <Select
              value={draft.target_exam}
              onValueChange={(v) => setDraft({ ...draft, target_exam: v as Exam })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXAMS.map((e) => (
                  <SelectItem key={e} value={e}>{e.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. SSC CHSL Tier 1, 2025"
            />
          </div>
        </div>
        <div className="mt-3">
          <Label>Syllabus (free text / markdown)</Label>
          <Textarea
            rows={4}
            value={draft.syllabus}
            onChange={(e) => setDraft({ ...draft, syllabus: e.target.value })}
            placeholder="List subjects and topics covered…"
          />
        </div>
        <div className="mt-3">
          <Label>Pattern (JSON)</Label>
          <Textarea
            rows={8}
            className="font-mono text-xs"
            value={draft.pattern}
            onChange={(e) => setDraft({ ...draft, pattern: e.target.value })}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Switch
            checked={draft.is_active}
            onCheckedChange={(c) => setDraft({ ...draft, is_active: c })}
          />
          <Label>Active</Label>
        </div>
        <Button
          className="mt-4"
          onClick={() => create.mutate()}
          disabled={create.isPending || !draft.name.trim()}
        >
          {create.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          Save syllabus
        </Button>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Existing syllabi</h2>
        {isLoading ? (
          <Card className="grid h-24 place-items-center"><Loader2 className="h-4 w-4 animate-spin" /></Card>
        ) : !data || data.length === 0 ? (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            No syllabi yet. Add your first one above.
          </Card>
        ) : (
          data.map((row) => <SyllabusRow key={row.id} row={row} onSave={(r) => update.mutate(r)} onDelete={(id) => del.mutate(id)} />)
        )}
      </div>
    </div>
  );
}

function SyllabusRow({
  row,
  onSave,
  onDelete,
}: {
  row: Syllabus;
  onSave: (r: Syllabus) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState<Syllabus>(row);
  const [patternStr, setPatternStr] = useState(JSON.stringify(row.pattern, null, 2));

  return (
    <Card className="border-border/60 bg-card/40 p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{local.target_exam}</Badge>
        <Badge variant={local.is_active ? "default" : "outline"}>
          {local.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          value={local.name}
          onChange={(e) => setLocal({ ...local, name: e.target.value })}
        />
        <Select
          value={local.target_exam}
          onValueChange={(v) => setLocal({ ...local, target_exam: v as Exam })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {EXAMS.map((e) => (
              <SelectItem key={e} value={e}>{e.toUpperCase()}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        className="mt-3"
        rows={3}
        value={local.syllabus}
        onChange={(e) => setLocal({ ...local, syllabus: e.target.value })}
      />
      <Textarea
        className="mt-3 font-mono text-xs"
        rows={6}
        value={patternStr}
        onChange={(e) => setPatternStr(e.target.value)}
      />
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Switch
            checked={local.is_active}
            onCheckedChange={(c) => setLocal({ ...local, is_active: c })}
          />
          <Label>Active</Label>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(local.id)}
          >
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
          <Button
            size="sm"
            onClick={() => {
              try {
                const pattern = JSON.parse(patternStr);
                onSave({ ...local, pattern });
              } catch {
                toast.error("Pattern must be valid JSON");
              }
            }}
          >
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
