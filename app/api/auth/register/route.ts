import { NextResponse } from "next/server";
import { createAuthUser, findAuthUserByEmailOrHandle, getAllAuthUsers, getAuthUserByEmail, getAuthUserByHandle } from "@/lib/authStore";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, handle, email, password } = body as {
      name?: string;
      handle?: string;
      email?: string;
      password?: string;
    };

    console.log("Registration attempt:", { name, handle, email, hasPassword: !!password });

    if (!name || !handle || !email || !password) {
      console.log("Missing fields:", { name: !!name, handle: !!handle, email: !!email, password: !!password });
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const normalizedHandle = (handle || "").trim().replace(/^@/, "");
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!normalizedHandle || normalizedHandle.length === 0) {
    return NextResponse.json(
      { error: "Handle is required" },
      { status: 400 }
    );
  }

  if (normalizedHandle.length < 3) {
    return NextResponse.json(
      { error: "Handle must be at least 3 characters" },
      { status: 400 }
    );
  }

  // Check for existing email (explicit)
  const existingEmail = getAuthUserByEmail(normalizedEmail);
  if (existingEmail) {
    return NextResponse.json(
      { error: "Email already in use" },
      { status: 400 }
    );
  }

  // Check for existing handle
  const existingHandle = getAuthUserByHandle(normalizedHandle);
  if (existingHandle) {
    return NextResponse.json(
      { error: "Handle already taken" },
      { status: 400 }
    );
  }

    try {
      console.log("Creating user...");
      const user = createAuthUser({
        name: (name || "").trim(),
        handle: normalizedHandle,
        email: normalizedEmail,
        password: password || ""
      });

      console.log("User created successfully:", user.id);
      console.log("User details:", { handle: user.handle, id: user.id });
      
      // Verify user can be found
      const allUsers = getAllAuthUsers();
      console.log("Total users now:", allUsers.length);
      console.log("All users:", allUsers.map(u => ({ email: u.email, handle: u.handle, id: u.id })));
      
      // Try to find the user we just created
      const verifyByEmail = getAuthUserByEmail(normalizedEmail);
      if (verifyByEmail) {
        console.log("✓ User verification: Found by email");
      } else {
        console.log("✗ User verification: NOT found by email!");
      }

      const verifyUserByHandle = getAuthUserByHandle(user.handle);
      if (verifyUserByHandle) {
        console.log("✓ User verification: Found by handle");
      } else {
        console.log("✗ User verification: NOT found by handle!");
      }
      
      const response = NextResponse.json({ user });
      setAuthCookie(user.id, response);
      console.log("Cookie set for user:", user.id);
      return response;
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage = error instanceof Error ? error.message : "Unable to create account";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}


