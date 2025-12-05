import bcrypt from "bcryptjs";
import type { User } from "./types";
import { connectToDatabase } from "./mongodb";
import { UserModel, type UserDocument } from "@/models/User";

export type AuthUser = User & {
  email: string;
  passwordHash: string;
};

function toAuthUser(doc: UserDocument): AuthUser {
  return {
    id: doc._id.toString(),
    name: doc.name,
    handle: doc.handle,
    avatarColor: doc.avatarColor ?? "#38bdf8",
    profilePicture: doc.profilePicture || undefined,
    email: doc.email,
    passwordHash: doc.passwordHash
  };
}

function toUser(doc: UserDocument): User {
  const { passwordHash: _p, email: _e, ...user } = toAuthUser(doc);
  return user;
}

export async function getAllAuthUsers(): Promise<AuthUser[]> {
  await connectToDatabase();
  const docs = await UserModel.find().exec();
  return docs.map(toAuthUser);
}

export async function getUsers(): Promise<User[]> {
  await connectToDatabase();
  const docs = await UserModel.find().exec();
  return docs.map(toUser);
}

export async function getUserById(id: string): Promise<User | null> {
  await connectToDatabase();
  const doc = await UserModel.findById(id).exec();
  return doc ? toUser(doc) : null;
}

export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  await connectToDatabase();
  const doc = await UserModel.findById(id).exec();
  return doc ? toAuthUser(doc) : null;
}

export async function findAuthUserByEmailOrHandle(
  identifier: string
): Promise<AuthUser | null> {
  await connectToDatabase();

  if (!identifier || typeof identifier !== "string") {
    console.log("Invalid identifier provided:", identifier);
    return null;
  }

  const trimmed = identifier.trim();
  if (!trimmed) {
    console.log("Empty identifier after trim");
    return null;
  }

  const normalized = trimmed.toLowerCase();

  // Remove @ prefix if present (for handles like @designerdan)
  const handleCandidate = normalized.startsWith("@")
    ? normalized.slice(1)
    : normalized;

  console.log("Searching for user with identifier:", identifier);
  console.log("Normalized:", normalized, "Handle candidate:", handleCandidate);

  const doc = await UserModel.findOne({
    $or: [
      { email: normalized },
      { handle: handleCandidate }
    ]
  }).exec();

  if (!doc) {
    console.log("No user found matching identifier:", identifier);
    return null;
  }

  return toAuthUser(doc);
}

export async function getAuthUserByEmail(email: string): Promise<AuthUser | null> {
  await connectToDatabase();
  if (!email || typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const doc = await UserModel.findOne({ email: normalized }).exec();
  return doc ? toAuthUser(doc) : null;
}

export async function getAuthUserByHandle(
  handle: string
): Promise<AuthUser | null> {
  await connectToDatabase();
  if (!handle || typeof handle !== "string") return null;
  const normalized = handle.trim().toLowerCase().replace(/^@+/, "");
  if (!normalized) return null;
  const doc = await UserModel.findOne({ handle: normalized }).exec();
  return doc ? toAuthUser(doc) : null;
}

export async function createAuthUser(input: {
  name: string;
  handle: string;
  email: string;
  password: string;
}): Promise<User> {
  await connectToDatabase();

  const normalizedEmail = input.email.trim().toLowerCase();
  const cleanHandle = input.handle.replace(/^@+/, "").trim().toLowerCase();

  const existing = await UserModel.findOne({
    $or: [{ email: normalizedEmail }, { handle: cleanHandle }]
  }).exec();

  if (existing) {
    if (existing.email === normalizedEmail) {
      throw new Error("Email already in use");
    }
    if (existing.handle === cleanHandle) {
      throw new Error("Handle already taken");
    }
  }

  const passwordHash = bcrypt.hashSync(input.password, 10);

  const count = await UserModel.countDocuments().exec();
  const colors = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#ec4899"];
  const avatarColor = colors[count % colors.length];

  const doc = await UserModel.create({
    name: input.name.trim(),
    handle: cleanHandle,
    email: normalizedEmail,
    passwordHash,
    avatarColor
  });

  console.log("Created user:", {
    id: doc._id.toString(),
    email: doc.email,
    handle: doc.handle
  });

  return toUser(doc);
}

export async function updateUserProfile(
  userId: string,
  updates: { profilePicture?: string; name?: string }
): Promise<User | null> {
  await connectToDatabase();
  const doc = await UserModel.findById(userId).exec();
  if (!doc) return null;

  if (updates.profilePicture !== undefined) {
    doc.profilePicture = updates.profilePicture;
  }
  if (updates.name !== undefined) {
    doc.name = updates.name;
  }

  await doc.save();
  return toUser(doc);
}
