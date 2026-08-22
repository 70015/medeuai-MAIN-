import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpenCheck,
  CalendarClock,
  Check,
  Copy,
  GraduationCap,
  Lightbulb,
  ListOrdered,
  Loader2,
  RefreshCw,
  Square,
  Trash2,
  Volume2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
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
import teacherMark from "@/assets/medeu-teacher-mark.png";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/_authenticated/ai-teacher")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "AI Teacher — Your personal tutor | MedEu.Ai" },
      {
        name: "description",
        content:
          "Learn with the MedEu.Ai AI Teacher: structured explanations, step-by-step solutions, exam shortcuts, quizzes and revision help for SSC, WBCS, Railway and Banking exams.",
      },
      { property: "og:title", content: "AI Teacher — Your personal tutor | MedEu.Ai" },
      {
        property: "og:description",
        content: "Structured explanations, step-by-step solutions and practice, available 24/7.",
      },
    ],
  }),
  component: AITeacherPage,
});

type Msg = { role: "user" | "assistant"; content: string; kind?: MsgKind };

/** Presentation-only labels. Derived from the mode the student used — never from faked content. */
type MsgKind =
  | "explanation"
  | "steps"
  | "concept"
  | "shortcut"
  | "practice"
  | "tip";

const KIND_META: Record<MsgKind, { label: string; icon: typeof GraduationCap }> = {
  explanation: { label: "Explanation", icon: GraduationCap },
  steps: { label: "Step-by-step solution", icon: ListOrdered },
  concept: { label: "Quick concept", icon: Lightbulb },
  shortcut: { label: "Exam shortcut", icon: Zap },
  practice: { label: "Practice question", icon: BookOpenCheck },
  tip: { label: "Important tip", icon: CalendarClock },
};

const MODES: { id: TeacherMode; label: string; icon: typeof GraduationCap; hint: string }[] = [
  { id: "teach", label: "Teach", icon: GraduationCap, hint: "Explain a concept" },
  { id: "steps", label: "Solve", icon: ListOrdered, hint: "Step-by-step solution" },
  { id: "quiz", label: "Quiz me", icon: BookOpenCheck, hint: "3 practice MCQs" },
  { id: "plan", label: "Study plan", icon: CalendarClock, hint: "Day-by-day plan" },
];

/** Quick actions run through the existing prompting flow (mode + prompt text). */
const QUICK_ACTIONS: {
  label: string;
  mode: TeacherMode;
  kind: MsgKind;
  prompt: (exam: string) => string;
}[] = [
  {
    label: "Explain a topic",
    mode: "teach",
    kind: "explanation",
    prompt: (e) => `Explain an important ${e} topic to me clearly, with an example.`,
  },
  {
    label: "Solve a question",
    mode: "steps",
    kind: "steps",
    prompt: () => "Here is my question — solve it step by step: ",
  },
  {
    label: "Create a quiz",
    mode: "quiz",
    kind: "practice",
    prompt: (e) => `Quiz me with 3 ${e} level MCQs and check my answers.`,
  },
  {
    label: "Give me a shortcut",
    mode: "teach",
    kind: "shortcut",
    prompt: (e) => `Give me the fastest exam shortcut/trick for a common ${e} calculation.`,
  },
  {
    label: "Help me revise",
    mode: "plan",
    kind: "tip",
    prompt: (e) => `Help me revise ${e} today — what should I focus on first?`,
  },
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

const MODE_KIND: Record<TeacherMode, MsgKind> = {
  teach: "explanation",
  steps: "steps",
  quiz: "practice",
  plan: "tip",
};

const STORAGE_KEY = "ps-ai-teacher-chat-v2";

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
      return "";
  }
}

function AITeacherPage() {
  const { data: profile } = useProfile();
  const { q: prefill } = Route.useSearch();
  const tts = useServerFn(synthesizeSpeech);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<TeacherMode>("teach");
  const [level, setLevel] = useState<TeacherLevel>("intermediate");
  const [language, setLanguage] = useState<"english" | "bengali" | "hindi">("english");
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextKindRef = useRef<MsgKind | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingSpeakIdx, setLoadingSpeakIdx] = useState<number | null>(null);

  // Prefill the composer from a link (e.g. "explain my mistakes" on the results page).
  useEffect(() => {
    if (prefill) setInput(prefill);
  }, [prefill]);

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
            messages: history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
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

        const kind = nextKindRef.current ?? MODE_KIND[mode];
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
        setMessages((m) => [...m, { role: "assistant", content: acc, kind }]);
      } catch (e) {
        if ((e as Error).name === "AbortError") {
          const kind = nextKindRef.current ?? MODE_KIND[mode];
          setStreaming((s) => {
            if (s.trim()) setMessages((m) => [...m, { role: "assistant", content: s, kind }]);
            return "";
          });
        } else {
          toast.error((e as Error).message);
        }
      } finally {
        setStreaming("");
        setPending(false);
        abortRef.current = null;
        nextKindRef.current = null;
      }
    },
    [language, level, mode, profile?.full_name, profile?.target_exam],
  );

  function submit(text: string, kind?: MsgKind) {
    const t = text.trim();
    if (!t || pending) return;
    nextKindRef.current = kind ?? null;
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
  const exam = examLabel(profile?.target_exam);
  const promptExam = exam || "exam";

  // Personalisation from data already loaded on the client — no new queries.
  const recommendation = useMemo(() => {
    if (exam) {
      return `You're preparing for ${exam}. Ask me to explain a topic from its syllabus, or start a 3-question quiz.`;
    }
    return "Pick a goal to start: explain a topic, solve a question, or quiz yourself. Set your target exam in Profile and I'll tailor everything to it.";
  }, [exam]);

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col lg:h-[calc(100dvh-9rem)]">
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <img
            src={teacherMark}
            alt="MedEu AI Teacher"
            width={512}
            height={512}
            className="h-10 w-10 shrink-0 rounded-md bg-secondary p-1"
          />
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">AI Teacher</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {pending ? "Teaching…" : "Your personal teacher, available 24/7."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={level} onValueChange={(v) => setLevel(v as TeacherLevel)}>
            <SelectTrigger className="h-8 w-[104px] text-xs" aria-label="Your level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
            <SelectTrigger className="h-8 w-[88px] text-xs" aria-label="Language">
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
      </header>

      {/* Mode switcher */}
      <div className="flex gap-1.5 overflow-x-auto border-y border-border py-2" role="group" aria-label="Teaching mode">
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
                "inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors " +
                (active
                  ? "bg-ink text-ink-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground")
              }
            >
              <m.icon className="h-3.5 w-3.5" />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Conversation */}
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto max-w-2xl gap-6 px-0 py-6">
          {messages.length === 0 && !streaming ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Hi {firstName}, what should we learn today?
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{recommendation}</p>
              </div>
              <div className="grid gap-2">
                {SUGGESTIONS[mode].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => submit(s)}
                    className="rounded-md border border-border px-4 py-3 text-left text-sm transition-colors hover:border-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((m, i) => {
                const meta = m.role === "assistant" && m.kind ? KIND_META[m.kind] : null;
                return (
                  <Message key={i} from={m.role} className="max-w-full">
                    {meta && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                        <meta.icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </div>
                    )}
                    <MessageContent className="group-[.is-assistant]:text-[15px] group-[.is-assistant]:leading-7 group-[.is-user]:max-w-[85%] group-[.is-user]:bg-ink group-[.is-user]:text-ink-foreground">
                      {m.role === "assistant" ? (
                        <MessageResponse>{m.content}</MessageResponse>
                      ) : (
                        <span className="whitespace-pre-wrap">{m.content}</span>
                      )}
                    </MessageContent>
                    {m.role === "assistant" && (
                      <div className="flex items-center gap-0.5">
                        <IconAction
                          label={copiedIdx === i ? "Copied" : "Copy answer"}
                          onClick={() => copy(i, m.content)}
                        >
                          {copiedIdx === i ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </IconAction>
                        <IconAction
                          label={speakingIdx === i ? "Stop voice" : "Listen"}
                          onClick={() => speak(i, m.content)}
                        >
                          {loadingSpeakIdx === i ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : speakingIdx === i ? (
                            <Square className="h-3.5 w-3.5" />
                          ) : (
                            <Volume2 className="h-3.5 w-3.5" />
                          )}
                        </IconAction>
                        {i === messages.length - 1 && !pending && (
                          <IconAction label="Regenerate answer" onClick={regenerate}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                      </div>
                    )}
                  </Message>
                );
              })}

              {(streaming || pending) && (
                <Message from="assistant" className="max-w-full">
                  <MessageContent className="group-[.is-assistant]:text-[15px] group-[.is-assistant]:leading-7">
                    {streaming ? (
                      <MessageResponse isAnimating>{streaming}</MessageResponse>
                    ) : (
                      <Shimmer className="text-sm">Thinking…</Shimmer>
                    )}
                  </MessageContent>
                </Message>
              )}
            </>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {/* Composer */}
      <div className="sticky bottom-0 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] pt-3">
        <div className="mx-auto max-w-2xl">
          <div
            className="-mx-1 mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5"
            aria-label="Quick actions"
          >
            {QUICK_ACTIONS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => {
                  setMode(q.mode);
                  const text = q.prompt(promptExam);
                  if (q.label === "Solve a question") {
                    setInput(text);
                    return;
                  }
                  submit(text, q.kind);
                }}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {q.label}
              </button>
            ))}
          </div>

          <PromptInput
            onSubmit={(message, event) => {
              event.preventDefault();
              submit(message.text ?? input);
            }}
          >
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder={
                mode === "steps"
                  ? "Paste a question to solve step by step…"
                  : mode === "quiz"
                    ? "Which topic should I quiz you on?"
                    : mode === "plan"
                      ? "Tell me your exam and days left…"
                      : "Ask anything — I'll explain it your way…"
              }
            />
            <PromptInputFooter className="justify-end">
              <PromptInputSubmit
                status={pending ? "streaming" : undefined}
                disabled={!pending && !input.trim()}
                onStop={stop}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
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
      className="inline-flex items-center gap-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </button>
  );
}
