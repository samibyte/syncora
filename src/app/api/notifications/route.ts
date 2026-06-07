import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb, writeDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/notifications — user's notifications, newest first
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const notifications = (db.notifications || [])
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50); // latest 50

  return NextResponse.json({ data: notifications });
}

// PATCH /api/notifications — mark ALL as read
export async function PATCH() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  if (!db.notifications) db.notifications = [];

  db.notifications = db.notifications.map((n) =>
    n.userId === user.id ? { ...n, isRead: true } : n
  );

  await writeDb(db);
  return NextResponse.json({ message: "All notifications marked as read" });
}
