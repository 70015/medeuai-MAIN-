import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Brain, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand-logo";

/**
 * Presentation-only onboarding. Answers are stored in localStorage —
 * no schema, backend or auth behaviour is touched.
 */

const STORAGE_KEY = "medeuai-onboarding";

const EXAMS = [
  "SSC CGL",
  "SSC CHSL",
  "Railway",
  "Banking",
  "WBCS",
  "WBPSC",
  "Police",
  "Other",
];

const SUBJECTS = [
  "Quantitative Aptitude",
  "Reasoning",
  "English",
  "General Awareness",
  "Current Affairs",
  "History",
  "Geography",
  "Polity",
  "Science",
  "Bengali",
];

const LEVELS = [
  { label: "Just starting", desc: "New to this exam — build the basics first." },
  { label: "Intermediate", desc: "Know the syllabus, need practice and speed." },
  { label: "Advanced", desc: "Revising and targeting a top rank." },
];

type Answers = {
  exam: string | null;
  subjects: string[];
  level: string | null;
};

export function OnboardingFlow({ name }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ exam: null, subjects: [], level: null });

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setOpen(true);
    } catch {
      /* storage unavailable — skip onboarding */
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...answers, at: Date.now() }));
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const canContinue = useMemo(() => {
    if (step === 0) return !!answers.exam;
    if (step === 1) return answers.subjects.length > 0;
    if (step === 2) return !!answers.level;
    return true;
  }, [step, answers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-background sm:items-center sm:p-6">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-none border-border bg-card sm:rounded-lg sm:border">
        {/* header */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <BrandMark className="h-8 w-8" />
            MedEu<span className="-ml-2 text-primary">.Ai</span>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={
                  "h-1.5 rounded-full transition-all " +
                  (i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary" : "w-1.5 bg-border")
                }
              />
            ))}
          </div>
        </div>

        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {step === 0 && (
            <StepShell
              eyebrow="Step 1 of 4"
              title="What are you preparing for?"
              subtitle="We'll shape your practice around this exam. You can change it later."
            >
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {EXAMS.map((e) => (
                  <ChoiceTile
                    key={e}
                    label={e}
                    selected={answers.exam === e}
                    onClick={() => setAnswers((a) => ({ ...a, exam: e }))}
                  />
                ))}
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell
              eyebrow="Step 2 of 4"
              title="What subjects do you want help with?"
              subtitle="Pick as many as you like — your AI teacher will prioritise these."
            >
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => {
                  const selected = answers.subjects.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setAnswers((a) => ({
                          ...a,
                          subjects: selected
                            ? a.subjects.filter((x) => x !== s)
                            : [...a.subjects, s],
                        }))
                      }
                      className={
                        "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors " +
                        (selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-foreground hover:bg-secondary")
                      }
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {s}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <StepShell
              eyebrow="Step 3 of 4"
              title="What is your current preparation level?"
              subtitle="This sets how deeply your AI teacher explains things."
            >
              <div className="space-y-2.5">
                {LEVELS.map((l) => {
                  const selected = answers.level === l.label;
                  return (
                    <button
                      key={l.label}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setAnswers((a) => ({ ...a, level: l.label }))}
                      className={
                        "flex w-full items-start gap-3 rounded-md border p-4 text-left transition-colors " +
                        (selected
                          ? "border-primary bg-secondary"
                          : "border-border bg-background hover:bg-secondary")
                      }
                    >
                      <span
                        className={
                          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border " +
                          (selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border")
                        }
                      >
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span>
                        <span className="block text-sm font-bold">{l.label}</span>
                        <span className="mt-0.5 block text-sm text-muted-foreground">{l.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          )}

          {step === 3 && (
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-lg bg-ink text-ink-foreground">
                <Brain className="h-7 w-7" />
              </span>
              <h2 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Meet your AI Teacher.
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
                MedEu is ready to help you learn, practice and improve.
              </p>
              <div className="mx-auto mt-7 max-w-md rounded-md border border-border bg-secondary p-4 text-left text-sm">
                <div className="font-semibold">Your plan</div>
                <ul className="mt-2 space-y-1.5 text-muted-foreground">
                  <li>
                    <span className="font-medium text-foreground">Exam:</span>{" "}
                    {answers.exam ?? "—"}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Focus:</span>{" "}
                    {answers.subjects.length ? answers.subjects.join(", ") : "—"}
                  </li>
                  <li>
                    <span className="font-medium text-foreground">Level:</span>{" "}
                    {answers.level ?? "—"}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-8">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip for now
            </Button>
          )}
          {step < 3 ? (
            <Button size="sm" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
              Continue <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          ) : (
            <Button size="sm" onClick={finish}>
              Start learning{name ? `, ${name}` : ""} <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</div>
      <h2 className="mt-3 text-balance text-2xl font-extrabold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function ChoiceTile({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={
        "rounded-md border px-3 py-4 text-sm font-semibold transition-colors " +
        (selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-secondary")
      }
    >
      {label}
    </button>
  );
}
