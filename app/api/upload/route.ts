import { NextResponse } from "next/server";
import { Buffer } from "buffer";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { getCurrentUserFromCookies } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid form data", details: (error as Error)?.message },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "File is required" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const folder = (formData.get("folder")?.toString() || "samtech-mini/uploads").trim();
  const detectedType = file.type.startsWith("video")
    ? "video"
    : file.type.startsWith("image")
    ? "image"
    : "auto";

  try {
    const uploadResult = await uploadToCloudinary(buffer, {
      folder,
      resourceType: detectedType
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
      width: uploadResult.width,
      height: uploadResult.height,
      duration: uploadResult.duration,
      format: uploadResult.format
    });
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}


