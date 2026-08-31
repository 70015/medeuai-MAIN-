import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const BUCKET = "article-media";

/** Public URL served by our own proxy route (bucket itself stays private). */
export function articleImageUrl(path: string) {
  return `/api/public/article-image?path=${encodeURIComponent(path)}`;
}

export type PickedImage = { src: string; alt: string; caption: string };

export function MediaDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (image: PickedImage) => void;
}) {
  const [src, setSrc] = useState("");
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);

  const library = useQuery({
    queryKey: ["article-media"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .list("", { limit: 100, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw new Error(error.message);
      return (data ?? []).filter((f) => f.id);
    },
  });

  async function upload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw new Error(error.message);
      setSrc(articleImageUrl(path));
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
      library.refetch();
      toast.success("Image uploaded");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setSrc("");
    setAlt("");
    setCaption("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Insert image</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="upload">
          <TabsList className="w-full">
            <TabsTrigger value="upload" className="flex-1">
              Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="flex-1">
              Media library
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-3 space-y-2">
            <Input
              type="file"
              accept="image/*"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload(file);
              }}
            />
            {uploading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            ) : null}
            <div>
              <Label htmlFor="img-url" className="text-xs">
                Or paste an image URL
              </Label>
              <Input
                id="img-url"
                value={src}
                onChange={(e) => setSrc(e.target.value)}
                placeholder="https://…"
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-3">
            {library.isLoading ? (
              <p className="text-xs text-muted-foreground">Loading…</p>
            ) : (library.data?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">
                No images uploaded yet.
              </p>
            ) : (
              <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto">
                {library.data!.map((f) => {
                  const url = articleImageUrl(f.name);
                  return (
                    <button
                      key={f.name}
                      type="button"
                      onClick={() => setSrc(url)}
                      className={cn(
                        "overflow-hidden rounded border border-border/60",
                        src === url && "ring-2 ring-primary",
                      )}
                    >
                      <img
                        src={url}
                        alt={f.name}
                        className="aspect-square w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <div>
            <Label htmlFor="img-alt" className="text-xs">
              Alt text
            </Label>
            <Input
              id="img-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe the image"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="img-cap" className="text-xs">
              Caption (optional)
            </Label>
            <Input
              id="img-cap"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={!src.trim()}
            onClick={() => {
              onPick({ src: src.trim(), alt: alt.trim(), caption: caption.trim() });
              reset();
              onOpenChange(false);
            }}
          >
            <Upload className="mr-1 h-4 w-4" /> Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
