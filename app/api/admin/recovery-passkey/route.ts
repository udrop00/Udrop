import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  readDB,
  writeDB,
  userFromRequest,
  verifyPassword,
  hashPassword,
  logActivity
} from "../../../lib/server";
import { verifyTOTP } from "../../../lib/totp";

export const runtime = "nodejs";

// Unambiguous charset - no 0/O/1/I/l - so a hand-typed passkey doesn't
// get misread when the admin needs to use it during account recovery.
// Includes special characters for extra complexity/entropy.
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%^&*-_+=";

function generatePasskey(length = 24) {
  let out = "";
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i] % CHARSET.length];
  }
  return out;
}

/**
 * GET /api/admin/recovery-passkey
 * Reports whether a recovery passkey has already been generated
 * (never returns the passkey itself - it is only shown once, at
 * generation time).
 */
export async function GET(req: Request) {
  const admin = userFromRequest(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = readDB();
  const currentAdmin = db.users.find((u: any) => u.id === admin.id);
  if (!currentAdmin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  return NextResponse.json({
    exists: Boolean(currentAdmin.recoveryPasskeyHash),
    generatedAt: currentAdmin.recoveryPasskeyGeneratedAt || null
  });
}

/**
 * POST /api/admin/recovery-passkey
 * Generates a new recovery passkey, replacing any previous one.
 * Requires the admin's current password (+ 2FA code, if enabled) since
 * this creates a credential that can log in without the real password.
 * The plaintext passkey is returned exactly once and is never stored -
 * only its hash is kept, the same as a normal password.
 */
export async function POST(req: Request) {
  const admin = userFromRequest(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const password = String(body.password || "");
  const twoFactorCode = String(body.twoFactorCode || "").trim();

  const db = readDB();
  const currentAdmin = db.users.find((u: any) => u.id === admin.id);
  if (!currentAdmin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  if (!password || !verifyPassword(password, currentAdmin)) {
    return NextResponse.json({ error: "Incorrect current password." }, { status: 400 });
  }

  if (currentAdmin.twoFactorEnabled && currentAdmin.twoFactorSecret) {
    if (!twoFactorCode) {
      return NextResponse.json({ error: "6-digit Google Authenticator code is required." }, { status: 400 });
    }
    if (!verifyTOTP(twoFactorCode, currentAdmin.twoFactorSecret)) {
      return NextResponse.json({ error: "Invalid 6-digit Authenticator code." }, { status: 400 });
    }
  }

  const passkey = generatePasskey(24);
  const { salt, hash } = hashPassword(passkey);

  currentAdmin.recoveryPasskeyHash = hash;
  currentAdmin.recoveryPasskeySalt = salt;
  currentAdmin.recoveryPasskeyGeneratedAt = new Date().toISOString();

  logActivity(db, admin.id, "ADMIN_RECOVERY_PASSKEY_GENERATED", `${currentAdmin.email} generated a new recovery passkey`);
  writeDB(db);

  return NextResponse.json({
    ok: true,
    passkey,
    message: "Save this passkey somewhere safe - it will not be shown again."
  });
}
