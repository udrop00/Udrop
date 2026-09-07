import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Self-service password resets are disabled. Customers/sellers must
// contact admin via support chat, who resets their password from the
// admin panel (protected by Google Authenticator). Admin accounts use
// their own recovery passkey instead.
export async function POST() {
  return NextResponse.json(
    {
      error: "Self-service password reset is disabled. Please contact support via chat to reset your password."
    },
    {
      status: 403
    }
  );
}
