import crypto from "node:crypto";
import {NextResponse} from "next/server";

import {readDB,writeDB,userFromRequest,logActivity} from "../../../lib/server";
export const runtime="nodejs";
function admin(req:Request){const u=userFromRequest(req); return u?.role==="admin"?u:null;}
export async function GET(req:Request){const a=admin(req); if(!a)return NextResponse.json({error:"Forbidden"},{status:403}); const db=readDB(); const invites=db.invites.map((i:any)=>({...i,used:!!i.usedAt,revoked:!!i.revokedAt})); return NextResponse.json({invites});}
export async function POST(req:Request){const a=admin(req); if(!a)return NextResponse.json({error:"Forbidden"},{status:403}); const body=await req.json().catch(()=>({})); const days=Math.min(Math.max(Number(body.days)||7,1),30); const token=crypto.randomBytes(18).toString("base64url"); const now=new Date(); const invite={id:crypto.randomUUID(),token,createdBy:a.id,createdAt:now.toISOString(),expiresAt:Date.now()+days*86400000}; const db=readDB(); db.invites.unshift(invite); logActivity(db,a.id,"INVITE_CREATED",`Invitation created; expires in ${days} day(s)`); writeDB(db); const origin=new URL(req.url).origin; return NextResponse.json({invite:{...invite,url:`${origin}/register?invite=${token}`}});}
