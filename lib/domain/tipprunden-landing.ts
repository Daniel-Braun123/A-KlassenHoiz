export type TipprundenLandingInput = {
  tipprunden: Array<{ id: string }>;
  lastActiveTipprundeId?: string | null;
};

export type TipprundenLandingDecision =
  { type: "onboarding" } | { type: "open"; tipprundeId: string } | { type: "selection" };

export function chooseTipprundenLanding(input: TipprundenLandingInput): TipprundenLandingDecision {
  if (input.tipprunden.length === 0) {
    return { type: "onboarding" };
  }

  if (input.tipprunden.length === 1) {
    return { type: "open", tipprundeId: input.tipprunden[0].id };
  }

  if (
    input.lastActiveTipprundeId &&
    input.tipprunden.some((entry) => entry.id === input.lastActiveTipprundeId)
  ) {
    return { type: "open", tipprundeId: input.lastActiveTipprundeId };
  }

  return { type: "selection" };
}
