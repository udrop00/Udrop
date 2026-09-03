import {NextResponse} from 'next/server';
import crypto from 'node:crypto';
import {readDB,writeDB,userFromRequest,logActivity} from '../../../lib/server';

import {addSystemMessage, addNotification} from '../../../lib/notifications';
export const runtime='nodejs';
export async function GET(req:Request){const admin=userFromRequest(req);if(!admin||admin.role!=='admin')return NextResponse.json({error:'Forbidden'},{status:403});const db=readDB();return NextResponse.json({orders:db.orders||[],users:db.users.map((u:any)=>({
id:u.id,
name:u.name,
email:u.email,
shopName:u.shopName || "",
balance:Number(u.balance||0),
profit:Number(u.profit||0),
guaranteeMoney:Number(u.guaranteeMoney||0),
status:u.status,
role:u.role,
currentPackage: u.currentPackage || u.currentPackageName || "",
currentPackageName: u.currentPackageName || u.currentPackage || "",
commissionRate: Number(u.commissionRate || 0)
}))},{headers:{'Cache-Control':'no-store'}})}
export async function POST(req:Request){

  const admin = userFromRequest(req);

  if(!admin || admin.role!=="admin")
    return NextResponse.json(
      {error:"Forbidden"},
      {status:403}
    );


  const body = await req.json();


  const customerId = String(
    body.customerId || ""
  );

  const productId = String(
    body.productId || ""
  );


  const db = readDB();


  const customer = db.users.find(
    (u:any)=>
      u.id === customerId &&
      u.role === "customer"
  );


  const product = (db.products || []).find(
  (p:any)=>
    String(p.id) === productId
);


  if(!customer || !product){

    return NextResponse.json(
      {
        error:"Customer or product not found"
      },
      {
        status:404
      }
    );

  }

  const inStore = (db.sellerProducts || []).some(
    (sp:any) => sp.sellerId === customerId && String(sp.productId) === productId
  );

  if(!inStore){
    return NextResponse.json(
      {
        error:"This product is not in the seller's store. The seller must add it to their store first."
      },
      {
        status:400
      }
    );
  }



  const commissionPercent = Number(
    (customer as any).commissionRate || 0
  );



  if(
    !commissionPercent ||
    commissionPercent <= 0
  ){

    return NextResponse.json(
      {
        error:"Customer package commission not found."
      },
      {
        status:400
      }
    );

  }



  const orderAmount = Number(
    product.price || 0
  );


  const commission =
    Math.round(
      orderAmount *
      commissionPercent
    ) / 100;



  const order = {

    id:crypto.randomUUID(),

    customerId,

    productId,

    productName:
      product.name,

    image:
      product.image,

    orderAmount,

    commission,

    commissionPercent,

    totalAmount:
      orderAmount + commission,

    status:"sent",

    createdAt:
      new Date().toISOString()

  };



  if(!db.orders)
    db.orders=[];


  db.orders.unshift(order);



  logActivity(
    db,
    admin.id,
    "ORDER_SENT",
    `Sent ${product.name} to ${customer.name}`
  );



  addSystemMessage(
    db,
    customer.id,
    `A new order is available: ${product.name}. Order Amount: $${orderAmount.toFixed(2)}. Commission: $${commission.toFixed(2)} (${commissionPercent}%).`
  );

  addNotification(db, customer.id, {
    title: "📦 New Order Received!",
    message: `You received a new order for "${product.name}" ($${orderAmount.toFixed(2)}). Commission: $${commission.toFixed(2)} (${commissionPercent}%). Go to Available Orders to pick it up!`,
    type: "order",
    metadata: { orderId: order.id }
  });

  writeDB(db);



  return NextResponse.json({
    order
  });


}
