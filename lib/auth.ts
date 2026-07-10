import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "laund_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year — personal, phone-installed app

function getSecretKey() {
  const secret = process.env.COOKIE_SECRET;
  if (!secret) {
    throw new Error("COOKIE_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionCookie() {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function verifyToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/**
 * Constant-time string comparison for secrets (passcode, bearer tokens).
 * Hashing first equalizes lengths so timingSafeEqual never throws.
 */
export function secretsMatch(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function verifyPasscode(input: string): boolean {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    throw new Error("APP_PASSCODE environment variable is not set");
  }
  return secretsMatch(input, passcode);
}
