import bcrypt from "bcryptjs";
import type { User } from "./types";
import { readUsers, writeUsers, seedDefaultUsers, type StoredUser } from "./fileStore";

export type AuthUser = User & {
  email: string;
  passwordHash: string;
};

function ensureSeeded() {
  seedDefaultUsers();
}

function getAuthUsers(): AuthUser[] {
  return readUsers() as AuthUser[];
}

function saveAuthUsers(users: AuthUser[]): void {
  writeUsers(users);
}

export function getAllAuthUsers(): AuthUser[] {
  ensureSeeded();
  return getAuthUsers();
}

export function getUsers(): User[] {
  ensureSeeded();
  return getAuthUsers().map(({ passwordHash, email, ...user }) => user);
}

export function getUserById(id: string): User | null {
  ensureSeeded();
  const found = getAuthUsers().find((u) => u.id === id);
  if (!found) return null;
  const { passwordHash: _p, email: _e, ...user } = found;
  return user;
}

export function getAuthUserById(id: string): AuthUser | null {
  ensureSeeded();
  return getAuthUsers().find((u) => u.id === id) ?? null;
}

export function findAuthUserByEmailOrHandle(identifier: string): AuthUser | null {
  ensureSeeded();
  const authUsers = getAuthUsers();
  
  if (!identifier || typeof identifier !== 'string') {
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
  console.log("Total users in database:", authUsers.length);
  console.log("All users:", authUsers.map(u => ({ email: u.email, handle: u.handle })));
  
  const found = authUsers.find((u) => {
    // Match by email (exact match, case-insensitive)
    if (u.email && u.email.toLowerCase() === normalized) {
      console.log("Matched by email:", u.email);
      return true;
    }
    // Match by handle (remove @ if present, case-insensitive)
    if (u.handle && u.handle.toLowerCase() === handleCandidate) {
      console.log("Matched by handle:", u.handle);
      return true;
    }
    return false;
  });
  
  if (!found) {
    console.log("No user found matching identifier:", identifier);
  }
  
  return found ?? null;
}

export function getAuthUserByEmail(email: string): AuthUser | null {
  ensureSeeded();
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;
  const authUsers = getAuthUsers();
  return authUsers.find((u) => u.email.toLowerCase() === normalized) ?? null;
}

export function getAuthUserByHandle(handle: string): AuthUser | null {
  ensureSeeded();
  if (!handle || typeof handle !== 'string') return null;
  const normalized = handle.trim().toLowerCase().replace(/^@+/, "");
  if (!normalized) return null;
  const authUsers = getAuthUsers();
  return authUsers.find((u) => u.handle.toLowerCase() === normalized) ?? null;
}

export function createAuthUser(input: {
  name: string;
  handle: string;
  email: string;
  password: string;
}): User {
  ensureSeeded();
  const authUsers = getAuthUsers();

  const exists = authUsers.some(
    (u) => u.email.toLowerCase() === input.email.toLowerCase()
  );
  if (exists) {
    throw new Error("Email already in use");
  }

  const handleExists = authUsers.some(
    (u) => u.handle.toLowerCase() === input.handle.toLowerCase()
  );
  if (handleExists) {
    throw new Error("Handle already taken");
  }

  const id = `u${authUsers.length + 1}`;
  const passwordHash = bcrypt.hashSync(input.password, 10);

  const colors = ["#38bdf8", "#a855f7", "#f97316", "#22c55e", "#ec4899"];
  const avatarColor = colors[authUsers.length % colors.length];

  // Ensure handle doesn't have @ prefix (it should already be removed, but be safe)
  const cleanHandle = input.handle.replace(/^@+/, "").trim();
  
  const authUser: AuthUser = {
    id,
    name: input.name,
    handle: cleanHandle,
    email: input.email.toLowerCase(),
    passwordHash,
    avatarColor
  };
  
  console.log("Created user:", { id: authUser.id, email: authUser.email, handle: authUser.handle });

  authUsers.push(authUser);
  saveAuthUsers(authUsers);

  const { passwordHash: _p, email: _e, ...user } = authUser;
  return user;
}

export function updateUserProfile(userId: string, updates: { profilePicture?: string; name?: string }): User | null {
  ensureSeeded();
  const authUsers = getAuthUsers();
  const user = authUsers.find((u) => u.id === userId);
  if (!user) return null;
  
  if (updates.profilePicture !== undefined) {
    user.profilePicture = updates.profilePicture;
  }
  if (updates.name !== undefined) {
    user.name = updates.name;
  }
  
  saveAuthUsers(authUsers);
  const { passwordHash: _p, email: _e, ...safeUser } = user;
  return safeUser;
}


