"use client";

import {useEffect,useState,useCallback,useMemo,Fragment} from "react";
import {AdminShell} from "../../components";
import {apiFetch,useRealtimeStream} from "../../lib";
import {orderStatusLabel} from "../../order-statuses";


export default function AdminOrders(){


const [users,setUsers]=useState<any[]>([]);
const [orders,setOrders]=useState<any[]>([]);

const [emailSearch,setEmailSearch]=useState("");
const [expandedId,setExpandedId]=useState("");

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

useRealtimeStream(()=>{
  load();
});


const updateStatus=async(id:string,status:string)=>{

setMessage("");

const r=await apiFetch(
`/api/admin/orders/${id}`,
{
method:"PATCH",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({status})
}
);

const d=await r.json();

if(!r.ok){
setMessage(d.error || "Could not update order");
return;
}

setMessage(`Order status changed to ${orderStatusLabel(status)}`);

load();

};

const deleteOrder = async (id: string) => {
  if (!window.confirm("Are you sure you want to delete this pending order?")) return;
  setMessage("");
  try {
    const r = await apiFetch(`/api/admin/orders/${id}`, {
      method: "DELETE"
    });
    const d = await r.json();
    if (!r.ok) {
      setMessage(d.error || "Could not delete order");
      return;
    }
    setMessage("✓ Pending order successfully deleted.");
    load();
  } catch {
    setMessage("Failed to delete order");
  }
};


const nextStatus=(status:string)=>{

if(status==="pending") return "handed_over";
if(status==="handed_over") return "on_the_way";
if(status==="on_the_way") return "delivered";
if(status==="delivered") return "completed";

return "";

};


const usersById = useMemo(()=>{
  const map:Record<string,any> = {};
  for(const u of users) map[u.id]=u;
  return map;
},[users]);


// filter by customer email, newest orders first
const filteredOrders = useMemo(()=>{

  const search = emailSearch.trim().toLowerCase();

  let list = orders;

  if(search){
    list = list.filter(o=>{
      const email = usersById[o.customerId]?.email || "";
      return email.toLowerCase().includes(search);
    });
  }

  return [...list].sort((a,b)=>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );

},[orders,emailSearch,usersById]);


const fmtDate=(iso?:string)=>{
  if(!iso) return "—";
  const d=new Date(iso);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
};


return (

<AdminShell>


<div className="topbar">

<div>
<span className="eyebrow">Order Management</span>
<h1>All Orders</h1>
</div>

<span className="admin-chip live-chip">
<i/>
{filteredOrders.length} orders
</span>

</div>



{message&&
<div className="info-banner">{message}</div>
}


<section className="panel">

<div className="panel-head">
<div>
<span className="eyebrow">Search</span>
<h2>Find orders by customer email</h2>
</div>
</div>

<input
  className="search"
  placeholder="Search customer email..."
  value={emailSearch}
  onChange={e=>setEmailSearch(e.target.value)}
  style={{maxWidth:420}}
/>

<small className="hint" style={{display:"block",marginTop:8}}>
  Newest orders appear first. Leave blank to see every order.
</small>

</section>


<section className="panel">


<div className="panel-head">
<div>
<span className="eyebrow">Order Queue</span>
<h2>All Orders</h2>
</div>
</div>


<div className="table-wrap">


<table>


<thead>
<tr>
<th>Product</th>
<th>Customer</th>
<th>Amount</th>
<th>Commission</th>
<th>Status</th>
<th>Order Date</th>
<th>Next Step</th>
<th></th>
</tr>
</thead>



<tbody>

{
filteredOrders.length===0 ? (
  <tr><td colSpan={8}>No orders found.</td></tr>
) : (

filteredOrders.map(o=>{

const next=nextStatus(o.status);
const customer=usersById[o.customerId];
const isOpen = expandedId===o.id;

return (
<Fragment key={o.id}>
<tr>

<td>
<div className="order-product-cell">
<img className="table-thumb" src={o.image} alt={o.productName} />
<div>
<b>{o.productName}</b>
<small>#{o.id.slice(0,8).toUpperCase()}</small>
</div>
</div>
</td>

<td>
{customer?.name || "Customer"}
<br/>
<small>{customer?.email || ""}</small>
</td>

<td>
<strong>${Number(o.orderAmount||0).toFixed(2)}</strong>
</td>

<td>
${Number(o.commission||0).toFixed(2)}
<br/>
<small>{o.commissionPercent}%</small>
</td>

<td>
<span className={`status order-status ${o.status}`}>
{orderStatusLabel(o.status)}
</span>
</td>

<td>
<small>{fmtDate(o.createdAt)}</small>
</td>

<td>
{
next
?
<div className="status-action">

<select value={next} onChange={e=>updateStatus(o.id,e.target.value)}>
<option value={next}>{orderStatusLabel(next)}</option>
</select>

<button className="table-btn" onClick={()=>updateStatus(o.id,next)}>
Update
</button>

</div>
:
<span className="hint">Completed</span>
}
</td>

<td style={{ display: "flex", gap: "6px", alignItems: "center" }}>
<button className="table-btn" onClick={()=>setExpandedId(isOpen ? "" : o.id)}>
{isOpen ? "Hide" : "Details"}
</button>
{o.status === "pending" && (
  <button
    className="table-btn danger-btn"
    style={{
      background: "rgba(239, 68, 68, 0.15)",
      color: "#ef4444",
      border: "1px solid rgba(239, 68, 68, 0.4)",
      cursor: "pointer",
      fontWeight: 600
    }}
    onClick={()=>deleteOrder(o.id)}
    title="Delete pending order before customer picks it"
  >
    🗑️ Delete
  </button>
)}
</td>

</tr>

{isOpen && (
<tr className="order-detail-row">
<td colSpan={8}>

<div className="order-detail-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,padding:"12px 4px"}}>

<div>
<b>Customer</b>
<div>{customer?.name || "—"}</div>
<div><small>{customer?.email || "—"}</small></div>
<div><small>Shop: {customer?.shopName || "N/A"}</small></div>
</div>

<div>
<b>Product</b>
<div>{o.productName}</div>
<div><small>Order #{o.id.slice(0,8).toUpperCase()}</small></div>
<div><small>Qty: 1</small></div>
</div>

<div>
<b>Payment</b>
<div>Order Amount: ${Number(o.orderAmount||0).toFixed(2)}</div>
<div>Commission ({o.commissionPercent}%): ${Number(o.commission||0).toFixed(2)}</div>
<div>Total: ${Number(o.totalAmount||0).toFixed(2)}</div>
</div>

<div>
<b>Delivery</b>
<div>Order Date: {fmtDate(o.createdAt)}</div>
<div>Pickup Date: {fmtDate(o.grabbedAt)}</div>
<div>Last Update: {fmtDate(o.statusUpdatedAt)}</div>
<div>Completed: {fmtDate(o.completedAt)}</div>
</div>

</div>

</td>
</tr>
)}

</Fragment>
)
})

)
}


</tbody>


</table>


</div>


</section>



</AdminShell>

);

}
