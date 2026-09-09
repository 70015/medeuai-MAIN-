import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Save, Upload, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/admin/about")({
  head: () => ({ meta: [{ title: "About editor, Admin" }] }),
  component: AdminAboutEditor,
});

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X (Twitter)" },
  { key: "youtube", label: "YouTube" },
  { key: "telegram", label: "Telegram" },
  { key: "website", label: "Website" },
] as const;

const TEXT_KEYS = [
  "hero_title",
  "hero_subtitle",
  "story_title",
  "founder_name",
  "founder_position",
  "founder_quote",
  "founder_image_url",
  "cofounder_name",
  "cofounder_position",
  "cofounder_quote",
  "cofounder_image_url",
  ...SOCIAL_FIELDS.flatMap((s) => [`founder_social_${s.key}`, `cofounder_social_${s.key}`]),
] as const;

type Form = Record<string, string> & { id?: string };

const EMPTY: Form = Object.fromEntries(TEXT_KEYS.map((k) => [k, ""])) as Form;

function AdminAboutEditor() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-about"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("about_content")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Record<string, unknown> | null;
    },
  });

  const [form, setForm] = useState<Form>(EMPTY);
  const [paragraphsText, setParagraphsText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const next: Form = { ...EMPTY };
    for (const k of TEXT_KEYS) {
      const v = data[k];
      next[k] = typeof v === "string" ? v : "";
    }
    if (typeof data["id"] === "string") next.id = data["id"];
    setForm(next);
    setParagraphsText(((data["story_paragraphs"] as string[] | null) ?? []).join("\n\n"));
  }, [data]);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const paragraphs = paragraphsText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const payload: Record<string, unknown> = { singleton: true, story_paragraphs: paragraphs };
      for (const k of TEXT_KEYS) payload[k] = form[k]?.trim() ?? "";

      const table = supabase.from("about_content");
      const { error } = form.id
        ? await table.update(payload as never).eq("id", form.id)
        : await table.insert(payload as never);

      if (error) throw error;
      toast.success("About page saved");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">About page</h2>
          <p className="text-sm text-muted-foreground">
            Edit the content shown on <code>/about</code>. Changes are live after saving.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Save changes
        </Button>
      </div>

      <Card className="space-y-4 border-border/60 bg-card/40 p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Hero</h3>
        <div className="grid gap-2">
          <Label>Hero title</Label>
          <Input value={form.hero_title} onChange={(e) => set("hero_title", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Hero subtitle</Label>
          <Textarea rows={3} value={form.hero_subtitle} onChange={(e) => set("hero_subtitle", e.target.value)} />
        </div>
      </Card>

      <Card className="space-y-4 border-border/60 bg-card/40 p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Story</h3>
        <div className="grid gap-2">
          <Label>Story title</Label>
          <Input value={form.story_title} onChange={(e) => set("story_title", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Story paragraphs (separate with a blank line)</Label>
          <Textarea
            rows={8}
            value={paragraphsText}
            onChange={(e) => setParagraphsText(e.target.value)}
            placeholder={"First paragraph…\n\nSecond paragraph…"}
          />
        </div>
      </Card>

      <PersonEditor
        title="Founder"
        prefix="founder"
        form={form}
        set={set}
        namePlaceholder="Full name"
        positionPlaceholder="Founder & CEO"
      />

      <PersonEditor
        title="Co-founder"
        prefix="cofounder"
        form={form}
        set={set}
        namePlaceholder="Full name"
        positionPlaceholder="Co-founder"
        note="The co-founder card stays hidden on the public About page until a name is saved here."
      />
    </div>
  );
}

function PersonEditor({
  title,
  prefix,
  form,
  set,
  namePlaceholder,
  positionPlaceholder,
  note,
}: {
  title: string;
  prefix: string;
  form: Form;
  set: (k: string, v: string) => void;
  namePlaceholder: string;
  positionPlaceholder: string;
  note?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [signed, setSigned] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageKey = `${prefix}_image_url`;
  const raw = form[imageKey] ?? "";

  useEffect(() => {
    setImageLoaded(false);
    if (!raw) {
      setSigned(null);
      return;
    }
    if (/^https?:\/\//.test(raw)) {
      setSigned(raw);
      return;
    }
    const match = raw.match(/about-media\/(.+)$/);
    const path = match ? match[1] : raw;
    supabase.storage
      .from("about-media")
      .createSignedUrl(path, 3600)
      .then(({ data }) => setSigned(data?.signedUrl ?? null));
  }, [raw]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${prefix}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("about-media").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      set(imageKey, path);
      toast.success("Image uploaded, remember to save.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="space-y-4 border-border/60 bg-card/40 p-6">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
        {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-[160px_1fr]">
        <div className="space-y-2">
          <div className="mx-auto grid h-40 w-40 place-items-center overflow-hidden rounded-xl bg-muted ring-1 ring-border/60 md:mx-0">
            {signed ? (
              <img
                src={signed}
                alt={title}
                onLoad={() => setImageLoaded(true)}
                className={`h-full w-full object-cover motion-safe:transition-[opacity,transform] motion-safe:duration-700 motion-safe:ease-out ${
                  imageLoaded ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
                }`}
              />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleUpload(f);
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mx-auto w-40 md:mx-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
            {signed ? "Change photo" : "Upload photo"}
          </Button>
        </div>
        <div className="space-y-3">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              value={form[`${prefix}_name`] ?? ""}
              placeholder={namePlaceholder}
              onChange={(e) => set(`${prefix}_name`, e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Designation / title</Label>
            <Input
              value={form[`${prefix}_position`] ?? ""}
              placeholder={positionPlaceholder}
              onChange={(e) => set(`${prefix}_position`, e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Quote</Label>
            <Textarea
              rows={3}
              value={form[`${prefix}_quote`] ?? ""}
              onChange={(e) => set(`${prefix}_quote`, e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Image path / URL</Label>
            <Input
              value={raw}
              onChange={(e) => set(imageKey, e.target.value)}
              placeholder={`${prefix}/photo.jpg`}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Social links (leave blank to hide)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SOCIAL_FIELDS.map((s) => (
            <div key={s.key} className="grid gap-2">
              <Label>{s.label}</Label>
              <Input
                value={form[`${prefix}_social_${s.key}`] ?? ""}
                onChange={(e) => set(`${prefix}_social_${s.key}`, e.target.value)}
                placeholder="Full link or @handle"
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
