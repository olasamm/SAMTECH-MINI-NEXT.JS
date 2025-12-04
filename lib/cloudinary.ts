import { Buffer } from "buffer";
import { v2 as cloudinary, type UploadApiResponse, type UploadApiErrorResponse } from "cloudinary";

let isConfigured = false;

function ensureConfigured() {
  if (isConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Missing Cloudinary credentials. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });

  isConfigured = true;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  options?: {
    folder?: string;
    resourceType?: "image" | "video" | "auto";
  }
): Promise<UploadApiResponse> {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options?.folder ?? "samtech-mini",
        resource_type: options?.resourceType ?? "auto"
      },
      (error?: UploadApiErrorResponse, result?: UploadApiResponse) => {
        if (error || !result) {
          return reject(
            error ?? new Error("Cloudinary upload failed with no response")
          );
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}


