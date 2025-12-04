import { NextResponse } from "next/server";
import {
  getNotificationsForUser,
  markAllNotificationsRead,
  getUsers
} from "@/lib/data";
import { getCurrentUserFromCookies } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const items = getNotificationsForUser(user.id);
  const users = getUsers();
  return NextResponse.json({ notifications: items, users });
}

export async function POST(request: Request) {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const body = await request.json();
  const { action } = body as { action?: string };
  if (action !== "markRead") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  markAllNotificationsRead(user.id);
  return NextResponse.json({ ok: true });
}



