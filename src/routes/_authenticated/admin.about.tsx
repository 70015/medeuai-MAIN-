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
  head: () => ({ meta: [{ title: "About editor — Admin" }] }),
  component: AdminAboutEditor,
});

type AboutRow = {
  id?: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  story_title: string | null;
  story_paragraphs: string[] | null;
  founder_name: string | null;
  founder_position: string | null;
  founder_quote: string | null;
  founder_image_url: string | null;
};

const EMPTY: AboutRow = {
  hero_title: "",
  hero_subtitle: "",
  story_title: "",
  story_paragraphs: [],
  founder_name: "",
  founder_position: "",
  founder_quote: "",
  founder_image_url: "",
};

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
      return data as AboutRow | null;
    },
  });

  const [form, setForm] = useState<AboutRow>(EMPTY);
  const [paragraphsText, setParagraphsText] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [signedFounder, setSignedFounder] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data) {
      setForm({ ...EMPTY, ...data });
      setParagraphsText((data.story_paragraphs ?? []).join("\n\n"));
    }
  }, [data]);

  useEffect(() => {
    const raw = form.founder_image_url;
    if (!raw) { setSignedFounder(null); return; }
    const match = raw.match(/about-media\/(.+)$/);
    const path = match ? match[1] : raw;
    supabase.storage.from("about-media").createSignedUrl(path, 3600)
      .then(({ data }) => setSignedFounder(data?.signedUrl ?? null));
  }, [form.founder_image_url]);

  function set<K extends keyof AboutRow>(k: K, v: AboutRow[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `founder/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("about-media").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      set("founder_image_url", path);
      toast.success("Image uploaded — remember to save.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const paragraphs = paragraphsText
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        hero_title: form.hero_title ?? undefined,
        hero_subtitle: form.hero_subtitle ?? undefined,
        story_title: form.story_title ?? undefined,
        story_paragraphs: paragraphs,
        founder_name: form.founder_name ?? undefined,
        founder_position: form.founder_position ?? undefined,
        founder_quote: form.founder_quote ?? undefined,
        founder_image_url: form.founder_image_url ?? undefined,
        singleton: true,
      };

      const { error } = form.id
        ? await supabase.from("about_content").update(payload).eq("id", form.id)
        : await supabase.from("about_content").insert(payload);

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
      <div className="flex items-center justify-between">
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
          <Input value={form.hero_title ?? ""} onChange={(e) => set("hero_title", e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label>Hero subtitle</Label>
          <Textarea rows={3} value={form.hero_subtitle ?? ""} onChange={(e) => set("hero_subtitle", e.target.value)} />
        </div>
      </Card>

      <Card className="space-y-4 border-border/60 bg-card/40 p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Story</h3>
        <div className="grid gap-2">
          <Label>Story title</Label>
          <Input value={form.story_title ?? ""} onChange={(e) => set("story_title", e.target.value)} />
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

      <Card className="space-y-4 border-border/60 bg-card/40 p-6">
        <h3 className="text-sm font-semibold text-muted-foreground">Founder</h3>
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <div className="grid h-40 w-40 place-items-center overflow-hidden rounded-xl bg-muted ring-1 ring-border/60">
              {signedFounder ? (
                <img src={signedFounder} alt="Founder" className="h-full w-full object-cover" />
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
              className="w-40"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Upload photo
            </Button>
          </div>
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label>Founder name</Label>
              <Input value={form.founder_name ?? ""} onChange={(e) => set("founder_name", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Position</Label>
              <Input value={form.founder_position ?? ""} onChange={(e) => set("founder_position", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Quote</Label>
              <Textarea rows={3} value={form.founder_quote ?? ""} onChange={(e) => set("founder_quote", e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Image path / URL</Label>
              <Input
                value={form.founder_image_url ?? ""}
                onChange={(e) => set("founder_image_url", e.target.value)}
                placeholder="founder/photo.jpg"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
