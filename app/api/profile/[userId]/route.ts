import { NextResponse } from "next/server";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { getUserById, getFollowers, getFollowing, getPostsByUser, isFollowing } from "@/lib/data";

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const currentUser = await getCurrentUserFromCookies();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const userId = params.userId;
  const user = await getUserById(userId);
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const followers = await getFollowers(userId);
  const following = await getFollowing(userId);
  const posts = getPostsByUser(userId);
  const isUserFollowing = isFollowing(currentUser.id, userId);

  return NextResponse.json({
    user,
    followers,
    following,
    posts,
    isFollowing: isUserFollowing,
    isOwnProfile: currentUser.id === userId
  });
}




