import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpenCheck,
  Brain,
  CalendarClock,
  Check,
  Copy,
  GraduationCap,
  ListOrdered,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  Trash2,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
import { synthesizeSpeech } from "@/lib/ai-tts.functions";
import { useProfile } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import type { TeacherLevel, TeacherMode } from "@/lib/ai-teacher-prompt";

export const Route = createFileRoute("/_authenticated/ai-teacher")({
  head: () => ({
    meta: [
      { title: "AI Teacher — Personal exam tutor | ParikshaSathi" },
      {
        name: "description",
        content:
          "Chat with the ParikshaSathi AI Teacher: step-by-step solutions, adaptive explanations, quizzes and study plans for SSC, WBCS, Railway and Banking exams.",
      },
    ],
  }),
  component: AITeacherPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const MODES: { id: TeacherMode; label: string; icon: typeof Brain; hint: string }[] = [
  { id: "teach", label: "Teach", icon: GraduationCap, hint: "Explain a concept" },
  { id: "steps", label: "Solve", icon: ListOrdered, hint: "Step-by-step solution" },
  { id: "quiz", label: "Quiz me", icon: BookOpenCheck, hint: "3 practice MCQs" },
  { id: "plan", label: "Study plan", icon: CalendarClock, hint: "Day-by-day plan" },
];

const SUGGESTIONS: Record<TeacherMode, string[]> = {
  teach: [
    "Explain Fundamental Rights vs DPSP simply",
    "Why does inflation rise? Explain like I'm new",
    "Teach me percentages the exam way",
    "Modern history: key dates I must memorise",
  ],
  steps: [
    "A train 180m long crosses a pole in 12s. Find its speed.",
    "Solve: 25% of x = 90. Find x.",
    "Two pipes fill a tank in 12 and 18 min. Together?",
    "Simplify a compound interest problem step by step",
  ],
  quiz: [
    "Quiz me on Indian Polity",
    "Quiz me on Time, Speed & Distance",
    "Quiz me on static GK",
    "Quiz me on English grammar errors",
  ],
  plan: [
    "30-day plan for SSC CGL Tier 1",
    "Weekend-only study plan for WBCS",
    "2-week revision plan before Railway NTPC",
    "Daily 2-hour plan for Banking Prelims",
  ],
};

const STORAGE_KEY = "ps-ai-teacher-chat-v2";

function AITeacherPage() {
  const { data: profile } = useProfile();
  const tts = useServerFn(synthesizeSpeech);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<TeacherMode>("teach");
  const [level, setLevel] = useState<TeacherLevel>("intermediate");
  const [language, setLanguage] = useState<"english" | "bengali" | "hindi">("english");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingSpeakIdx, setLoadingSpeakIdx] = useState<number | null>(null);

  // Restore chat + preferences
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as {
          messages?: Msg[];
          mode?: TeacherMode;
          level?: TeacherLevel;
          language?: typeof language;
        };
        if (saved.messages?.length) setMessages(saved.messages.slice(-30));
        if (saved.mode) setMode(saved.mode);
        if (saved.level) setLevel(saved.level);
        if (saved.language) setLanguage(saved.language);
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    if (profile?.preferred_language && !localStorage.getItem(STORAGE_KEY)) {
      setLanguage(profile.preferred_language as typeof language);
    }
  }, [profile?.preferred_language]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: messages.slice(-30), mode, level, language }),
      );
    } catch {
      /* storage full — non-critical */
    }
  }, [messages, mode, level, language]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming, pending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(
    async (history: Msg[]) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setPending(true);
      setStreaming("");

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) throw new Error("Session expired. Please sign in again.");

        const res = await fetch("/api/ai-teacher", {
          method: "POST",
          signal: controller.signal,
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: history.slice(-20),
            language,
            level,
            mode,
            targetExam: (profile?.target_exam as string | undefined) ?? undefined,
            studentName: profile?.full_name?.split(" ")[0] ?? undefined,
          }),
        });

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `AI error (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setStreaming(acc);
        }
        if (!acc.trim()) throw new Error("AI returned an empty response.");
        setMessages((m) => [...m, { role: "assistant", content: acc }]);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          setStreaming((s) => {
            if (s.trim()) setMessages((m) => [...m, { role: "assistant", content: s }]);
            return "";
          });
        } else {
          toast.error((e as Error).message);
        }
      } finally {
        setStreaming("");
        setPending(false);
        abortRef.current = null;
      }
    },
    [language, level, mode, profile?.full_name, profile?.target_exam],
  );

  function submit(text: string) {
    const t = text.trim();
    if (!t || pending) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    void run(next);
  }

  function regenerate() {
    if (pending) return;
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const trimmed = messages.slice(0, messages.lastIndexOf(lastUser) + 1);
    setMessages(trimmed);
    void run(trimmed);
  }

  function stop() {
    abortRef.current?.abort();
  }

  function clearChat() {
    abortRef.current?.abort();
    audioRef.current?.pause();
    setMessages([]);
    setStreaming("");
    localStorage.removeItem(STORAGE_KEY);
  }

  async function copy(idx: number, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function speak(idx: number, text: string) {
    if (speakingIdx === idx) {
      audioRef.current?.pause();
      audioRef.current = null;
      setSpeakingIdx(null);
      return;
    }
    audioRef.current?.pause();
    setLoadingSpeakIdx(idx);
    try {
      const plain = text.replace(/[#*_`~>-]/g, " ").replace(/\s+/g, " ").trim();
      const { audio } = await tts({ data: { text: plain.slice(0, 2000) } });
      const el = new Audio(audio);
      audioRef.current = el;
      el.onended = () => setSpeakingIdx((s) => (s === idx ? null : s));
      el.onpause = () => setSpeakingIdx((s) => (s === idx ? null : s));
      setSpeakingIdx(idx);
      await el.play();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoadingSpeakIdx(null);
    }
  }

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <Brain className="h-4.5 w-4.5" />
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">AI Teacher</h1>
            <p className="truncate text-[11px] text-muted-foreground">
              {pending ? "Typing…" : "Online · personal tutor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={level} onValueChange={(v) => setLevel(v as TeacherLevel)}>
            <SelectTrigger className="h-8 w-[112px] text-xs" aria-label="Your level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="h-8 w-[92px] text-xs" aria-label="Language">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="bengali">বাংলা</SelectItem>
              <SelectItem value="hindi">हिन्दी</SelectItem>
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Clear conversation"
              className="h-8 w-8 text-muted-foreground"
              onClick={clearChat}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              title={m.hint}
              aria-pressed={active}
              className={
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (active
                  ? "border-primary/40 bg-primary/15 text-primary"
                  : "border-border/60 text-muted-foreground hover:text-foreground")
              }
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Chat */}
      <Card
        ref={scrollRef}
        className="flex-1 overflow-y-auto border-border/60 bg-card/40 p-3 sm:p-4"
      >
        {messages.length === 0 && !streaming ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-md space-y-3">
              <Sparkles className="mx-auto h-7 w-7 text-primary" />
              <p className="text-sm text-muted-foreground">
                Hi {firstName}! I'm your personal teacher. Pick a starter or just ask — I'll adapt
                to your level.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS[mode].map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="h-auto whitespace-normal py-2 text-left text-xs"
                    onClick={() => submit(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={"flex gap-2 " + (m.role === "user" ? "justify-end" : "")}>
                {m.role === "assistant" && (
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                    <Brain className="h-3.5 w-3.5" />
                  </span>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] animate-in fade-in slide-in-from-bottom-1 rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground duration-200"
                      : "group relative max-w-[92%] animate-in fade-in slide-in-from-bottom-1 rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2 text-[13px] leading-relaxed text-foreground duration-200"
                  }
                >
                  {m.role === "assistant" ? (
                    <>
                      <Markdown content={m.content} />
                      <div className="mt-1.5 flex items-center justify-end gap-0.5">
                        <IconAction
                          label={copiedIdx === i ? "Copied" : "Copy answer"}
                          onClick={() => copy(i, m.content)}
                        >
                          {copiedIdx === i ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </IconAction>
                        <IconAction
                          label={speakingIdx === i ? "Stop voice" : "Listen"}
                          onClick={() => speak(i, m.content)}
                        >
                          {loadingSpeakIdx === i ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : speakingIdx === i ? (
                            <Square className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                        </IconAction>
                        {i === messages.length - 1 && !pending && (
                          <IconAction label="Regenerate answer" onClick={regenerate}>
                            <RefreshCw className="h-3 w-3" />
                          </IconAction>
                        )}
                      </div>
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
              </div>
            ))}

            {(streaming || pending) && (
              <div className="flex gap-2">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/15 text-primary">
                  <Brain className="h-3.5 w-3.5" />
                </span>
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2 text-[13px] leading-relaxed">
                  {streaming ? (
                    <Markdown content={streaming} />
                  ) : (
                    <span className="flex gap-1 py-1" aria-label="Teacher is typing">
                      {[0, 1, 2].map((d) => (
                        <span
                          key={d}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
                          style={{ animationDelay: `${d * 120}ms` }}
                        />
                      ))}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            mode === "steps"
              ? "Paste a question to solve step by step…"
              : mode === "quiz"
                ? "Which topic should I quiz you on?"
                : mode === "plan"
                  ? "Tell me your exam and days left…"
                  : "Ask anything — I'll explain it your way…"
          }
          rows={1}
          className="max-h-32 min-h-[44px] resize-none rounded-2xl bg-card/60 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
        />
        {pending ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            aria-label="Stop generating"
            className="h-11 w-11 shrink-0 rounded-full"
            onClick={stop}
          >
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            aria-label="Send message"
            className="h-11 w-11 shrink-0 rounded-full"
            disabled={!input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </form>
    </div>
  );
}

function IconAction({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
    >
      {children}
    </button>
  );
}

function Markdown({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none break-words dark:prose-invert [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:pl-5 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_table]:text-[12px] [&_ul]:my-1 [&_ul]:pl-5">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
