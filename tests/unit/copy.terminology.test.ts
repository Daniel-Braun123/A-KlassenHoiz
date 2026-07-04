import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { VERBOTENE_WETTBEGRIFFE } from "@/lib/domain/constants";

const COPY_FILES = [
  "app/page.tsx",
  "app/profil/page.tsx",
  "app/admin/tipprunden/neu/page.tsx",
  "app/manifest.ts",
  "app/layout.tsx",
  "components/admin/einladung-panel.tsx",
  "components/admin/ergebnis-form.tsx",
  "components/admin/spielplan-admin.tsx",
  "components/admin/tipprunde-admin-overview.tsx",
  "components/admin/tipprunde-create-form.tsx",
  "components/auth/login-form.tsx",
  "components/auth/register-form.tsx",
  "components/pwa/mobile-shell.tsx",
  "components/pwa/no-connection-message.tsx",
  "components/tipps/einladung-join-form.tsx",
  "components/tipps/spieltag-tipps.tsx",
  "components/tipps/tipp-card.tsx",
  "components/tipps/tipprunden-switcher.tsx",
];

function fileText(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Copy terminology", () => {
  it("avoids betting terminology in user-facing copy", () => {
    const matches = COPY_FILES.flatMap((file) => {
      const text = fileText(file);
      return VERBOTENE_WETTBEGRIFFE.filter((term) =>
        new RegExp(`\\b${term}\\b`, "iu").test(text),
      ).map((term) => `${file}: ${term}`);
    });

    expect(matches).toEqual([]);
  });
});
