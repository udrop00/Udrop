import {NextResponse} from "next/server";

import {readDB,writeDB,userFromRequest,logActivity} from "../../../../lib/server";
export const runtime="nodejs";

// DELETE /api/admin/invites/[token] - revokes an unused invite.
// DELETE /api/admin/invites/[token]?permanent=true - permanently removes
// an already used/revoked invite from history (never for still-active ones).
export async function DELETE(req:Request,{params}:{params:Promise<{token:string}>}){
  const a=userFromRequest(req);
  if(!a||a.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});

  const {token}=await params;
  const db=readDB();
  const index=db.invites.findIndex((x:any)=>x.token===token);
  if(index<0)return NextResponse.json({error:"Invitation not found"},{status:404});
  const i=db.invites[index];

  const permanent = new URL(req.url).searchParams.get("permanent")==="true";

  if(permanent){
    if(!i.usedAt && !i.revokedAt){
      return NextResponse.json({error:"Only used or revoked invites can be deleted from history."},{status:400});
    }
    db.invites.splice(index,1);
    logActivity(db,a.id,"INVITE_DELETED","Invitation removed from history");
    writeDB(db);
    return NextResponse.json({ok:true});
  }

  if(i.usedAt)return NextResponse.json({error:"Invitation already used"},{status:409});
  i.revokedAt=new Date().toISOString();
  logActivity(db,a.id,"INVITE_REVOKED","Invitation revoked");
  writeDB(db);
  return NextResponse.json({ok:true});
}
