import { cn } from "@/lib/utils";
import logoAsset from "@/assets/medeu-ai-logo.jpg.asset.json";

/** Official MedEu.Ai logo, used unmodified. */
export const BRAND_LOGO_URL = logoAsset.url;
export const BRAND_NAME = "MedEu.Ai";
export const BRAND_TAGLINE = "Your Personal AI Teacher, 24/7.";

/**
 * The official mark, rendered with object-contain so the complete logo
 * (emblem + wordmark + tagline) stays intact at every size.
 */
export function BrandMark({
  className,
  alt = "MedEu.Ai logo",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn("block h-9 w-9 shrink-0 object-contain", className)}
    />
  );
}

/**
 * Inline lockup for headers/navigation: the official mark plus the product
 * name in text so the brand stays legible at small mobile sizes.
 */
export function BrandLockup({
  className,
  markClassName,
  textClassName,
  showName = true,
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showName?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <BrandMark className={markClassName} />
      {showName && (
        <span className={cn("text-base font-bold tracking-tight", textClassName)}>
          MedEu<span className="text-primary">.Ai</span>
        </span>
      )}
    </span>
  );
}

/**
 * Large, fully legible presentation of the official logo for hero-style
 * surfaces (auth, onboarding, about, loading screens).
 */
export function BrandLogoFull({ className }: { className?: string }) {
  return (
    <img
      src={BRAND_LOGO_URL}
      alt="MedEu.Ai — Your Personal AI Teacher, 24/7."
      decoding="async"
      className={cn("mx-auto h-40 w-auto max-w-full object-contain sm:h-52", className)}
    />
  );
}
