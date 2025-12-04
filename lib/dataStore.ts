import fs from "fs";
import path from "path";
import type { Comment, Follow, Notification, Post } from "./types";

export type AppData = {
  posts: Post[];
  comments: Comment[];
  follows: Follow[];
  notifications: Notification[];
  idCounter: number;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const APP_FILE = path.join(DATA_DIR, "app.json");

function getDefaultData(): AppData {
  const now = Date.now();
  const hour = 1000 * 60 * 60;
  const minute = 1000 * 60;

  const defaultPosts: Post[] = [
    {
      id: "p1",
      authorId: "u2",
      createdAt: now - hour,
      content:
        "Shipping a tiny social app tonight. In-memory DB, but the vibes are very real.",
      likeUserIds: ["u1", "u3"],
      mediaType: "image",
      mediaUrl:
        "https://images.unsplash.com/photo-1522199710521-72d69614c702?auto=format&fit=crop&w=1200&q=80"
    },
    {
      id: "p2",
      authorId: "u1",
      createdAt: now - 15 * minute,
      content:
        "Dark glassmorphism + neon accents is still undefeated for dashboards.",
      mediaType: "image",
      mediaUrl:
        "https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg?auto=compress&cs=tinysrgb&w=1200",
      likeUserIds: ["u2"]
    }
  ];

  const defaultComments: Comment[] = [
    {
      id: "c1",
      postId: "p2",
      authorId: "u3",
      createdAt: now - 10 * minute,
      content: "Drop the Figma file 👀"
    }
  ];

  const defaultFollows: Follow[] = [
    { followerId: "u1", followingId: "u2" },
    { followerId: "u1", followingId: "u3" },
    { followerId: "u2", followingId: "u1" }
  ];

  return {
    posts: defaultPosts,
    comments: defaultComments,
    follows: defaultFollows,
    notifications: [],
    idCounter: 1000
  };
}

function ensureDataFile(): AppData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(APP_FILE)) {
    const data = getDefaultData();
    fs.writeFileSync(APP_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }

  try {
    const raw = fs.readFileSync(APP_FILE, "utf-8");
    const parsed = JSON.parse(raw) as AppData;
    return parsed;
  } catch (error) {
    console.error("Failed to read app data, using defaults:", error);
    const data = getDefaultData();
    fs.writeFileSync(APP_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data;
  }
}

export function readAppData(): AppData {
  return ensureDataFile();
}

export function writeAppData(data: AppData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(APP_FILE, JSON.stringify(data, null, 2), "utf-8");
}


