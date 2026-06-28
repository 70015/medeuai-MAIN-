import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState, useEffect } from "react";
import { Brain, Loader2, Send, Sparkles, Volume2, Square } from "lucide-react";
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
import { askAITeacher } from "@/lib/ai-teacher.functions";
import { synthesizeSpeech } from "@/lib/ai-tts.functions";
import { useProfile } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/ai-teacher")({
  head: () => ({ meta: [{ title: "AI Teacher — ParikshaSathi" }] }),
  component: AITeacherPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Time-speed-distance trick",
  "Syllogism shortcut",
  "Fundamental Rights vs DPSP",
  "Modern history key dates",
];

function AITeacherPage() {
  const { data: profile } = useProfile();
  const ask = useServerFn(askAITeacher);
  const tts = useServerFn(synthesizeSpeech);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<"english" | "bengali" | "hindi">(
    (profile?.preferred_language as "english" | "bengali" | "hindi") ?? "english",
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [loadingSpeakIdx, setLoadingSpeakIdx] = useState<number | null>(null);

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
      const plain = text.replace(/[#*_`~>\-]/g, " ").replace(/\s+/g, " ").trim();
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

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <h1 className="truncate text-base font-bold tracking-tight sm:text-lg">AI Teacher</h1>
        </div>
        <Select value={language} onValueChange={(v) => setLanguage(v as typeof language)}>
          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="english">English</SelectItem>
            <SelectItem value="bengali">বাংলা</SelectItem>
            <SelectItem value="hindi">हिन्दी</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card ref={scrollRef} className="flex-1 overflow-y-auto border-border/60 bg-card/40 p-3 sm:p-4">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-md space-y-3">
              <Sparkles className="mx-auto h-7 w-7 text-primary" />
              <p className="text-sm text-muted-foreground">
                Hi {profile?.full_name?.split(" ")[0] ?? "there"}! Pick a starter or ask anything.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
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
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "group relative max-w-[90%] rounded-2xl rounded-tl-sm bg-secondary/60 px-3 py-2 text-[13px] leading-relaxed text-foreground"
                  }
                >
                  {m.role === "assistant" ? (
                    <>
                      <div className="prose prose-sm prose-invert max-w-none break-words [&_code]:rounded [&_code]:bg-background/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[12px] [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:pl-5 [&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 [&_strong]:text-foreground [&_ul]:my-1 [&_ul]:pl-5">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                      <div className="mt-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => speak(i, m.content)}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-background/50 hover:text-foreground"
                          aria-label={speakingIdx === i ? "Stop voice" : "Play voice"}
                        >
                          {loadingSpeakIdx === i ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : speakingIdx === i ? (
                            <Square className="h-3 w-3" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
                          {speakingIdx === i ? "Stop" : "Listen"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="whitespace-pre-wrap">{m.content}</span>
                  )}
                </div>
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
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          rows={1}
          className="max-h-32 min-h-[44px] resize-none rounded-2xl bg-card/60 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(input);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
          disabled={send.isPending || !input.trim()}
        >
          {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
