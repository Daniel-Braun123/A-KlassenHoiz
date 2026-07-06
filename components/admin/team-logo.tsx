"use client";

import Image from "next/image";
import { useState } from "react";

export const FALLBACK_LOGO_LABEL = "Fallback-Logo";

function resolveDirectImageUrl(logoUrl: string): string {
  const url = new URL(logoUrl);

  if (url.hostname.endsWith("bing.com") && url.pathname.includes("/images/search")) {
    const embeddedImageUrl = url.searchParams.get("mediaurl") ?? url.searchParams.get("cdnurl");
    if (embeddedImageUrl) {
      return embeddedImageUrl;
    }
  }

  return logoUrl;
}

export function resolveTeamLogo(
  logoUrl: string | null | undefined,
  hasLoadError: boolean,
): { shouldUseFallback: boolean; src: string | null } {
  if (hasLoadError) {
    return { shouldUseFallback: true, src: null };
  }

  if (!logoUrl) {
    return { shouldUseFallback: true, src: null };
  }

  try {
    const directImageUrl = resolveDirectImageUrl(logoUrl);
    const url = new URL(directImageUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { shouldUseFallback: true, src: null };
    }

    return { shouldUseFallback: false, src: directImageUrl };
  } catch {
    return { shouldUseFallback: true, src: null };
  }
}

export function TeamLogo({ logoUrl, name }: { logoUrl?: string | null; name: string }) {
  const [hasLoadError, setHasLoadError] = useState(false);
  const logo = resolveTeamLogo(logoUrl, hasLoadError);

  if (logo.shouldUseFallback || !logo.src) {
    return (
      <span className="fallback-logo" aria-label={FALLBACK_LOGO_LABEL} title={FALLBACK_LOGO_LABEL}>
        {name.slice(0, 2).toUpperCase() || "AK"}
      </span>
    );
  }

  return (
    <Image
      src={logo.src}
      alt={`${name} Logo`}
      width={44}
      height={44}
      unoptimized
      onError={() => setHasLoadError(true)}
    />
  );
}
