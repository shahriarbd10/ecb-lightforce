import { NextResponse } from "next/server";

export function dbAwareErrorResponse(defaultMessage: string, error: unknown) {
  const text = String((error as any)?.message || error || "");
  const isDbUnavailable =
    text.includes("MongoDB SRV lookup failed") ||
    text.includes("querySrv") ||
    text.includes("ECONNREFUSED") ||
    text.includes("Server selection timed out");

  if (isDbUnavailable) {
    return NextResponse.json(
      {
        message: "Database unavailable. Update MONGODB_URI to Atlas non-SRV URI (mongodb://...) and check Atlas IP allowlist.",
        error: process.env.NODE_ENV === "development" ? text : undefined
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      message: defaultMessage,
      error: process.env.NODE_ENV === "development" ? text : undefined
    },
    { status: 500 }
  );
}
