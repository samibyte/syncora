import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb, writeDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { generateId } from "@/lib/utils/id";
import { createNotification } from "@/lib/notif";


async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();

  const comments = (db.comments || [])
    .filter((c) => c.taskId === id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return NextResponse.json({ data: comments });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();

  const task = db.tasks.find((t) => t.id === id);
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const body = await req.json();
  const content = body?.content?.trim();

  if (!content || content.length < 1) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  if (content.length > 1000) {
    return NextResponse.json({ error: "Comment is too long (max 1000 characters)" }, { status: 400 });
  }

  const comment = {
    id: generateId(),
    taskId: id,
    authorId: user.id,
    authorName: user.name,
    content,
    createdAt: new Date().toISOString(),
  };

  if (!db.comments) db.comments = [];
  db.comments.push(comment);

  // Notify assignee if someone else comments
  if (task.assignedMemberId && task.assignedMemberId !== user.id) {
    createNotification({
      db,
      userId: task.assignedMemberId,
      type: "comment_added",
      title: "New Comment",
      message: `${user.name} commented on your task: ${task.title}`,
      taskId: task.id,
      projectId: task.projectId,
    });
  }

  await writeDb(db);


  return NextResponse.json({ data: comment }, { status: 201 });
}
