import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

/**
 * `profiles.avatar_url` can hold either an external URL (OAuth provider) or a
 * path inside the private `avatars` bucket. This resolves both to a usable src.
 */
export function useAvatarUrl(avatarUrl: string | null | undefined) {
  const { data } = useQuery({
    queryKey: ["avatar-url", avatarUrl],
    enabled: !!avatarUrl && !/^https?:\/\//.test(avatarUrl),
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(AVATAR_BUCKET)
        .createSignedUrl(avatarUrl!, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });

  if (!avatarUrl) return undefined;
  if (/^https?:\/\//.test(avatarUrl)) return avatarUrl;
  return data ?? undefined;
}
