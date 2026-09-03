import { NextResponse } from "next/server";
import { readDB, writeDB, userFromRequest, logActivity } from "../../../lib/server";

export const runtime = "nodejs";

// GET - search sellers by email, or list one seller's store products
// ?email=xxx           -> matching sellers (name, email, shopName, productCount)
// ?sellerId=xxx         -> { seller, items: [{...sellerProductRow, product}] }
export async function GET(req: Request) {
  const admin = userFromRequest(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  const sellerId = (url.searchParams.get("sellerId") || "").trim();

  const db = readDB();
  if (!db.sellerProducts) db.sellerProducts = [];

  if (sellerId) {
    const seller = db.users.find((u: any) => u.id === sellerId && u.role === "customer");
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }
    const items = db.sellerProducts
      .filter((p: any) => p.sellerId === sellerId)
      .map((item: any) => {
        const product = (db.products || []).find((p: any) => String(p.id) === String(item.productId));
        return { ...item, product };
      })
      .filter((item: any) => Boolean(item.product));

    return NextResponse.json({
      seller: {
        id: seller.id,
        name: seller.name,
        email: seller.email,
        shopName: seller.shopName || "",
        currentPackageName: seller.currentPackageName || seller.currentPackage || "",
        productLimit: Number(seller.productLimit || 0),
      },
      items,
    }, { headers: { "Cache-Control": "no-store" } });
  }

  if (email) {
    const sellers = db.users
      .filter((u: any) => u.role === "customer" && (u.email || "").toLowerCase().includes(email))
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        shopName: u.shopName || "",
        currentPackageName: u.currentPackageName || u.currentPackage || "",
        productLimit: Number(u.productLimit || 0),
        productCount: db.sellerProducts.filter((p: any) => p.sellerId === u.id).length,
      }))
      .slice(0, 20);

    return NextResponse.json({ sellers }, { headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ sellers: [] });
}

// DELETE - remove one seller product row, or all of a seller's products
// body: { id }               -> remove single row
// body: { sellerId, all:true } -> remove all rows for that seller
export async function DELETE(req: Request) {
  const admin = userFromRequest(req);
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const db = readDB();
  if (!db.sellerProducts) db.sellerProducts = [];

  if (body.all && body.sellerId) {
    const seller = db.users.find((u: any) => u.id === body.sellerId);
    const before = db.sellerProducts.length;
    db.sellerProducts = db.sellerProducts.filter((p: any) => p.sellerId !== body.sellerId);
    const removed = before - db.sellerProducts.length;

    logActivity(db, admin.id, "SELLER_PRODUCTS_CLEARED", `Removed all ${removed} products from ${seller?.email || body.sellerId}'s store`);
    writeDB(db);
    return NextResponse.json({ success: true, removed });
  }

  if (body.id) {
    const row = db.sellerProducts.find((p: any) => p.id === body.id);
    db.sellerProducts = db.sellerProducts.filter((p: any) => p.id !== body.id);

    if (row) {
      const seller = db.users.find((u: any) => u.id === row.sellerId);
      logActivity(db, admin.id, "SELLER_PRODUCT_REMOVED", `Removed a product from ${seller?.email || row.sellerId}'s store`);
    }
    writeDB(db);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "id or sellerId+all required" }, { status: 400 });
}
