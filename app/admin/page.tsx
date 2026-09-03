"use client";

import Link from "next/link";
import {useEffect,useState,useCallback} from "react";
import {AdminShell} from "../components";
import {apiFetch,useRealtimeStream} from "../lib";
import AdminCharts from "./AdminCharts";


export default function Admin(){


const [users,setUsers]=useState<any[]>([]);
const [orders,setOrders]=useState<any[]>([]);


const [stats,setStats]=useState<any>({

totalUsers:0,
totalProducts:0,
totalOrders:0,

pendingOrders:0,
onWayOrders:0,
deliveredOrders:0,
completedOrders:0,

totalSales:0,
totalCommission:0,

activeProducts:0,
inactiveProducts:0,
lowStockProducts:0,
outOfStockProducts:0

});



const [invites,setInvites]=useState<any[]>([]);
const [inviteUrl,setInviteUrl]=useState("");
const [inviteError,setInviteError]=useState("");


const load = useCallback(()=>{

apiFetch("/api/admin/users",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setUsers(d.users||[]))
.catch(()=>{});

apiFetch("/api/admin/orders",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setOrders(d.orders||[]))
.catch(()=>{});

apiFetch("/api/admin/stats",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setStats(d))
.catch(()=>{});

}, []);


useEffect(()=>{
load();
loadInvites();
},[load]);

useRealtimeStream(()=>{
load();
});







const loadInvites=()=>{


apiFetch(
"/api/admin/invites",
{
cache:"no-store"
}
)
.then(r=>r.json())
.then(d=>
setInvites(d.invites||[])
)
.catch(()=>{});


};







const createInvite=async()=>{


setInviteError("");



const r=await apiFetch(
"/api/admin/invites",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
days:7
})

}

);



const d=await r.json();




if(!r.ok){

setInviteError(
d.error || "Invite creation failed"
);

return;

}




setInviteUrl(
d.invite.url
);


loadInvites();


};







const revokeInvite=async(token:string)=>{


await apiFetch(

`/api/admin/invites/${encodeURIComponent(token)}`,

{
method:"DELETE"
}

);



loadInvites();


};





return (

<AdminShell>
<div className="topbar">


<div>

<span className="eyebrow">
UBUY INTELLIGENCE
</span>


<h1>
Business Control Center
</h1>


</div>



<span className="admin-chip live-chip">

<i/>

Live Database

</span>


</div>





<section className="admin-hero-panel">


<div>

<span className="eyebrow">

Business Overview

</span>


<h2>

Manage Your Complete Store Operations

</h2>


<p>

Monitor orders, products, customers and revenue from one premium dashboard.

</p>


</div>




<div className="hero-actions-admin">


<Link
href="/admin/orders"
className="btn"
>

Manage Orders

</Link>



<Link
href="/admin/products"
className="btn btn-ghost"
>

Products

</Link>



</div>



</section>






<div className="info-banner">


<b>
Live Backend
</b>


<span>

Real-time business statistics connected.

</span>


</div>








<div className="stat-grid admin-stats">



<div className="stat">

<span>
Total Users
</span>

<strong>
{stats.totalUsers}
</strong>

<small>
Registered accounts
</small>

</div>





<div className="stat">

<span>
Products
</span>

<strong>
{stats.totalProducts}
</strong>

<small>
Store inventory
</small>

</div>





<div className="stat">

<span>
Orders
</span>

<strong>
{stats.totalOrders}
</strong>

<small>
Customer orders
</small>

</div>





<div className="stat">

<span>
Revenue
</span>

<strong>
${Number(stats.totalSales||0).toFixed(2)}
</strong>

<small>
Completed sales
</small>

</div>





<div className="stat">

<span>
Commission
</span>

<strong>
${Number(stats.totalCommission||0).toFixed(2)}
</strong>

<small>
Total profit
</small>

</div>





<div className="stat">

<span>
Pending Orders
</span>

<strong>
{stats.pendingOrders}
</strong>

<small>
Waiting process
</small>

</div>





<div className="stat">

<span>
On The Way
</span>

<strong>
{stats.onWayOrders}
</strong>

<small>
Delivery flow
</small>

</div>





<div className="stat">

<span>
Completed
</span>

<strong>
{stats.completedOrders}
</strong>

<small>
Finished orders
</small>

</div>



</div>







<AdminCharts stats={stats}/>







<section className="panel">



<div className="panel-head">


<div>

<span className="eyebrow">
Orders
</span>


<h2>
Recent Orders
</h2>


</div>




<Link

href="/admin/orders"

className="btn btn-small"

>

Manage Orders

</Link>



</div>








<div className="table-wrap">


<table>


<thead>


<tr>

<th>
Product
</th>


<th>
Customer
</th>


<th>
Amount
</th>


<th>
Commission
</th>


<th>
Status
</th>


</tr>


</thead>





<tbody>



{orders.slice(0,8).map((o:any)=>(



<tr key={o.id}>


<td>


<b>
{o.productName}
</b>


<br/>


<small>
#{o.id.slice(0,8)}
</small>


</td>




<td>


{
users.find(
(u:any)=>u.id===o.customerId
)?.name || "Customer"

}


</td>




<td>

${Number(o.orderAmount||0).toFixed(2)}

</td>




<td>

${Number(o.commission||0).toFixed(2)}

</td>




<td>

<span className={`status ${o.status}`}>

{o.status}

</span>

</td>



</tr>



))}



</tbody>


</table>


</div>



</section>
<section className="panel">


<div className="panel-head">


<div>

<span className="eyebrow">
Access Control
</span>


<h2>
Customer Invitations
</h2>


</div>




<button

className="btn btn-small"

onClick={createInvite}

>

Create 7-day Invite

</button>



</div>






{inviteError && (

<div className="form-error">

{inviteError}

</div>

)}







{inviteUrl && (

<div className="invite-box">


<input

value={inviteUrl}

readOnly

/>


<button

className="table-btn"

onClick={()=>
navigator.clipboard.writeText(inviteUrl)
}

>

Copy Link

</button>


</div>

)}








<div className="table-wrap" style={{maxHeight:"420px",overflowY:"auto"}}>


<table>


<thead>

<tr>

<th>
Token
</th>

<th>
Status
</th>

<th>
Expiry
</th>

<th>
Action
</th>


</tr>

</thead>





<tbody>


{invites.map((i:any)=>(


<tr key={i.id}>


<td>

<small>

{i.token}

</small>

</td>




<td>


<span className={`status ${i.revoked ? "suspended" : "active"}`}>

{i.used ? "Used" : i.revoked ? "Revoked" : "Available"}

</span>


</td>




<td>

{new Date(i.expiresAt).toLocaleString()}

</td>




<td>


{!i.used && !i.revoked && (

<button

className="table-btn"

onClick={()=>revokeInvite(i.token)}

>

Revoke

</button>

)}


</td>



</tr>



))}


</tbody>


</table>


</div>



</section>








<section className="panel">



<div className="panel-head">


<div>


<span className="eyebrow">
Customers
</span>


<h2>
Latest Accounts
</h2>


</div>




<Link

href="/admin/users"

className="btn btn-small"

>

Manage Users

</Link>



</div>







<div className="table-wrap">


<table>



<thead>


<tr>

<th>
User
</th>


<th>
Email
</th>


<th>
Balance
</th>


<th>
Status
</th>


</tr>


</thead>





<tbody>



{users.slice(-8).reverse().map((u:any)=>(



<tr key={u.id}>


<td>


<div className="user-cell">


<span className="avatar">

{u.name?.[0] || "U"}

</span>



<div>

<b>

{u.name}

</b>


</div>



</div>


</td>





<td>

{u.email}

</td>





<td>

${Number(u.balance||0).toFixed(2)}

</td>





<td>


<span className="status active">

{u.status}

</span>


</td>




</tr>



))}



</tbody>


</table>


</div>



</section>







</AdminShell>

);

}