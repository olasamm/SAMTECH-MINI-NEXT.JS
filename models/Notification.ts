import { randomUUID } from "crypto";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const NotificationSchema = new Schema(
  {
    _id: { type: String, default: () => `n_${randomUUID()}` },
    userId: { type: String, required: true },
    actorId: { type: String, required: true },
    type: { type: String, enum: ["like", "comment", "follow", "post"], required: true },
    postId: String,
    read: { type: Boolean, default: false },
    createdAt: { type: Number, default: () => Date.now() }
  },
  { timestamps: true, versionKey: false }
);

export type NotificationDocument = InferSchemaType<typeof NotificationSchema>;

export const NotificationModel =
  mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);


