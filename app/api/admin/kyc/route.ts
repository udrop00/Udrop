import { NextResponse } from "next/server";
import { readDB, writeDB, userFromRequest, logActivity } from "../../../lib/server";
import { addNotification } from "../../../lib/notifications";
import crypto from "node:crypto";

export const runtime = "nodejs";


// GET pending KYC applications
export async function GET(req: Request){

  const admin = userFromRequest(req);

  if(!admin || admin.role !== "admin"){
    return NextResponse.json(
      {error:"Forbidden"},
      {status:403}
    );
  }


  const db = readDB();


  const url = new URL(req.url);

const status = url.searchParams.get("status") || "pending";
const userId = url.searchParams.get("userId");

// Single applicant lookup - includes the (potentially large, base64)
// document images. Used by the admin UI to lazy-load documents only
// when a specific application is opened, instead of on every list load.
if(userId){

  const u = db.users.find(
    (x:any)=>x.id===userId && x.role==="customer"
  );

  if(!u){
    return NextResponse.json(
      {error:"User not found"},
      {status:404}
    );
  }

  return NextResponse.json({
    documents:u.kycDocuments || []
  });

}


const applications = db.users
    .filter((u:any)=>{

      if(u.role !== "customer") return false;

      if(u.kycHiddenFromHistory) return false;


      if(status==="pending"){
        return u.kycStatus !== "Approved" && u.kycStatus !== "Rejected";
      }


      if(status==="approved"){
        return u.kycStatus === "Approved";
      }


      if(status==="rejected"){
        return u.kycStatus === "Rejected";
      }


      return false;

    })
    .map((u:any)=>({

      id:u.id,

      name:u.name,

      shopName:u.shopName || "",

      email:u.email,

      kycStatus:u.kycStatus || "Pending",

      documentCount:(u.kycDocuments || []).length,

      createdAt:u.createdAt,

      kycProcessedAt:u.kycProcessedAt

    }))
    .sort((a:any,b:any)=>{

      const aTime = new Date(
        (status==="pending" ? a.createdAt : (a.kycProcessedAt || a.createdAt)) || 0
      ).getTime();

      const bTime = new Date(
        (status==="pending" ? b.createdAt : (b.kycProcessedAt || b.createdAt)) || 0
      ).getTime();

      return bTime - aTime;

    });


  return NextResponse.json({
    applications
  });

}



// APPROVE / REJECT KYC
export async function PATCH(req:Request){

  const admin = userFromRequest(req);


  if(!admin || admin.role !== "admin"){
    return NextResponse.json(
      {error:"Forbidden"},
      {status:403}
    );
  }


  const body = await req.json();


  const {
    userId,
    action
  } = body;



  const db = readDB();


  const user = db.users.find(
    (u:any)=>u.id===String(userId)
  );


  if(!user){

    return NextResponse.json(
      {error:"User not found"},
      {status:404}
    );

  }



  if(action==="approve"){

    user.kycStatus="Approved";
    user.status="Active";
    user.kycProcessedAt=new Date().toISOString();


    // Default Silver Package Activation

    const silverPackage = (db.packages || []).find(
      (p:any)=>p.name==="Silver"
    ) || {
      id: "silver",
      name: "Silver",
      productLimit: 100,
      commission: 20
    };


    if(silverPackage){
      user.currentPackage = silverPackage.id;
      user.currentPackageName = silverPackage.name;
      user.packageStatus = "active";
      user.productLimit = Number(silverPackage.productLimit || 100);
      user.commissionRate = Number(silverPackage.commission || 20);
      user.packageExpiry = null;
    }

    logActivity(
      db,
      admin.id,
      "KYC_APPROVED",
      `Approved KYC for ${user.email}`
    );

    addNotification(db, user.id, {
      title: "🛡️ KYC Verification Approved!",
      message: `Congratulations! Your KYC seller verification has been approved. Your account is now active with ${user.currentPackageName || "Silver"} Package.`,
      type: "kyc"
    });

}


  if(action==="reject"){

    user.kycStatus="Rejected";
    user.kycProcessedAt=new Date().toISOString();


    logActivity(
      db,
      admin.id,
      "KYC_REJECTED",
      `Rejected KYC for ${user.email}`
    );

    addNotification(db, user.id, {
      title: "⚠️ KYC Verification Rejected",
      message: `Your KYC verification request was rejected by admin. Please contact support or resubmit documents.`,
      type: "kyc"
    });

  }



  writeDB(db);


  return NextResponse.json({
    ok:true,
    status:user.kycStatus
  });

}


// DELETE a processed (Approved/Rejected) KYC entry from history.
// Only clears the stored documents and hides it from the history list -
// the user's approved/rejected status and account stay untouched.
export async function DELETE(req: Request){

  const admin = userFromRequest(req);

  if(!admin || admin.role !== "admin"){
    return NextResponse.json({ error:"Forbidden" }, { status:403 });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if(!userId){
    return NextResponse.json({ error:"User id is required." }, { status:400 });
  }

  const db = readDB();

  const user = db.users.find(
    (u:any)=>u.id===userId && u.role==="customer"
  );

  if(!user){
    return NextResponse.json({ error:"User not found." }, { status:404 });
  }

  if(user.kycStatus !== "Approved" && user.kycStatus !== "Rejected"){
    return NextResponse.json(
      { error:"Only processed (approved/rejected) applications can be deleted from history." },
      { status:400 }
    );
  }

  user.kycDocuments = [];
  user.kycHiddenFromHistory = true;

  logActivity(db, admin.id, "KYC_HISTORY_DELETED", `Removed KYC history entry for ${user.email}`);

  writeDB(db);

  return NextResponse.json({ ok:true });

}