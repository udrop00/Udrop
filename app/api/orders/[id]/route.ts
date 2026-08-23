import {NextResponse} from 'next/server';
import {readDB,writeDB,userFromRequest,logActivity} from '../../../lib/server';
export const runtime='nodejs';
export async function DELETE(req:Request,{params}:{params:Promise<{id:string}>}){const user=userFromRequest(req);if(!user||user.role!=='customer')return NextResponse.json({error:'Forbidden'},{status:403});const {id}=await params;const db=readDB();const idx=(db.orders||[]).findIndex((o:any)=>o.id===id&&o.customerId===user.id&&o.status==='sent');if(idx<0)return NextResponse.json({error:'Order cannot be cancelled now'},{status:409});const o=(db.orders||[])[idx];db.orders?.splice(idx,1);logActivity(db,user.id,'ORDER_CANCELLED',`Cancelled ${o.productName}`);writeDB(db);return NextResponse.json({ok:true})}
