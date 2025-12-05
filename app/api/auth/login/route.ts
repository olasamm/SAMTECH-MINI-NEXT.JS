import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { findAuthUserByEmailOrHandle } from "@/lib/authStore";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json();
  const { identifier, password } = body as {
    identifier?: string;
    password?: string;
  };

  console.log("Login attempt:", { identifier, hasPassword: !!password });

  if (!identifier || !password) {
    return NextResponse.json(
      { error: "Identifier and password are required" },
      { status: 400 }
    );
  }

  const normalizedIdentifier = identifier.trim();
  console.log("Normalized identifier:", normalizedIdentifier);
  
  const user = await findAuthUserByEmailOrHandle(normalizedIdentifier);
  if (!user) {
    console.log("User not found for identifier:", normalizedIdentifier);
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  console.log("User found:", { id: user.id, email: user.email, handle: user.handle });

  // Compare password exactly as provided (don't trim password)
  try {
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("Password match:", ok);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  } catch (error) {
    console.error("Password comparison error:", error);
    return NextResponse.json({ error: "Authentication error" }, { status: 500 });
  }

  console.log("Login successful for user:", user.id);
  const { passwordHash: _p, email: _e, ...safeUser } = user;
  const response = NextResponse.json({ user: safeUser });
  setAuthCookie(user.id, response);
  return response;
}


