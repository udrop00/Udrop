"use client";

import {useEffect,useState,useCallback} from "react";
import {AdminShell} from "../../components";
import {apiFetch,useRealtimeStream} from "../../lib";
import {orderStatusLabel} from "../../order-statuses";


export default function AdminOrders(){


const [users,setUsers]=useState<any[]>([]);
const [orders,setOrders]=useState<any[]>([]);
const [products,setProducts]=useState<any[]>([]);


const [selectedUser,setSelectedUser]=useState("");
const [selectedProduct,setSelectedProduct]=useState("");
const [customerSearch,setCustomerSearch]=useState("");

const [amount,setAmount]=useState("");

const [adjust,setAdjust]=useState("");
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
  apiFetch("/api/products")
    .then(r=>r.json())
    .then(d=>setProducts(d.products||[]))
    .catch(()=>{});
},[load]);

useRealtimeStream(()=>{
  load();
});






const pickProduct=(id:string)=>{


setSelectedProduct(id);


const p=products.find(
x=>String(x.id)===id
);


setAmount(
p ? String(p.price) : ""
);


};







const send=async()=>{


setMessage("");



const r=await apiFetch(
"/api/admin/orders",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({

customerId:selectedUser,

productId:Number(selectedProduct)

})

}
);



const d=await r.json();



if(!r.ok){

setMessage(
d.error || "Could not create order"
);


return;

}



setMessage(
"Order sent successfully."
);


load();


};








const updateStatus=async(
id:string,
status:string
)=>{


setMessage("");



const r=await apiFetch(

`/api/admin/orders/${id}`,

{

method:"PATCH",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
status
})

}

);



const d=await r.json();



if(!r.ok){

setMessage(
d.error || "Could not update order"
);


return;

}



setMessage(
`Order status changed to ${orderStatusLabel(status)}`
);



load();


};







const balanceAdjust=async(
mode:"add"|"deduct"
)=>{


if(!selectedUser||!adjust||adjusting)
return;

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
  headers:{
  "Content-Type":"application/json"
  },
  body:JSON.stringify({
  userId:selectedUser,
  amount:num,
  mode
  })
  }
  );

  const d=await r.json();

  if (r.ok && d.user) {
    setMessage(`Balance updated $${Number(d.user.balance).toFixed(2)}`);
    setUsers(prev => prev.map(u => u.id === selectedUser ? { ...u, balance: d.user.balance } : u));
  } else {
    setMessage(d.error || "Balance update failed");
  }
} catch {
  setMessage("Balance update failed");
} finally {
  setAdjusting(false);
}

};







const chosen=users.find(
u=>u.id===selectedUser
);





const nextStatus=(status:string)=>{


if(status==="pending")
return "handed_over";


if(status==="handed_over")
return "on_the_way";


if(status==="on_the_way")
return "delivered";


if(status==="delivered")
return "completed";


return "";

};





return (

<AdminShell>


<div className="topbar">


<div>

<span className="eyebrow">
Order Management
</span>


<h1>
Orders & Customer Funds
</h1>


</div>



<span className="admin-chip live-chip">

<i/>

10-15% Commission

</span>


</div>



{message&&

<div className="info-banner">

{message}

</div>

}
<section className="admin-order-grid">


<section className="panel">


<div className="panel-head">

<div>

<span className="eyebrow">
Create Order
</span>


<h2>
Send Order To Customer
</h2>


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
    ? (
        users.find(
          u=>u.id===selectedUser
        )?.email || ""
      )
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
  (
    u.email || ""
  )
  .toLowerCase()
  .includes(
    customerSearch.toLowerCase()
  )
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
  Shop: {chosen?.shopName || "N/A"}
</small>

)}



<label>

Product


<select

value={selectedProduct}

onChange={
e=>pickProduct(e.target.value)
}

>


<option value="">
Select product
</option>



{products.map(p=>(

<option
key={p.id}
value={p.id}
>

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

<p>
{
  chosen?.currentPackage || "No Active Plan"
}
</p>

<p>
Commission:
{" "}
{
  chosen?.commissionRate || 0
}%
</p>

</div>

</label>


</div>







<div className="formula-box">

  Order Amount

  <b>
    ${Number(amount || 0).toFixed(2)}
  </b>


  {" + Commission "}


  <b>
    ${
      (
        Number(amount || 0) *
        Number(chosen?.commissionRate || 0)
        /
        100
      ).toFixed(2)
    }
  </b>


  {" = Total "}


  <b>
    ${
      (
        Number(amount || 0) *
        (
          1 + Number(chosen?.commissionRate || 0) / 100
        )
      ).toFixed(2)
    }
  </b>


</div>






<button

className="btn"

disabled={
!selectedUser ||
!selectedProduct
}

onClick={send}

>

Send Order

</button>




</section>



<section className="panel">

<div className="panel-head">
<div>
<span className="eyebrow">Funds</span>
<h2>Total Balance & Total Profit</h2>
</div>
</div>

<div className="fund-cards">

<div className="balance-box">
<div className="fund-title">Total Balance</div>
<strong>${Number(chosen?.balance || 0).toFixed(2)}</strong>
</div>

<div className="profit-box">
<div className="fund-title">Total Profit</div>
<strong>${Number(chosen?.profit || 0).toFixed(2)}</strong>
</div>

</div>

<label>
Amount
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
Add/Deduct changes Total Balance. Grabbed orders deduct the Order Amount. Completed orders return the Order Amount + Commission to Total Balance and add the Commission to Total Profit.
</small>

</section>



</section><section className="panel">


<div className="panel-head">

<div>

<span className="eyebrow">
Order Queue
</span>


<h2>
All Orders
</h2>


</div>


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


<th>
Next Step
</th>


</tr>


</thead>






<tbody>



{

orders.map(o=>{


const next=nextStatus(o.status);



return (

<tr key={o.id}>


<td>


<div className="order-product-cell">


<img

className="table-thumb"

src={o.image}

alt={o.productName}

/>



<div>

<b>

{o.productName}

</b>


<small>

#{o.id.slice(0,8).toUpperCase()}

</small>


</div>



</div>



</td>







<td>


{

users.find(
u=>u.id===o.customerId
)?.name || "Customer"

}



</td>






<td>


<strong>

${Number(o.orderAmount||0).toFixed(2)}

</strong>


</td>






<td>


${Number(o.commission||0).toFixed(2)}

<br/>


<small>

{o.commissionPercent}%

</small>


</td>







<td>


<span

className={`status order-status ${o.status}`}

>

{orderStatusLabel(o.status)}

</span>


</td>








<td>



{

next

?

<div className="status-action">


<select

value={next}

onChange={
e=>updateStatus(
o.id,
e.target.value
)
}

>


<option value={next}>

{orderStatusLabel(next)}

</option>


</select>





<button

className="table-btn"

onClick={
()=>updateStatus(
o.id,
next
)
}

>

Update

</button>



</div>


:


<span className="hint">

Completed

</span>


}



</td>






</tr>

)

})


}



</tbody>



</table>


</div>



</section>





</AdminShell>

);

}