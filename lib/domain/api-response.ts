import { NextResponse } from "next/server";

import { AppError } from "@/lib/domain/errors";

export function jsonError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  return NextResponse.json(
    { error: { code: "internal_error", message: "Ein unerwarteter Fehler ist aufgetreten." } },
    { status: 500 },
  );
}
