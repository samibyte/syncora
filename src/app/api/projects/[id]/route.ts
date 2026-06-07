import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { readDb, writeDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { projectSchema } from "@/lib/validations/project.schema";
import { generateId } from "@/lib/utils/id";

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

  // RBAC: Only Admin and Project Manager can update projects
  if (user.role !== "admin" && user.role !== "project_manager") {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = projectSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const db = await readDb();
  const index = db.projects.findIndex((p) => p.id === id);
  if (index === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const updatedProject = {
    ...db.projects[index],
    ...parsed.data,
    updatedAt: new Date().toISOString(),
  };

  db.projects[index] = updatedProject;

  db.activityLogs.unshift({
    id: generateId(),
    action: "project_updated",
    description: `Project "${updatedProject.name}" updated by ${user.name}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ data: updatedProject });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RBAC: Only Admin can delete projects (stricter rule for demo)
  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Only Admins can delete projects" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const db = await readDb();
  const project = db.projects.find((p) => p.id === id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  db.projects = db.projects.filter((p) => p.id !== id);
  // Also clean up tasks related to this project
  db.tasks = db.tasks.filter((t) => t.projectId !== id);

  db.activityLogs.unshift({
    id: generateId(),
    action: "project_deleted",
    description: `Project "${project.name}" deleted by ${user.name}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ message: "Project deleted successfully" });
}
