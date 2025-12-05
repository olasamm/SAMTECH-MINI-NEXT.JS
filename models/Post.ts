import { randomUUID } from "crypto";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const PostSchema = new Schema(
  {
    _id: { type: String, default: () => `p_${randomUUID()}` },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: String,
    mediaUrl: String,
    mediaType: { type: String, enum: ["image", "video"] },
    likeUserIds: { type: [String], default: [] },
    createdAt: { type: Number, default: () => Date.now() }
  },
  { timestamps: true, versionKey: false }
);

export type PostDocument = InferSchemaType<typeof PostSchema>;

export const PostModel =
  mongoose.models.Post || mongoose.model<PostDocument>("Post", PostSchema);


