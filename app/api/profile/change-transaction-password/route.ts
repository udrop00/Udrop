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
  const newTransactionPassword = String(body.newTransactionPassword || "");
  const confirmTransactionPassword = String(body.confirmTransactionPassword || "");

  if (!currentPassword || !newTransactionPassword || !confirmTransactionPassword) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (newTransactionPassword.length !== 6 || !/^\d+$/.test(newTransactionPassword)) {
    return NextResponse.json({ error: "Transaction password must be exactly 6 digits." }, { status: 400 });
  }

  if (newTransactionPassword !== confirmTransactionPassword) {
    return NextResponse.json({ error: "Transaction passwords do not match." }, { status: 400 });
  }

  const db = readDB();
  const target = db.users.find((u: any) => u.id === user.id);

  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Require the account's login password to authorize this change.
  if (!verifyPassword(currentPassword, target)) {
    return NextResponse.json({ error: "Current login password is incorrect." }, { status: 401 });
  }

  (target as any).transactionPassword = newTransactionPassword;

  logActivity(db, user.id, "TRANSACTION_PASSWORD_CHANGED", `${target.email} changed their transaction password`);
  writeDB(db);

  return NextResponse.json({ success: true });
}
