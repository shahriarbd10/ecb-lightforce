import crypto from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MS = 1000 * 60 * 30;

export function generatePasswordResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashPasswordResetToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getPasswordResetExpiryDate() {
  return new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
}
