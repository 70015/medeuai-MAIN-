import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  AVATAR_ACCEPTED,
  AVATAR_BUCKET,
  AVATAR_MAX_BYTES,
  useAvatarUrl,
} from "@/lib/avatar";

/**
 * Per-user profile photo. Files live in the private `avatars` bucket under
 * `<user id>/…`, and `profiles.avatar_url` stores that path — the same field
 * already used everywhere an avatar is shown.
 */
export function ProfilePhoto({
  userId,
  avatarUrl,
  initials,
  name,
}: {
  userId: string;
  avatarUrl: string | null;
  initials: string;
  name: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const savedSrc = useAvatarUrl(avatarUrl);
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(selected: File | undefined) {
    if (!selected) return;
    setError(null);
    if (!AVATAR_ACCEPTED.includes(selected.type)) {
      setError("Please choose a JPG, PNG or WebP image.");
      return;
    }
    if (selected.size > AVATAR_MAX_BYTES) {
      setError("That image is larger than 5 MB. Please choose a smaller one.");
      return;
    }
    setFile(selected);
    setPreviewSrc(URL.createObjectURL(selected));
  }

  function cancel() {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function savePhoto() {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", userId);
      if (dbErr) throw dbErr;

      // Best-effort cleanup of the previous upload (own folder only).
      if (avatarUrl && !/^https?:\/\//.test(avatarUrl) && avatarUrl.startsWith(`${userId}/`)) {
        await supabase.storage.from(AVATAR_BUCKET).remove([avatarUrl]);
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      cancel();
      toast.success("Profile photo updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not upload your photo";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const shown = previewSrc ?? savedSrc;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0">
        <Avatar className="h-20 w-20 border border-white/15">
          <AvatarImage src={shown} alt={name ? `${name}'s profile photo` : "Your profile photo"} />
          <AvatarFallback className="bg-[#03824F] text-lg font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        {saving && (
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/50">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept={AVATAR_ACCEPTED.join(",")}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {file ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={savePhoto}
              disabled={saving}
              className="bg-[#03824F] text-white hover:bg-[#02663E]"
            >
              {saving && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              Save photo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={cancel}
              disabled={saving}
              className="text-white/80 hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
          >
            <Camera className="mr-1.5 h-4 w-4" />
            {avatarUrl ? "Change photo" : "Upload photo"}
          </Button>
        )}
        <p className="mt-2 text-xs text-white/50">
          {file ? "Preview shown — save to apply." : "JPG, PNG or WebP · up to 5 MB."}
        </p>
        {error && <p className="mt-1 text-xs font-medium text-white">{error}</p>}
      </div>
    </div>
  );
}
