import fs from "fs";
import path from "path";

// On Vercel the project directory is read-only. Use /tmp in that environment.
const ROOT_DIR =
  process.env.VERCEL === "1" || process.env.VERCEL === "true"
    ? "/tmp"
    : process.cwd();

const DATA_DIR = path.join(ROOT_DIR, ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export interface StoredUser {
  id: string;
  handle: string;
  name: string;
  avatarColor: string;
  profilePicture?: string;
  email: string;
  passwordHash: string;
}

export function readUsers(): StoredUser[] {
  ensureDataDir();
  
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  
  try {
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading users file:", error);
    return [];
  }
}

export function writeUsers(users: StoredUser[]): void {
  ensureDataDir();
  
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing users file:", error);
    throw error;
  }
}

export function seedDefaultUsers(): void {
  ensureDataDir();
  
  if (fs.existsSync(USERS_FILE)) {
    return; // Already seeded
  }
  
  const bcrypt = require("bcryptjs");
  const basePassword = "ipassword123";
  const hash = bcrypt.hashSync(basePassword, 10);
  
  const defaultUsers: StoredUser[] = [
    {
      id: "u1",
      handle: "designerdan",
      name: "Daniel Carter",
      avatarColor: "#38bdf8",
      email: "daniel@example.com",
      passwordHash: hash
    },
    {
      id: "u2",
      handle: "devjules",
      name: "Julia Michaels",
      avatarColor: "#a855f7",
      email: "julia@example.com",
      passwordHash: hash
    },
    {
      id: "u3",
      handle: "productnaya",
      name: "Naya Patel",
      avatarColor: "#f97316",
      email: "naya@example.com",
      passwordHash: hash
    }
  ];
  
  writeUsers(defaultUsers);
}
