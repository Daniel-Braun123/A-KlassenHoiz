import { VERBOTENE_WETTBEGRIFFE } from "@/lib/domain/constants";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function assertAllowedCopy(message: string): void {
  const forbidden = VERBOTENE_WETTBEGRIFFE.find((term) =>
    message.toLocaleLowerCase("de-DE").includes(term.toLocaleLowerCase("de-DE")),
  );

  if (forbidden) {
    throw new AppError(`Unzulaessiger Begriff in Nutzertext: ${forbidden}`, "copy_forbidden", 500);
  }
}

export function userMessage(
  message: string,
  code = "user_message",
): { message: string; code: string } {
  assertAllowedCopy(message);
  return { message, code };
}
