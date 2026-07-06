import { describe, expect, it } from "vitest";

import { resolveTeamLogo } from "@/components/admin/team-logo";
import {
  createTeam,
  deleteTeam,
  updateTeam,
  type TeamRecord,
  type TeamsRepository,
} from "@/lib/domain/teams-repository";

function createRepository(): TeamsRepository & { teams: Map<string, TeamRecord> } {
  const teams = new Map<string, TeamRecord>();

  return {
    teams,
    async getAktiveMitgliedschaft(_tipprundeId, nutzerId) {
      if (nutzerId === "admin-1") {
        return { rolle: "admin" };
      }

      if (nutzerId === "coadmin-1") {
        return { rolle: "co_admin" };
      }

      if (nutzerId === "nutzer-1") {
        return { rolle: "nutzer" };
      }

      return null;
    },
    async insertTeam(input) {
      const normalizedName = input.name.trim().toLowerCase();
      if (
        [...teams.values()].some(
          (team) =>
            team.tipprundeId === input.tipprundeId &&
            team.name.trim().toLowerCase() === normalizedName,
        )
      ) {
        throw Object.assign(new Error("duplicate"), { code: "verein_name_duplicate" });
      }

      const team: TeamRecord = {
        id: `team-${teams.size + 1}`,
        tipprundeId: input.tipprundeId,
        name: input.name,
        logoUrl: input.logoUrl,
      };
      teams.set(team.id, team);
      return team;
    },
    async updateTeam(teamId, input) {
      const team = teams.get(teamId);
      if (!team) {
        throw new Error("not found");
      }

      const updated = { ...team, ...input };
      teams.set(teamId, updated);
      return updated;
    },
    async deleteTeam(teamId) {
      teams.delete(teamId);
    },
    async listTeams(tipprundeId) {
      return [...teams.values()].filter((team) => team.tipprundeId === tipprundeId);
    },
  };
}

describe("US3 Teams/Vereine", () => {
  it("allows Admins and Co-Admins to create, edit and delete Vereine", async () => {
    const repository = createRepository();

    const team = await createTeam(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      name: "FC Hoiz",
      logoUrl: "https://example.com/logo.png",
    });
    expect(team).toMatchObject({
      name: "FC Hoiz",
      logoUrl: "https://example.com/logo.png",
    });

    const updated = await updateTeam(repository, {
      tipprundeId: "tipprunde-1",
      teamId: team.id,
      callerNutzerId: "coadmin-1",
      name: "FC Hoiz II",
      logoUrl: "",
    });
    expect(updated).toMatchObject({ name: "FC Hoiz II", logoUrl: null });

    await deleteTeam(repository, {
      tipprundeId: "tipprunde-1",
      teamId: team.id,
      callerNutzerId: "coadmin-1",
    });
    expect(repository.teams.has(team.id)).toBe(false);
  });

  it("rejects normal Nutzer, blank Vereinsnamen and duplicate names per Tipprunde", async () => {
    const repository = createRepository();

    await expect(
      createTeam(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "nutzer-1",
        name: "FC Hoiz",
        logoUrl: null,
      }),
    ).rejects.toMatchObject({ code: "content_manager_required" });

    await expect(
      createTeam(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        name: "   ",
        logoUrl: null,
      }),
    ).rejects.toMatchObject({ code: "verein_name_required" });

    await createTeam(repository, {
      tipprundeId: "tipprunde-1",
      callerNutzerId: "admin-1",
      name: "FC Hoiz",
      logoUrl: null,
    });
    await expect(
      createTeam(repository, {
        tipprundeId: "tipprunde-1",
        callerNutzerId: "admin-1",
        name: " fc hoiz ",
        logoUrl: null,
      }),
    ).rejects.toMatchObject({ code: "verein_name_duplicate" });

    await expect(
      createTeam(repository, {
        tipprundeId: "tipprunde-2",
        callerNutzerId: "admin-1",
        name: "FC Hoiz",
        logoUrl: null,
      }),
    ).resolves.toMatchObject({ name: "FC Hoiz" });
  });

  it("uses a neutral fallback logo when Logo-URL is missing, invalid or failed", () => {
    expect(resolveTeamLogo(null, false)).toMatchObject({ shouldUseFallback: true });
    expect(resolveTeamLogo("notaurl", false)).toMatchObject({ shouldUseFallback: true });
    expect(resolveTeamLogo("https://example.com/logo.png", true)).toMatchObject({
      shouldUseFallback: true,
    });
    expect(resolveTeamLogo("https://example.com/logo.png", false)).toMatchObject({
      shouldUseFallback: false,
      src: "https://example.com/logo.png",
    });
  });

  it("extracts the direct image URL from Bing image result links", () => {
    const logo = resolveTeamLogo(
      "https://www.bing.com/images/search?view=detailV2&mediaurl=https%3a%2f%2fcdn.fupa.net%2fclub%2fpng%2f200x200%2fUvoE2jwD86Gx1BwW1rlk2RI7UMhD3RMAfzquGWwv",
      false,
    );

    expect(logo).toMatchObject({
      shouldUseFallback: false,
      src: "https://cdn.fupa.net/club/png/200x200/UvoE2jwD86Gx1BwW1rlk2RI7UMhD3RMAfzquGWwv",
    });
  });
});
