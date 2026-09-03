"use client";

import {useEffect,useState,useCallback,Suspense} from "react";
import {useSearchParams} from "next/navigation";
import {AdminShell} from "../../components";
import {apiFetch,useRealtimeStream} from "../../lib";

function POSInner(){

const searchParams=useSearchParams();
const presetCustomerId=searchParams.get("customerId") || "";

const [users,setUsers]=useState<any[]>([]);
const [orders,setOrders]=useState<any[]>([]);
const [storeProducts,setStoreProducts]=useState<any[]>([]);

const [selectedUser,setSelectedUser]=useState("");
const [selectedProduct,setSelectedProduct]=useState("");
const [customerSearch,setCustomerSearch]=useState("");

const [amount,setAmount]=useState("");

const [adjust,setAdjust]=useState("");
const [adjustTarget,setAdjustTarget]=useState<"balance"|"guaranteeMoney"|"profit">("balance");
const [adjusting,setAdjusting]=useState(false);
const [message,setMessage]=useState("");


const load = useCallback(async()=>{
  try {
    const r=await apiFetch("/api/admin/orders",{ cache:"no-store" });
    const d=await r.json();
    setUsers(d.users||[]);
    setOrders(d.orders||[]);
  } catch {}
}, []);


useEffect(()=>{
  load();
},[load]);

useEffect(()=>{
  if(presetCustomerId) setSelectedUser(presetCustomerId);
},[presetCustomerId]);

useRealtimeStream(()=>{
  load();
});


// Load only the selected customer's OWN store products (not the master catalog)
useEffect(()=>{

  setSelectedProduct("");
  setAmount("");

  if(!selectedUser){
    setStoreProducts([]);
    return;
  }

  apiFetch(`/api/admin/seller-products?sellerId=${selectedUser}`)
    .then(r=>r.json())
    .then(d=>{
      const items=(d.items || []).map((it:any)=>it.product).filter(Boolean);
      setStoreProducts(items);
    })
    .catch(()=>setStoreProducts([]));

},[selectedUser]);




const pickProduct=(id:string)=>{

setSelectedProduct(id);

const p=storeProducts.find(x=>String(x.id)===id);

setAmount(p ? String(p.price) : "");

};




const send=async()=>{

setMessage("");

const r=await apiFetch(
"/api/admin/orders",
{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({
customerId:selectedUser,
productId:selectedProduct
})
}
);

const d=await r.json();

if(!r.ok){
setMessage(d.error || "Could not create order");
return;
}

setMessage("Order sent successfully.");

setSelectedProduct("");
setAmount("");

load();

};




const balanceAdjust=async(mode:"add"|"deduct")=>{

if(!selectedUser||!adjust||adjusting) return;

const num = Math.round(Number(adjust) * 100) / 100;
if (!Number.isFinite(num) || num <= 0) {
  setMessage("Please enter a valid positive amount.");
  return;
}

setAdjusting(true);
setMessage("");
setAdjust("");

try {
  const r=await apiFetch(
  "/api/admin/balance",
  {
  method:"PATCH",
  headers:{"Content-Type":"application/json"},
  body:JSON.stringify({ userId:selectedUser, amount:num, mode, target:adjustTarget })
  }
  );

  const d=await r.json();

  if (r.ok && d.user) {
    const label = adjustTarget==="guaranteeMoney" ? "Guarantee Money" : adjustTarget==="profit" ? "Profit" : "Wallet Balance";
    const field = adjustTarget;
    setMessage(`${label} updated to $${Number(d.user[field] || 0).toFixed(2)}`);
    setUsers(prev => prev.map(u => u.id === selectedUser ? { ...u, ...d.user } : u));
  } else {
    setMessage(d.error || "Update failed");
  }
} catch {
  setMessage("Update failed");
} finally {
  setAdjusting(false);
}

};




const chosen=users.find(u=>u.id===selectedUser);

const pendingBalance = (orders || [])
  .filter(o => o.customerId === selectedUser && ["pending", "handed_over", "on_the_way"].includes(o.status))
  .reduce((sum, o) => sum + Number(o.orderAmount || 0), 0);




return (

<AdminShell>


<div className="topbar">

<div>
<span className="eyebrow">Point of Sale</span>
<h1>POS System</h1>
</div>

<span className="admin-chip live-chip">
<i/>
Silver 20% · Bronze 25% · Diamond 30%
</span>

</div>



{message&&
<div className="info-banner">{message}</div>
}

<section className="admin-order-grid">


<section className="panel">

<div className="panel-head">
<div>
<span className="eyebrow">Create Order</span>
<h2>Send Order To Customer</h2>
</div>
</div>


<div className="form-grid admin-form">

<label>

Customer

<div className="customer-search-box">

<input
  className="search"
  placeholder="Search customer email..."
  value={
    selectedUser
    ? (users.find(u=>u.id===selectedUser)?.email || "")
    : customerSearch
  }
  onChange={e=>{
    setSelectedUser("");
    setCustomerSearch(e.target.value);
  }}
/>


{customerSearch && !selectedUser && (

<div className="customer-results">

{users
.filter(u=>
  u.role!=="admin" &&
  (u.email || "").toLowerCase().includes(customerSearch.toLowerCase())
)
.map(u=>(

<div
key={u.id}
className="customer-option"
onClick={()=>{
setSelectedUser(u.id);
setCustomerSearch("");
}}
>

<b>{u.name}</b>
<br/>
<small>{u.email}</small>
<br/>
<small>Shop: {u.shopName || "N/A"}</small>

</div>

))}

</div>

)}

</div>

</label>

{selectedUser && (
<small className="hint">
  Shop: {chosen?.shopName || "N/A"} — showing only this seller&apos;s own store products
</small>
)}



<label>

Product

<select
value={selectedProduct}
onChange={e=>pickProduct(e.target.value)}
disabled={!selectedUser}
>

<option value="">
{selectedUser
  ? (storeProducts.length ? "Select product" : "No products in this seller's store")
  : "Select a customer first"}
</option>

{storeProducts.map(p=>(
<option key={p.id} value={p.id}>
{p.name} — ${p.price}
</option>
))}

</select>

</label>



<label>

Order Amount

<input
value={amount}
readOnly
placeholder="Product price"
/>

</label>



<label>

Active Plan

<div className="panel" style={{padding:"12px",marginTop:"8px"}}>

<p>{chosen?.currentPackage || chosen?.currentPackageName || "No Active Plan"}</p>

<p>
Commission:{" "}
{chosen?.commissionRate || 0}%
</p>

</div>

</label>


</div>




<div className="formula-box">

  Order Amount

  <b>${Number(amount || 0).toFixed(2)}</b>

  {" + Commission "}

  <b>
    ${(
        Number(amount || 0) *
        Number(chosen?.commissionRate || 0) / 100
      ).toFixed(2)}
  </b>

  {" = Total "}

  <b>
    ${(
        Number(amount || 0) *
        (1 + Number(chosen?.commissionRate || 0) / 100)
      ).toFixed(2)}
  </b>

</div>



<button
className="btn"
disabled={!selectedUser || !selectedProduct}
onClick={send}
>
Send Order
</button>


</section>



<section className="panel">

<div className="panel-head">
<div>
<span className="eyebrow">Funds Overview</span>
<h2>Seller Funds & Guarantee</h2>
</div>
</div>

<div className="fund-cards" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "16px" }}>

{/* 1. Pending Balance */}
<div className="balance-box" style={{ padding: "14px", borderRadius: "14px", background: "rgba(234, 179, 8, 0.08)", border: "1px solid rgba(234, 179, 8, 0.25)" }}>
<div className="fund-title" style={{ fontSize: "11px", color: "#facc15", fontWeight: 700 }}>⏳ Pending Balance</div>
<strong style={{ fontSize: "20px", color: "#ffffff", margin: "6px 0 2px", display: "block" }}>${pendingBalance.toFixed(2)}</strong>
<small style={{ color: "#fde047", fontSize: "10px" }}>Orders in progress</small>
</div>

{/* 2. Wallet Money */}
<div className="balance-box" style={{ padding: "14px", borderRadius: "14px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
<div className="fund-title" style={{ fontSize: "11px", color: "#6ee7b7", fontWeight: 700 }}>💳 Wallet Money</div>
<strong style={{ fontSize: "20px", color: "#ffffff", margin: "6px 0 2px", display: "block" }}>${Number(chosen?.balance || 0).toFixed(2)}</strong>
<small style={{ color: "#a7f3d0", fontSize: "10px" }}>User Balance</small>
</div>

{/* 3. Guarantee Money */}
<div className="profit-box" style={{ padding: "14px", borderRadius: "14px", background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)" }}>
<div className="fund-title" style={{ fontSize: "11px", color: "#7dd3fc", fontWeight: 700 }}>🛡️ Guarantee Money</div>
<strong style={{ fontSize: "20px", color: "#ffffff", margin: "6px 0 2px", display: "block" }}>${Number(chosen?.guaranteeMoney || 0).toFixed(2)}</strong>
<small style={{ color: "#bae6fd", fontSize: "10px" }}>Deposit / Guarantee</small>
</div>

</div>

<label>
Adjust

<div className="adjust-row" style={{marginBottom:8}}>
  <select value={adjustTarget} onChange={e=>setAdjustTarget(e.target.value as "balance"|"guaranteeMoney"|"profit")}>
    <option value="balance">Wallet Money (Balance)</option>
    <option value="guaranteeMoney">Guarantee Money</option>
    <option value="profit">Total Profit</option>
  </select>
</div>

<div className="adjust-row">

<input
type="number"
step="0.01"
min="0.01"
placeholder="Amount"
value={adjust}
disabled={adjusting}
onChange={e=>setAdjust(e.target.value)}
/>

<button
  className="btn btn-small"
  disabled={adjusting || !selectedUser || !adjust}
  onClick={()=>balanceAdjust("add")}
>
  {adjusting ? "Processing..." : "+ Add"}
</button>

<button
  className="btn btn-small danger-btn"
  disabled={adjusting || !selectedUser || !adjust}
  onClick={()=>balanceAdjust("deduct")}
>
  {adjusting ? "Processing..." : "− Deduct"}
</button>

</div>
</label>

<small className="hint">
Add/Deduct changes the selected fund directly. Picked up orders deduct the Order Amount from Wallet Money. Completed orders return the Order Amount + Commission to Wallet Money and add Commission to Profit.
</small>

</section>


</section>

</AdminShell>

);
}

export default function AdminPOS(){
  return (
    <Suspense fallback={null}>
      <POSInner/>
    </Suspense>
  );
}
