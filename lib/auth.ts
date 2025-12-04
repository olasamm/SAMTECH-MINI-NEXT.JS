import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthUserById } from "./authStore";
import type { User } from "./types";

const TOKEN_NAME = "auth_token";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export function signAuthToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyAuthToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<User | null> {
  const store = cookies();
  const allCookies = store.getAll();
  console.log("[getCurrentUserFromCookies] All cookies:", allCookies);
  const token = store.get(TOKEN_NAME)?.value;
  console.log("[getCurrentUserFromCookies] Token:", token);
  if (!token) return null;

  const userId = verifyAuthToken(token);
  console.log("[getCurrentUserFromCookies] userId:", userId);
  if (!userId) return null;

  const authUser = getAuthUserById(userId);
  if (!authUser) return null;

  const { passwordHash: _p, email: _e, ...user } = authUser;
  return user;
}

export function setAuthCookie(userId: string, response?: NextResponse) {
  const token = signAuthToken(userId);
  const isProd = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd ? true : false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  };
  console.log("[setAuthCookie] Setting cookie:", {
    TOKEN_NAME,
    token,
    cookieOptions,
    userId
  });
  if (response) {
    response.cookies.set(TOKEN_NAME, token, cookieOptions);
  } else {
    cookies().set(TOKEN_NAME, token, cookieOptions);
  }
}

export function clearAuthCookie(response?: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };

  if (response) {
    response.cookies.set(TOKEN_NAME, "", cookieOptions);
  } else {
    cookies().set(TOKEN_NAME, "", cookieOptions);
  }
}


