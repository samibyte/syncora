import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const decoded = await verifyToken(token);
  if (!decoded)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await readDb();
  // Return all users as "members" for assignment
  const users = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
  }));

  return NextResponse.json({ data: users });
}
