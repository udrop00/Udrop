import {NextResponse} from "next/server";
import {readDB,writeDB,userFromRequest,logActivity} from "../../../../lib/server";
import {addSystemMessage,addNotification} from "../../../../lib/notifications";
export const runtime="nodejs";
const transitions:Record<string,string>={pending:"handed_over",handed_over:"on_the_way",on_the_way:"delivered",delivered:"completed"};
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
 const admin=userFromRequest(req); if(!admin||admin.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const {id}=await params; const body=await req.json(); const status=String(body.status||""); const db=readDB(); const o=(db.orders||[]).find((x:any)=>x.id===id);
 if(!o)return NextResponse.json({error:"Order not found"},{status:404});
 if(status===o.status)return NextResponse.json({order:o});
 if(transitions[o.status]!==status)return NextResponse.json({error:`Order must move from ${o.status} to ${transitions[o.status]||"a final state"}.`},{status:409});
 if(status==="completed"){
   const customer=db.users.find((u:any)=>u.id===o.customerId); if(!customer)return NextResponse.json({error:"Customer not found"},{status:404});
   customer.balance=Number(customer.balance||0)+Number(o.orderAmount)+Number(o.commission);
   customer.profit=Number(customer.profit||0)+Number(o.commission);
   o.status="completed"; o.completedAt=new Date().toISOString();
   addSystemMessage(db,customer.id,`Your order ${o.productName} is completed. $${Number(o.orderAmount).toFixed(2)} order amount and $${Number(o.commission).toFixed(2)} commission have been added to your Total Balance. Your Total Profit is now $${Number(customer.profit).toFixed(2)}.`);
   addNotification(db, customer.id, {
     title: "🎉 Order Completed!",
     message: `Order for "${o.productName}" is completed! $${Number(o.orderAmount).toFixed(2)} + $${Number(o.commission).toFixed(2)} commission (${o.commissionPercent}%) returned to your wallet balance. Total Profit: $${Number(customer.profit).toFixed(2)}`,
     type: "order",
     metadata: { orderId: o.id }
   });
   logActivity(db,admin.id,"ORDER_COMPLETED",`Completed ${o.productName}; returned $${Number(o.orderAmount).toFixed(2)} + $${Number(o.commission).toFixed(2)} commission`);
   writeDB(db); return NextResponse.json({order:o,customer:{balance:customer.balance,profit:customer.profit}});
 }
 o.status=status; o.statusUpdatedAt=new Date().toISOString();
 const readableStatus = status.replace(/_/g," ").toUpperCase();
 addSystemMessage(db,o.customerId,`Your order ${o.productName} status has been updated to ${readableStatus}.`);
 addNotification(db, o.customerId, {
   title: "🚚 Order Status Updated",
   message: `Order for "${o.productName}" status changed to: ${readableStatus}`,
   type: "order",
   metadata: { orderId: o.id }
 });
 logActivity(db,admin.id,"ORDER_STATUS_UPDATED",`Changed ${o.productName} status to ${status}`);
 writeDB(db); return NextResponse.json({order:o});
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = userFromRequest(req);
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const db = readDB();
  const index = (db.orders || []).findIndex((x: any) => x.id === id);
  if (index === -1) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const o = db.orders[index];
  if (o.status !== "sent") {
    return NextResponse.json(
      { error: "Order has already been picked up by the customer and cannot be deleted." },
      { status: 400 }
    );
  }

  db.orders.splice(index, 1);
  logActivity(db, admin.id, "ORDER_DELETED", `Deleted unpicked order #${o.id.slice(0, 8)} (${o.productName})`);
  writeDB(db);

  return NextResponse.json({ success: true, message: "Order successfully deleted." });
}
