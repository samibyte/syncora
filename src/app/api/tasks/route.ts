import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb, writeDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { taskSchema } from "@/lib/validations/task.schema";
import { generateId } from "@/lib/utils/id";
import { createNotification } from "@/lib/notif";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  const db = await readDb();
  let tasks = db.tasks;

  if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);

  // If user is a team member, they might only want to see their tasks?
  // But requirements say "View all tasks" in some places.
  // We'll return all for now unless filtered by component.

  return NextResponse.json({ data: tasks });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (user.role === "team_member") {
    return NextResponse.json(
      { error: "Forbidden: Team members cannot create tasks" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const db = await readDb();

  // Rule 1: Prevent duplicate task titles inside the same project
  const exists = db.tasks.find(
    (t) =>
      t.projectId === parsed.data.projectId &&
      t.title.toLowerCase() === parsed.data.title.toLowerCase(),
  );
  if (exists) {
    return NextResponse.json(
      { error: "This task already exists in the project." },
      { status: 409 },
    );
  }

  // Rule 2: Prevent setting past dates as deadlines
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskDate = new Date(parsed.data.dueDate);
  if (taskDate < today) {
    return NextResponse.json(
      { error: "Please select a valid deadline (future date)." },
      { status: 400 },
    );
  }

  const assignedMember = db.users.find(
    (u) => u.id === parsed.data.assignedMemberId,
  );

  const task = {
    ...parsed.data,
    id: generateId(),
    assignedMemberName: assignedMember?.name || "Unknown",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.tasks.push(task);

  if (task.assignedMemberId && task.assignedMemberId !== user.id) {
    createNotification({
      db,
      userId: task.assignedMemberId,
      type: "task_assigned",
      title: "New Task Assigned",
      message: `${user.name} assigned you the task: ${task.title}`,
      taskId: task.id,
      projectId: task.projectId,
    });
  }

  db.activityLogs.unshift({

    id: generateId(),
    action: "task_created",
    description: `Task "${task.title}" assigned to ${task.assignedMemberName}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ data: task }, { status: 201 });
}
