import { NextResponse } from "next/server";
import { addComment } from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { postId, content } = body as {
    postId?: string;
    content?: string;
  };

  if (!postId || !content || content.trim().length === 0) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const comment = addComment(postId, user.id, content.trim());
  return NextResponse.json(comment, { status: 201 });
}



