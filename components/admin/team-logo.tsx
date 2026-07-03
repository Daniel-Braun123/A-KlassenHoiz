"use client";

import Image from "next/image";
import { useState } from "react";

export const FALLBACK_LOGO_LABEL = "Fallback-Logo";

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
    const url = new URL(logoUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { shouldUseFallback: true, src: null };
    }
  } catch {
    return { shouldUseFallback: true, src: null };
  }

  return { shouldUseFallback: false, src: logoUrl };
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
