import {NextResponse} from "next/server";
import {
  readDB,
  writeDB,
  safeUser,
  userFromRequest,
  newSession,
  logActivity
} from "../../../lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {

  const admin = userFromRequest(req);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const userId = String(body.userId || "");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400 }
    );
  }

  const db = readDB();

  const target = db.users.find((u: any) => u.id === userId);

  if (!target) {
    return NextResponse.json(
      { error: "Seller not found." },
      { status: 404 }
    );
  }

  if (target.role === "admin") {
    return NextResponse.json(
      { error: "Cannot impersonate an admin account." },
      { status: 400 }
    );
  }

  // Create a short-lived session token for the target seller.
  // The admin's own session is untouched.
  const token = newSession(db, target.id, 1);

  logActivity(
    db,
    admin.id,
    "ADMIN_IMPERSONATE",
    `Admin logged in as seller ${target.email}`
  );

  writeDB(db);

  return NextResponse.json({
    user: safeUser(target),
    token
  });
}
