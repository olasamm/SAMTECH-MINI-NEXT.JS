import { randomUUID } from "crypto";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const FollowSchema = new Schema(
  {
    _id: { type: String, default: () => `f_${randomUUID()}` },
    followerId: { type: String, required: true },
    followingId: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);

FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

export type FollowDocument = InferSchemaType<typeof FollowSchema>;

export const FollowModel =
  mongoose.models.Follow ||
  mongoose.model<FollowDocument>("Follow", FollowSchema);


