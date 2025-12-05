import { randomUUID } from "crypto";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const CommentSchema = new Schema(
  {
    _id: { type: String, default: () => `c_${randomUUID()}` },
    postId: { type: String, required: true },
    authorId: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Number, default: () => Date.now() }
  },
  { timestamps: true, versionKey: false }
);

export type CommentDocument = InferSchemaType<typeof CommentSchema>;

export const CommentModel =
  mongoose.models.Comment ||
  mongoose.model<CommentDocument>("Comment", CommentSchema);


