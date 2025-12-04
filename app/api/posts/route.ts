import { NextResponse } from "next/server";
import { createPost } from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { content, mediaUrl, mediaType, imageUrl } = body as {
    content?: string;
    mediaUrl?: string;
    mediaType?: "image" | "video";
    imageUrl?: string;
  };

  if (!content || content.trim().length === 0) {
    return NextResponse.json(
      { error: "Content is required" },
      { status: 400 }
    );
  }

  const normalizedMediaUrl = mediaUrl?.trim() || imageUrl?.trim();
  const normalizedMediaType =
    mediaType && ["image", "video"].includes(mediaType)
      ? mediaType
      : normalizedMediaUrl && !mediaType
      ? "image"
      : undefined;

  const post = createPost(user.id, content.trim(), {
    mediaUrl: normalizedMediaUrl,
    mediaType: normalizedMediaType as "image" | "video" | undefined
  });
  return NextResponse.json(post, { status: 201 });
}



