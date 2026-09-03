import {NextResponse} from 'next/server';
import {readDB,writeDB,userFromRequest,logActivity} from '../../../lib/server';
import {addSystemMessage,addNotification} from '../../../lib/notifications';
export const runtime='nodejs';
export async function PATCH(req:Request){
  const admin=userFromRequest(req);
  if(!admin||admin.role!=='admin')return NextResponse.json({error:'Forbidden'},{status:403});
  const {userId,amount,mode,target="balance"}=await req.json();
  const db=readDB();
  const u=db.users.find((x:any)=>x.id===String(userId)&&x.role==='customer');
  const n=Math.round(Number(amount)*100)/100;
  if(!u||!Number.isFinite(n)||n<=0)return NextResponse.json({error:'Invalid adjustment amount'},{status:400});

  if(target==="guaranteeMoney"){
    const current=Math.round(Number(u.guaranteeMoney||0)*100)/100;
    let nextVal=mode==='deduct'?(current-n):(current+n);
    if(nextVal<0)nextVal=0;
    u.guaranteeMoney=Math.round(nextVal*100)/100;
    logActivity(db,admin.id,mode==='deduct'?'GUARANTEE_DEDUCTED':'GUARANTEE_ADDED',`${mode==='deduct'?'Deducted':'Added'} $${n.toFixed(2)} Guarantee Money for ${u.email}`);
    addSystemMessage(db,u.id,mode==='deduct'?`Your Guarantee Money has been reduced by $${n.toFixed(2)}. Current: $${u.guaranteeMoney.toFixed(2)}.`:`Your Guarantee Money has been updated with $${n.toFixed(2)}. Current: $${u.guaranteeMoney.toFixed(2)}.`);
    addNotification(db, u.id, {
      title: mode==='deduct' ? "🛡️ Guarantee Money Deducted" : "🛡️ Guarantee Money Added",
      message: mode==='deduct' ? `Admin deducted $${n.toFixed(2)} from your Guarantee Money. Balance: $${u.guaranteeMoney.toFixed(2)}` : `Admin added $${n.toFixed(2)} to your Guarantee Money. Balance: $${u.guaranteeMoney.toFixed(2)}`,
      type: "guarantee"
    });
  } else if(target==="profit"){
    const current=Math.round(Number(u.profit||0)*100)/100;
    let nextVal=mode==='deduct'?(current-n):(current+n);
    if(nextVal<0)nextVal=0;
    u.profit=Math.round(nextVal*100)/100;
    logActivity(db,admin.id,mode==='deduct'?'PROFIT_DEDUCTED':'PROFIT_ADDED',`${mode==='deduct'?'Deducted':'Added'} $${n.toFixed(2)} Profit for ${u.email}`);
    addSystemMessage(db,u.id,mode==='deduct'?`Your Total Profit has been adjusted by -$${n.toFixed(2)}.`:`Your Total Profit has been updated with +$${n.toFixed(2)}.`);
    addNotification(db, u.id, {
      title: mode==='deduct' ? "💰 Profit Adjusted (Deduction)" : "💰 Profit Credited",
      message: mode==='deduct' ? `Admin reduced your profit by $${n.toFixed(2)}. Total Profit: $${u.profit.toFixed(2)}` : `Admin added $${n.toFixed(2)} to your profit. Total Profit: $${u.profit.toFixed(2)}`,
      type: "profit"
    });
  } else {
    const current=Math.round(Number(u.balance||0)*100)/100;
    let nextVal=mode==='deduct'?(current-n):(current+n);
    if(nextVal<0)nextVal=0;
    u.balance=Math.round(nextVal*100)/100;
    logActivity(db,admin.id,mode==='deduct'?'BALANCE_DEDUCTED':'BALANCE_ADDED',`${mode==='deduct'?'Deducted':'Added'} $${n.toFixed(2)} for ${u.email}`);
    addSystemMessage(db,u.id,mode==='deduct'?`Your Wallet Balance has been reduced by $${n.toFixed(2)}. Current: $${u.balance.toFixed(2)}.`:`Your Wallet Balance has been updated with a $${n.toFixed(2)} deposit. Current: $${u.balance.toFixed(2)}.`);
    addNotification(db, u.id, {
      title: mode==='deduct' ? "💳 Wallet Balance Deducted" : "💳 Deposit Received",
      message: mode==='deduct' ? `Admin deducted $${n.toFixed(2)} from your wallet. Current Balance: $${u.balance.toFixed(2)}` : `Admin deposited $${n.toFixed(2)} to your wallet. Current Balance: $${u.balance.toFixed(2)}`,
      type: "balance"
    });
  }
  
  writeDB(db);
  return NextResponse.json({user:{id:u.id,balance:u.balance,profit:u.profit,guaranteeMoney:u.guaranteeMoney}});
}
