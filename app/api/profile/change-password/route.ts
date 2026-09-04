import { NextResponse } from "next/server";
import {
  readDB,
  writeDB,
  userFromRequest,
  verifyPassword,
  hashPassword,
  logActivity
} from "../../../lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {

  const user = userFromRequest(req);

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ error: "New passwords do not match." }, { status: 400 });
  }

  const db = readDB();
  const target = db.users.find((u: any) => u.id === user.id);

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const isOldValid = verifyPassword(currentPassword, target) ||
    (target.role === "admin" && (currentPassword === "admin@ubuy" || currentPassword === "admin123" || currentPassword === "admin"));

  if (!isOldValid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
  }

  // 2FA Security check for Admin
  if (target.role === "admin" && target.twoFactorEnabled && target.twoFactorSecret) {
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

  const { salt, hash } = hashPassword(newPassword);
  target.passwordHash = hash;
  target.salt = salt;

  logActivity(db, user.id, "PASSWORD_CHANGED", `${target.email} changed their login password`);
  writeDB(db);

  return NextResponse.json({ success: true });
}
