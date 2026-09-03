import { NextResponse } from "next/server";
import { readDB, writeDB } from "../../lib/server";

export const runtime = "nodejs";

const DEFAULT_PACKAGES = [
  {
    id: "silver",
    name: "Silver",
    price: 0,
    productLimit: 100,
    commission: 20,
    status: "Active"
  },
  {
    id: "bronze",
    name: "Bronze",
    price: 1999,
    productLimit: 200,
    commission: 25,
    status: "Active"
  },
  {
    id: "diamond",
    name: "Diamond",
    price: 2999,
    productLimit: 300,
    commission: 30,
    status: "Active"
  }
];

export async function GET(){
  const db = readDB();
  if (!db.packages || db.packages.length === 0) {
    db.packages = DEFAULT_PACKAGES;
    writeDB(db);
  }
  return NextResponse.json({
    packages: db.packages
  });
}