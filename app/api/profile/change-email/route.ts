import { NextResponse } from "next/server";
import {
  readDB,
  writeDB,
  userFromRequest,
  verifyPassword,
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
  const newEmail = String(body.newEmail || "").trim().toLowerCase();
  const confirmEmail = String(body.confirmEmail || "").trim().toLowerCase();

  if (!currentPassword || !newEmail || !confirmEmail) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(newEmail)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (newEmail !== confirmEmail) {
    return NextResponse.json({ error: "New email and confirm email do not match." }, { status: 400 });
  }

  const db = readDB();
  const target = db.users.find((u: any) => u.id === user.id);

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Also accept the admin's recovery passkey in place of the real
  // password, same as the password-change flow.
  const isOldValid =
    verifyPassword(currentPassword, target) ||
    Boolean(
      target.role === "admin" &&
      target.recoveryPasskeyHash &&
      verifyPassword(currentPassword, { passwordHash: target.recoveryPasskeyHash, salt: target.recoveryPasskeySalt } as any)
    );

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

  const emailTaken = db.users.some(
    (u: any) => u.id !== target.id && String(u.email || "").toLowerCase() === newEmail
  );

  if (emailTaken) {
    return NextResponse.json({ error: "This email is already in use by another account." }, { status: 400 });
  }

  const oldEmail = target.email;
  target.email = newEmail;

  logActivity(db, user.id, "EMAIL_CHANGED", `${oldEmail} changed their account email to ${newEmail}`);
  writeDB(db);

  return NextResponse.json({ success: true, email: newEmail });
}
