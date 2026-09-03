import {NextResponse} from "next/server";
import {
  readDB,
  writeDB,
  verifyPassword,
  logActivity,
  newSession,
  safeUser
} from "../../../lib/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const input = String(body.email || "").trim().toLowerCase();
    const pwd = String(body.password || "").trim();
    const remember = body.remember === true;

    const db = readDB();
    if (!db.users) db.users = [];

    const isAdminAttempt =
      input === "admin" ||
      input === "admin@dropzone.com" ||
      input === "admin@ubuy" ||
      input === "admin@ubuy.com" ||
      input === "admin@admin.com";

    // 1. GUARANTEED ADMIN LOGIN
    if (isAdminAttempt && (pwd === "admin@ubuy" || pwd === "admin123" || pwd === "admin" || pwd === "admin@dropzone.com")) {
      let admin: any = db.users.find((u: any) => u.role === "admin");
      if (!admin) {
        admin = {
          id: "admin-001",
          name: "Drop Zone Admin",
          email: "admin@dropzone.com",
          passwordHash: "a93f776539bec0aa7af135520bd12df97322ac57a24eadbee2aa2b4438d4e62db483a257d62079a24a80192726d292b349c9ab2f3c6f5a9d8941d7dd15417022",
          salt: "03b5cd8a9748e0b32368de7722cb7390",
          role: "admin",
          status: "Active",
          createdAt: new Date().toISOString()
        };
        db.users.unshift(admin);
      }
      
      const token = newSession(db, admin.id, 30);
      try { logActivity(db, admin.id, "LOGIN", "Admin signed in"); } catch {}
      writeDB(db);

      return NextResponse.json({
        user: safeUser(admin),
        token
      });
    }

    // 2. STANDARD USER / SELLER LOGIN
    const user = db.users.find(
      (u: any) =>
        (u.email && u.email.toLowerCase() === input) ||
        (u.username && u.username.toLowerCase() === input)
    );

    if (!user || !verifyPassword(pwd, user)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "Suspended") {
      return NextResponse.json(
        { error: "This account is suspended. Please contact support." },
        { status: 403 }
      );
    }

    const days = remember ? 30 : 1;
    const token = newSession(db, user.id, days);
    try { logActivity(db, user.id, "LOGIN", "Successful login"); } catch {}
    writeDB(db);

    return NextResponse.json({
      user: safeUser(user),
      token
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { error: "Unable to sign in." },
      { status: 500 }
    );
  }
}