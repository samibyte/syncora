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

export async function GET() {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  return NextResponse.json({ data: db.projects });
}

export async function POST(req: Request) {
  const user = await getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // RBAC: Only Admin and Project Manager can create projects
  if (user.role !== "admin" && user.role !== "project_manager") {
    return NextResponse.json(
      { error: "Forbidden: Insufficient permissions" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const db = await readDb();
  if (
    db.projects.find(
      (p) => p.name.toLowerCase() === parsed.data.name.toLowerCase(),
    )
  ) {
    return NextResponse.json(
      { error: "Project with this name already exists" },
      { status: 409 },
    );
  }

  const project = {
    ...parsed.data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.projects.push(project);

  db.activityLogs.unshift({
    id: generateId(),
    action: "project_created",
    description: `Project "${project.name}" created by ${user.name}`,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });

  await writeDb(db);

  return NextResponse.json({ data: project }, { status: 201 });
}
