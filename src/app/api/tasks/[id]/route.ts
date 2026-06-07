import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb, writeDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { taskSchema } from "@/lib/validations/task.schema";
import { generateId } from "@/lib/utils/id";
import { createNotification } from "@/lib/notif"



async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const db = await readDb();
  const index = db.tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const existingTask = db.tasks[index];
  const body = await req.json();

  // Special Check: Team members can ONLY update status
  if (user.role === "team_member") {
    if (Object.keys(body).length > 1 || !body.status) {
      return NextResponse.json(
        { error: "Forbidden: Team members can only update task status" },
        { status: 403 },
      );
    }
  }

  // Rule: Prevent assigning/modifying completed tasks (unless changing status back)
  if (existingTask.status === "completed" && body.status !== "todo" && body.status !== "in_progress") {
     if (body.assignedMemberId || body.title || body.description) {
        return NextResponse.json({ error: "Completed tasks cannot be modified." }, { status: 400 });
     }
  }

  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const assignedMember = parsed.data.assignedMemberId 
    ? db.users.find(u => u.id === parsed.data.assignedMemberId)
    : null;

  const updatedTask = {
    ...existingTask,
    ...parsed.data,
    ...(assignedMember ? { assignedMemberName: assignedMember.name } : {}),
    updatedAt: new Date().toISOString(),
  };

  db.tasks[index] = updatedTask;

  // Notification: New Assignment
  if (parsed.data.assignedMemberId && parsed.data.assignedMemberId !== existingTask.assignedMemberId && parsed.data.assignedMemberId !== user.id) {
    createNotification({
      db,
      userId: parsed.data.assignedMemberId,
      type: "task_assigned",
      title: "Task Assigned",
      message: `${user.name} assigned you the task: ${updatedTask.title}`,
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
    });
  }

  // Notification: Status Updated (notify current assignee if someone else changed it)
  if (parsed.data.status && parsed.data.status !== existingTask.status && updatedTask.assignedMemberId !== user.id) {
    createNotification({
      db,
      userId: updatedTask.assignedMemberId,
      type: "task_status_updated",
      title: "Task Status Updated",
      message: `The status of your task "${updatedTask.title}" was updated to ${updatedTask.status} by ${user.name}`,
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
    });
  }

  db.activityLogs.unshift({

    id: generateId(),
    action: "task_status_updated",
    description: `Task "${updatedTask.title}" updated by ${user.name}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ data: updatedTask });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "team_member") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = await readDb();
  const task = db.tasks.find((t) => t.id === id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);

  db.activityLogs.unshift({
    id: generateId(),
    action: "task_deleted",
    description: `Task "${task.title}" deleted by ${user.name}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ message: "Task deleted successfully" });
}
