import { NextResponse } from "next/server";
import { getFeedForUser, getUsers, getFollowingIds } from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { posts, comments } = getFeedForUser(user.id);
  const followingUserIds = getFollowingIds(user.id);
  const users = getUsers();

  return NextResponse.json({ posts, comments, users, me: user, followingUserIds });
}



