import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { postId } = body as { postId?: string };

  if (!postId) {
    return NextResponse.json({ error: "Missing postId" }, { status: 400 });
  }

  const post = toggleLike(postId, user.id);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json(post);
}



