import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect } from "react";
import { Brain, Loader2, Send, Sparkles, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { askAITeacher } from "@/lib/ai-teacher.functions";
import { useProfile } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/ai-teacher")({
  head: () => ({ meta: [{ title: "AI Teacher — ParikshaSathi" }] }),
  component: AITeacherPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Explain time-speed-distance with a worked example",
  "Trick to solve syllogism quickly",
  "Difference between Fundamental Rights and DPSP",
  "Important dates in modern Indian history",
];

function AITeacherPage() {
  const { data: profile } = useProfile();
  const ask = useServerFn(askAITeacher);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"english" | "bengali" | "hindi">(
    (profile?.preferred_language as "english" | "bengali" | "hindi") ?? "english",
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = useMutation({
    mutationFn: (next: Msg[]) =>
      ask({
        data: {
          messages: next,
          language,
          targetExam: (profile?.target_exam as string | undefined) ?? undefined,
        },
      }),
    onSuccess: (r) => setMessages((m) => [...m, { role: "assistant", content: r.content }]),
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, send.isPending]);

  function submit(text: string) {
    const t = text.trim();
    if (!t || send.isPending) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    send.mutate(next);
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-lg font-bold tracking-tight">AI Teacher</h1>
            <p className="text-xs text-muted-foreground">
              Ask anything — concepts, doubts, tricks, practice questions.
            </p>
          </div>
        </div>
        <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="bengali">বাংলা</SelectItem>
            <SelectItem value="hindi">हिन्दी</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card ref={scrollRef} className="flex-1 overflow-y-auto border-border/60 bg-card/40 p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-md space-y-4">
              <Sparkles className="mx-auto h-8 w-8 text-primary" />
              <p className="text-sm text-muted-foreground">
                Hi {profile?.full_name?.split(" ")[0] ?? "there"}! I'm your AI teacher.
                Pick a starter or type your own question.
              </p>
              <div className="grid gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal py-2 text-left"
                    onClick={() => submit(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={"flex gap-3 " + (m.role === "user" ? "justify-end" : "")}>
                {m.role === "assistant" && (
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <Brain className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={
                    "max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground")
                  }
                >
                  {m.content}
                </div>
                {m.role === "user" && (
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-secondary">
                    <UserIcon className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}
            {send.isPending && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
              </div>
            )}
          </div>
        )}
      </Card>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          rows={2}
          className="resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
        />
        <Button type="submit" disabled={send.isPending || !input.trim()}>
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
