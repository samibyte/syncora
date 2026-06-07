import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { differenceInDays, isPast, parseISO } from "date-fns";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  const projects = db.projects;
  const tasks = db.tasks;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter((t) => t.status !== "completed").length;

  const overdueTasks = tasks.filter((t) => {
    if (t.status === "completed") return false;
    const due = new Date(t.dueDate);
    return due < now;
  }).length;

  const recentActivity = db.activityLogs.slice(0, 10);

  // Project Summaries
  const projectSummaries = projects.map((p) => {
    const projectTasks = tasks.filter((t) => t.projectId === p.id);
    const total = projectTasks.length;
    const completed = projectTasks.filter((t) => t.status === "completed").length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Deadline status
    const due = parseISO(p.deadline);
    const diff = differenceInDays(due, now);
    let deadlineStatus = "";
    if (diff < 0) deadlineStatus = `Overdue by ${Math.abs(diff)} days`;
    else if (diff === 0) deadlineStatus = "Deadline today";
    else deadlineStatus = `Deadline in ${diff} days`;

    return {
      id: p.id,
      name: p.name,
      pendingCount: pending,
      completionPercentage: percent,
      deadlineStatus,
    };
  });

  // Charts
  const tasksByPriority = [
    {
      name: "High",
      value: tasks.filter((t) => t.priority === "high").length,
    },
    {
      name: "Medium",
      value: tasks.filter((t) => t.priority === "medium").length,
    },
    {
      name: "Low",
      value: tasks.filter((t) => t.priority === "low").length,
    },
  ];

  const tasksByStatus = [
    {
      name: "Todo",
      value: tasks.filter((t) => t.status === "todo").length,
    },
    {
      name: "In Progress",
      value: tasks.filter((t) => t.status === "in_progress").length,
    },
    {
      name: "Completed",
      value: tasks.filter((t) => t.status === "completed").length,
    },
  ];

  return NextResponse.json({
    data: {
      totalProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      recentActivity,
      projectSummaries,
      tasksByPriority,
      tasksByStatus,
    },
  });
}
