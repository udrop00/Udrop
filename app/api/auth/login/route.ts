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
      input === "admin@udropglobal.com" ||
      input === "admin@ubuy" ||
      input === "admin@ubuy.com" ||
      input === "admin@admin.com";

    // 1. ADMIN LOGIN
    if (isAdminAttempt) {
      let admin: any = db.users.find((u: any) => u.role === "admin");

      // First-time setup only: no admin account exists yet in the database.
      // Bootstraps a default admin using a fixed credential so the panel
      // isn't permanently locked out on a fresh install. Once this account
      // is created, this branch never runs again - login is then verified
      // solely against that account's real (changeable) password.
      const bootstrapAdmin = {
        id: "admin-001",
        name: "Drop Zone Admin",
        email: "admin@dropzone.com",
        passwordHash: "a93f776539bec0aa7af135520bd12df97322ac57a24eadbee2aa2b4438d4e62db483a257d62079a24a80192726d292b349c9ab2f3c6f5a9d8941d7dd15417022",
        salt: "03b5cd8a9748e0b32368de7722cb7390",
        role: "admin" as const,
        status: "Active" as const,
        createdAt: new Date().toISOString()
      };

      const passwordMatches =
        admin
          ? Boolean(admin.passwordHash && verifyPassword(pwd, admin))
          : verifyPassword(pwd, bootstrapAdmin);

      // Recovery passkey lets the admin log in if they forgot their real
      // password (generated from Admin Settings; shown to them only once).
      const usedRecoveryPasskey =
        !passwordMatches &&
        admin &&
        admin.recoveryPasskeyHash &&
        verifyPassword(pwd, { passwordHash: admin.recoveryPasskeyHash, salt: admin.recoveryPasskeySalt } as any);

      const isValid = passwordMatches || usedRecoveryPasskey;

      if (isValid) {
        if (!admin) {
          admin = bootstrapAdmin;
          db.users.unshift(admin);
        }

        // Google Authenticator check for Admin
        if (admin.twoFactorEnabled && admin.twoFactorSecret) {
          const twoFactorCode = String(body.twoFactorCode || "").trim();
          if (!twoFactorCode) {
            return NextResponse.json({
              requireTwoFactor: true,
              message: "Enter 6-digit Google Authenticator code"
            });
          }

          const { verifyTOTP } = await import("../../../lib/totp");
          const isTotpValid = verifyTOTP(twoFactorCode, admin.twoFactorSecret);
          if (!isTotpValid) {
            return NextResponse.json(
              { error: "Invalid 6-digit Authenticator code. Please check your Google Authenticator app." },
              { status: 401 }
            );
          }
        }
        
        const token = newSession(db, admin.id, 30);
        try {
          logActivity(
            db,
            admin.id,
            "LOGIN",
            usedRecoveryPasskey ? "Admin signed in using recovery passkey" : "Admin signed in"
          );
        } catch {}
        writeDB(db);

        return NextResponse.json({
          user: safeUser(admin),
          token
        });
      }
    }

    // 2. STANDARD USER / SELLER LOGIN
    const user = db.users.find(
      (u: any) =>
        (u.email && u.email.toLowerCase() === input) ||
        (u.username && u.username.toLowerCase() === input)
    );

    if (!user || !verifyPassword(pwd, user)) {
      return NextResponse.json(
        { error: "Invalid email or password. If you forgot your password, please contact support via Live Chat." },
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