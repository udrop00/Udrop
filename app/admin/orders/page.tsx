"use client";
import {useEffect,useState} from "react";
import {AdminShell} from "../../components";
import {apiFetch} from "../../lib";
import {ORDER_STATUSES,orderStatusLabel} from "../../order-statuses";

export default function AdminOrders(){
  const[users,setUsers]=useState<any[]>([]);
  const[orders,setOrders]=useState<any[]>([]);
  const[products,setProducts]=useState<any[]>([]);
  const[selectedUser,setSelectedUser]=useState("");
  const[selectedProduct,setSelectedProduct]=useState("");
  const[commission,setCommission]=useState("10");
  const[amount,setAmount]=useState("");
  const[adjust,setAdjust]=useState("");
  const[message,setMessage]=useState("");

  const load=async()=>{
    const r=await apiFetch("/api/admin/orders",{cache:"no-store"});
    const d=await r.json();
    setUsers(d.users||[]);
    setOrders(d.orders||[]);
  };
  useEffect(()=>{
    load();
    const timer=setInterval(load,1000);
    apiFetch("/api/products").then(r=>r.json()).then(d=>setProducts(d.products||[]));
    return()=>clearInterval(timer);
  },[]);

  const pickProduct=(id:string)=>{
    setSelectedProduct(id);
    const p=products.find(x=>String(x.id)===id);
    setAmount(p?String(p.price):"");
  };

  const send=async()=>{
    setMessage("");
    const r=await apiFetch("/api/admin/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({customerId:selectedUser,productId:Number(selectedProduct),commissionPercent:Number(commission)})});
    const d=await r.json();
    if(!r.ok){setMessage(d.error||"Could not create order");return;}
    setMessage("Order sent successfully.");
    load();
  };

  const updateStatus=async(id:string,status:string)=>{
    setMessage("");
    const r=await apiFetch(`/api/admin/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});
    const d=await r.json();
    if(!r.ok){setMessage(d.error||"Could not update order status");return;}
    setMessage(status==="completed"?"Order completed. Total Balance and Total Profit updated.":`Order status changed to ${orderStatusLabel(status)}.`);
    load();
  };

  const balanceAdjust=async(mode:"add"|"deduct")=>{
    if(!selectedUser||!adjust)return;
    const r=await apiFetch("/api/admin/balance",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:selectedUser,amount:Number(adjust),mode})});
    const d=await r.json();
    setMessage(r.ok?`Total Balance updated to $${Number(d.user.balance).toFixed(2)}`:d.error||"Balance update failed");
    setAdjust("");
    load();
  };

  const chosen=users.find(u=>u.id===selectedUser);
  const nextStatus=(status:string)=>{
    if(status==="pending")return "handed_over";
    if(status==="handed_over")return "on_the_way";
    if(status==="on_the_way")return "delivered";
    if(status==="delivered")return "completed";
    return "";
  };

  return <AdminShell>
    <div className="topbar"><div><span className="eyebrow">Order management</span><h1>Orders & Customer Funds</h1></div><span className="admin-chip">10–15% commission</span></div>
    {message&&<div className="info-banner">{message}</div>}

    <div className="admin-order-grid">
      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">Create order</span><h2>Send an order to a customer</h2></div></div>
        <div className="form-grid admin-form">
          <label>Customer<select value={selectedUser} onChange={e=>setSelectedUser(e.target.value)}><option value="">Select customer</option>{users.filter(u=>u.role!=="admin").map(u=><option key={u.id} value={u.id}>{u.name} — ${Number(u.balance||0).toFixed(2)} Total Balance</option>)}</select></label>
          <label>Product<select value={selectedProduct} onChange={e=>pickProduct(e.target.value)}><option value="">Select product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} — ${p.price}</option>)}</select></label>
          <label>Order Amount<input value={amount} readOnly placeholder="Product price"/></label>
          <label>Commission<select value={commission} onChange={e=>setCommission(e.target.value)}>{[10,11,12,13,14,15].map(n=><option key={n} value={n}>{n}%</option>)}</select></label>
        </div>
        <div className="formula-box">Order Amount <b>${Number(amount||0).toFixed(2)}</b> + Commission <b>${(Number(amount||0)*Number(commission)/100).toFixed(2)}</b> = Total <b>${(Number(amount||0)*(1+Number(commission)/100)).toFixed(2)}</b></div>
        <button className="btn" disabled={!selectedUser||!selectedProduct} onClick={send}>Send Order</button>
      </section>

      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">Funds</span><h2>Total Balance & Total Profit</h2></div></div>
        {!chosen?<div className="empty-state">Select a customer to manage funds.</div>:<><div className="fund-cards"><div><span>Total Balance</span><strong>${Number(chosen.balance||0).toFixed(2)}</strong></div><div><span>Total Profit</span><strong>${Number(chosen.profit||0).toFixed(2)}</strong></div></div>
          <div className="adjust-row"><input value={adjust} onChange={e=>setAdjust(e.target.value)} placeholder="Amount" type="number" min="0" step="0.01"/><button className="table-btn" onClick={()=>balanceAdjust("add")}>+ Add</button><button className="table-btn" onClick={()=>balanceAdjust("deduct")}>− Deduct</button></div>
          <p className="hint">Add/Deduct changes Total Balance. Grabbed orders deduct the Order Amount. Completed orders return the Order Amount + Commission to Total Balance and add the Commission to Total Profit.</p>
        </>}
      </section>
    </div>

    <section className="panel">
      <div className="panel-head"><div><span className="eyebrow">Order queue</span><h2>All orders</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th>Product</th><th>Customer</th><th>Amount</th><th>Commission</th><th>Status</th><th>Next step</th></tr></thead><tbody>{orders.map(o=>{const next=nextStatus(o.status);return <tr key={o.id}>
        <td><div className="user-cell"><img className="table-thumb" src={o.image} alt=""/><div><b>{o.productName}</b><small>{o.id.slice(0,8)}</small></div></div></td>
        <td>{users.find(u=>u.id===o.customerId)?.name||"Customer"}</td>
        <td>${Number(o.orderAmount).toFixed(2)}</td>
        <td>${Number(o.commission).toFixed(2)} ({o.commissionPercent}%)</td>
        <td><span className={`status ${o.status}`}>{orderStatusLabel(o.status)}</span></td>
        <td>{next?<div className="status-action"><select value={next} onChange={e=>updateStatus(o.id,e.target.value)}><option value={next}>{orderStatusLabel(next)}</option></select><button className="table-btn" onClick={()=>updateStatus(o.id,next)}>Update</button></div>:<span className="hint">—</span>}</td>
      </tr>})}</tbody></table></div>
    </section>
  </AdminShell>;
}
