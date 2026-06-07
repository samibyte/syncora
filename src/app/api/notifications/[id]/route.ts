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

// PATCH /api/notifications/[id] — mark as read
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();

  const index = (db.notifications || []).findIndex((n) => n.id === id && n.userId === user.id);
  if (index === -1) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  db.notifications[index].isRead = true;

  await writeDb(db);
  return NextResponse.json({ message: "Notification marked as read" });
}

// DELETE /api/notifications/[id] — delete notification
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();

  const originalLength = (db.notifications || []).length;
  db.notifications = (db.notifications || []).filter(
    (n) => !(n.id === id && n.userId === user.id)
  );

  if (db.notifications.length === originalLength) {
    return NextResponse.json({ error: "Notification not found" }, { status: 404 });
  }

  await writeDb(db);
  return NextResponse.json({ message: "Notification deleted" });
}
