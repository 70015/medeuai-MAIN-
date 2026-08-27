import { cn } from "@/lib/utils";
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
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

/**
 * Compact, polished social follow buttons used in public-facing footers.
 */
export function SocialLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <a
        href="https://www.instagram.com/medeu.ai/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow MedEu.Ai on Instagram"
        className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Instagram className="h-4 w-4" />
      </a>
      <a
        href="https://www.linkedin.com/company/medeuai/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow MedEu.Ai on LinkedIn"
        className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Linkedin className="h-4 w-4" />
      </a>
      <a
        href="https://www.youtube.com/@MedEuAI"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow MedEu.Ai on YouTube"
        className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Youtube className="h-4 w-4" />
      </a>
      <a
        href="https://www.facebook.com/profile.php?id=61592986388555"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Follow MedEu.Ai on Facebook"
        className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
      >
        <Facebook className="h-4 w-4" />
      </a>
    </div>
  );
}
