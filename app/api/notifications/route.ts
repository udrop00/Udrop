import { NextResponse } from "next/server";
import { readDB, writeDB, userFromRequest } from "../../lib/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = userFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = readDB();
  const list = (db.notifications || [])
    .filter((n: any) => n.userId === user.id)
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

  const unreadCount = list.filter((n: any) => !n.read).length;

  return NextResponse.json(
    {
      notifications: list,
      unreadCount
    },
    {
      headers: { "Cache-Control": "no-store" }
    }
  );
}

export async function PATCH(req: Request) {
  const user = userFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const db = readDB();
  if (!db.notifications) db.notifications = [];

  if (body.id) {
    const notif = db.notifications.find(
      (n: any) => n.id === body.id && n.userId === user.id
    );
    if (notif) notif.read = true;
  } else {
    for (const n of db.notifications) {
      if (n.userId === user.id) {
        n.read = true;
      }
    }
  }

  writeDB(db);

  const list = db.notifications
    .filter((n: any) => n.userId === user.id)
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

  return NextResponse.json({
    success: true,
    notifications: list,
    unreadCount: 0
  });
}
