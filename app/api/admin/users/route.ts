import {NextResponse} from "next/server"; import {readDB,safeUser,userFromRequest} from "../../../lib/server";
export const runtime="nodejs";
export async function GET(req:Request){const admin=userFromRequest(req);if(!admin||admin.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});const db=readDB();const sorted=[...db.users].sort((a:any,b:any)=>new Date(b.createdAt||0).getTime()-new Date(a.createdAt||0).getTime());return NextResponse.json({users:sorted.map(safeUser)});}
