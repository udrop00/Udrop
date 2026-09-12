import { NextResponse } from "next/server";
import { readDB, writeDB, userFromRequest, logActivity } from "../../../lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {

  const admin = userFromRequest(req);

  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = readDB();
  const target = db.users.find((u: any) => u.id === admin.id);

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // 2FA Security check for Admin - only admins who can prove they hold the
  // authenticator device may export the full database.
  if (target.role === "admin" && target.twoFactorEnabled && target.twoFactorSecret) {
    const body = await req.json().catch(() => ({}));
    const code = String(body.twoFactorCode || "").trim();
    if (!code) {
      return NextResponse.json({ error: "6-digit Google Authenticator code is required." }, { status: 400 });
    }
    const { verifyTOTP } = await import("../../../lib/totp");
    const isTotpValid = verifyTOTP(code, target.twoFactorSecret);
    if (!isTotpValid) {
      return NextResponse.json({ error: "Invalid Google Authenticator code." }, { status: 400 });
    }
  }

  logActivity(db, admin.id, "BACKUP_DOWNLOADED", `${admin.email} downloaded a full database backup`);
  writeDB(db);

  const filename = `udrop-backup-${new Date().toISOString().slice(0, 10)}.json`;

  return new NextResponse(JSON.stringify(db, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
}
