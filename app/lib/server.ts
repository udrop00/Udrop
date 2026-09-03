import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

type User = { id:string; name:string; username?:string; email:string; phone?:string; countryCode?:string; country?:string; profileImage?:string; passwordHash:string; salt:string; role:"customer"|"admin"; status:"Active"|"Suspended"; createdAt:string; balance?:number; profit?:number; guaranteeMoney?:number; sellerRating?:number; shopName?:string; currentPackage?:string|null; currentPackageName?:string; packageStatus?:string; packageExpiry?:string|null; productLimit?:number; commissionRate?:number; kycStatus?:string; documents?:any[]; [key:string]:any };
type Message = { id:string; conversationId:string; senderId:string; text:string; imageUrl?:string; createdAt:string; readBy?:string[] };
type Conversation = { id:string; customerId:string; status:"open"|"closed"; updatedAt:string };
type Invite = { id:string; token:string; createdBy:string; createdAt:string; expiresAt:number; usedAt?:string; usedBy?:string; revokedAt?:string };
type DB = { users:User[]; sessions:Record<string,{userId:string;expiresAt:number}>; activity:{id:string;userId:string;action:string;description:string;createdAt:string}[]; conversations:Conversation[]; messages:Message[]; invites:Invite[]; products:any[]; orders:any[]; packages:any[]; packageRequests:any[]; withdrawals:any[]; [key:string]:any };
const file=path.join(process.cwd(),"data","db.json");
const seedFile=path.join(process.cwd(),"data","seed.json");
function ensure(){
  if(!fs.existsSync(file)){
    fs.mkdirSync(path.dirname(file),{recursive:true});
    if(fs.existsSync(seedFile)){
      fs.copyFileSync(seedFile,file);
    } else {
      fs.writeFileSync(file,JSON.stringify({users:[],sessions:{},activity:[],conversations:[],messages:[],invites:[],packages:[],packageRequests:[],withdrawals:[],sellerProducts:[],notifications:[],products:[]},null,2));
    }
  }
}
let globalDBRevision = Date.now();
export function getDBRevision(){ return globalDBRevision; }
export function touchDBRevision(){ globalDBRevision = Date.now(); }
export function readDB():DB{
  ensure();
  let db:DB=JSON.parse(fs.readFileSync(file,"utf8"));
  if(!db.users) db.users=[];
  if(!db.invites) db.invites=[];
  if(!db.products) db.products=[];
  if(!db.orders) db.orders=[];
  if(!db.conversations) db.conversations=[];
  if(!db.messages) db.messages=[];
  if(!db.packages) db.packages=[];
  if(!db.packageRequests) db.packageRequests=[];
  if(!db.withdrawals) db.withdrawals=[];
  if(!db.sellerProducts) db.sellerProducts=[];
  if(!db.notifications) db.notifications=[];

  // If products are missing on volume, load from seed
  if(db.products.length===0 && fs.existsSync(seedFile)){
    try{
      const seedData = JSON.parse(fs.readFileSync(seedFile,"utf8"));
      if(Array.isArray(seedData.products) && seedData.products.length>0){
        db.products = seedData.products;
        if(db.packages.length===0 && Array.isArray(seedData.packages)) db.packages = seedData.packages;
        writeDB(db);
      }
    }catch{}
  }

  // Ensure Admin exists
  let admin = db.users.find((u:any)=>u.role==="admin");
  if(!admin){
    const {salt,hash} = hashPassword("admin@ubuy");
    admin = {
      id:"admin-001",
      name:"Drop Zone Admin",
      email:"admin@dropzone.com",
      passwordHash:hash,
      salt:salt,
      role:"admin",
      status:"Active",
      createdAt:new Date().toISOString()
    };
    db.users.unshift(admin);
    writeDB(db);
  }

  for(const m of db.messages){if(!Array.isArray(m.readBy))m.readBy=[];}
  return db;
}
export function writeDB(db:DB){fs.writeFileSync(file,JSON.stringify(db,null,2)); globalDBRevision = Date.now();}
export function hashPassword(password:string,salt?:string){const s=salt||crypto.randomBytes(16).toString("hex");return {salt:s,hash:crypto.scryptSync(password,Buffer.from(s,"hex"),64).toString("hex")};}
export function verifyPassword(password:string,user:User){const hash=crypto.scryptSync(password,Buffer.from(user.salt,"hex"),64).toString("hex");return crypto.timingSafeEqual(Buffer.from(hash,"hex"),Buffer.from(user.passwordHash,"hex"));}
export function safeUser(u:User){
  return {
    id:u.id,
    name:u.name,
    username:u.username||"",
    email:u.email,
    phone:u.phone||"",
    countryCode:u.countryCode||"",
    country:u.country||"United States",
    profileImage:u.profileImage||"",
    role:u.role,
    status:u.status,
    createdAt:u.createdAt,

    balance:Number(u.balance||0),

    profit:Number(
      (u as any).profit||0
    ),
guaranteeMoney:Number((u as any).guaranteeMoney||0),
sellerRating:Number((u as any).sellerRating||0),

    shopName:(u as any).shopName||"",

    currentPackage:
      (u as any).currentPackage||null,
currentPackageName:
  (u as any).currentPackageName || "",

    packageStatus:
      (u as any).packageStatus||"none",

    packageExpiry:
      (u as any).packageExpiry||null,

    productLimit:Number(
      (u as any).productLimit||0
    ),

    commissionRate:Number(
      (u as any).commissionRate||0
    ),

    kycStatus:
      (u as any).kycStatus||"pending"
  };
}
export function logActivity(db:DB,userId:string,action:string,description:string){db.activity.unshift({id:crypto.randomUUID(),userId,action,description,createdAt:new Date().toISOString()});db.activity=db.activity.slice(0,5000);}
export function newSession(db:DB,userId:string,days=7){const token=crypto.randomBytes(32).toString("hex");db.sessions[token]={userId,expiresAt:Date.now()+1000*60*60*24*days};return token;}
export function userFromToken(token?:string|null){if(!token)return null;const db=readDB();const s=db.sessions[token];if(!s)return null;if(s.expiresAt<Date.now()){delete db.sessions[token];writeDB(db);return null;}return db.users.find(u=>u.id===s.userId)||null;}

export function tokenFromRequest(req:Request){
  const auth=req.headers.get("authorization")||"";
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
}
export function userFromRequest(req:Request){return userFromToken(tokenFromRequest(req));}
