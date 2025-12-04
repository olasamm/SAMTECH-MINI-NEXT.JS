import { NextResponse } from "next/server";
import { getUsers, isFollowing, toggleFollow } from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { followingId } = body as {
    followingId?: string;
  };

  if (!followingId) {
    return NextResponse.json({ error: "Missing followingId" }, { status: 400 });
  }

  toggleFollow(user.id, followingId);
  const users = getUsers();

  return NextResponse.json({
    users,
    isFollowing: isFollowing(user.id, followingId)
  });
}



