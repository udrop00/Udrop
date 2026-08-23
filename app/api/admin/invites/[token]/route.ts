import {NextResponse} from "next/server";

import {readDB,writeDB,userFromRequest,logActivity} from "../../../../lib/server";
export const runtime="nodejs";
export async function DELETE(req:Request,{params}:{params:Promise<{token:string}>}){const a=userFromRequest(req);if(!a||a.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});const {token}=await params;const db=readDB();const i=db.invites.find((x:any)=>x.token===token);if(!i)return NextResponse.json({error:"Invitation not found"},{status:404});if(i.usedAt)return NextResponse.json({error:"Invitation already used"},{status:409});i.revokedAt=new Date().toISOString();logActivity(db,a.id,"INVITE_REVOKED","Invitation revoked");writeDB(db);return NextResponse.json({ok:true});}
