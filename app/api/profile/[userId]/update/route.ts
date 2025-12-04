import { NextResponse } from "next/server";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { updateUserProfile } from "@/lib/authStore";

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const currentUser = await getCurrentUserFromCookies();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = params.userId;
  
  // Only allow users to update their own profile
  if (currentUser.id !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { profilePicture, name } = body as {
    profilePicture?: string;
    name?: string;
  };

  const updatedUser = updateUserProfile(userId, { profilePicture, name });
  
  if (!updatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user: updatedUser });
}




