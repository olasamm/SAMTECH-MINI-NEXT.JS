import { randomUUID } from "crypto";
import mongoose, { Schema, type InferSchemaType } from "mongoose";

const UserSchema = new Schema(
  {
    _id: { type: String, default: () => randomUUID() },
    name: { type: String, required: true },
    handle: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatarColor: { type: String, default: "#38bdf8" },
    profilePicture: String
  },
  { timestamps: true, versionKey: false }
);

export type UserDocument = InferSchemaType<typeof UserSchema>;

export const UserModel =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);


