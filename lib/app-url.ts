export function resolveAppBaseUrl(req?: Request) {
  const explicit =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (explicit) {
    return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  }

  if (req) {
    try {
      return new URL(req.url).origin;
    } catch {
      // Fallback handled below.
    }
  }

  return "http://localhost:3000";
}
