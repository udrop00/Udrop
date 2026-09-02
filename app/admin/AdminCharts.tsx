"use client";

export default function AdminCharts({
  stats
}:{
  stats:any
}){


const orderData=[

{
title:"Pending Orders",
value:Number(stats.pendingOrders||0),
className:"chart-yellow"
},

{
title:"On The Way",
value:Number(stats.onWayOrders||0),
className:"chart-blue"
},

{
title:"Delivered",
value:Number(stats.deliveredOrders||0),
className:"chart-purple"
},

{
title:"Completed",
value:Number(stats.completedOrders||0),
className:"chart-green"
}

];



const inventory=[

{
title:"Active Products",
value:Number(stats.activeProducts||0)
},

{
title:"Low Stock",
value:Number(stats.lowStockProducts||0)
},

{
title:"Out Of Stock",
value:Number(stats.outOfStockProducts||0)
}

];



const orderTotal=Math.max(
...orderData.map(x=>x.value),
1
);



const inventoryTotal=Math.max(
...inventory.map(x=>x.value),
1
);



return (

<>



<section className="panel">


<div className="panel-head">

<div>

<span className="eyebrow">
Analytics
</span>


<h2>
Order Performance
</h2>


</div>


</div>





<div className="analytics-grid">


{orderData.map(item=>(


<div
className="analytics-card"
key={item.title}
>


<div className="analytics-title">

<span>
{item.title}
</span>


<strong>
{item.value}
</strong>


</div>



<div className="progress-track">


<div

className={`progress-fill ${item.className}`}

style={{

width:`${(item.value/orderTotal)*100}%`

}}

></div>


</div>



</div>


))}



</div>



</section>







<section className="panel">


<div className="panel-head">


<div>

<span className="eyebrow">
Inventory
</span>


<h2>
Product Health
</h2>


</div>


</div>





<div className="inventory-grid">



{inventory.map(item=>(


<div
className="inventory-card"
key={item.title}
>


<span>
{item.title}
</span>


<strong>
{item.value}
</strong>



<div className="mini-progress">


<div

style={{

width:`${(item.value/inventoryTotal)*100}%`

}}

></div>


</div>



</div>


))}


</div>



</section>
<section className="panel">


<div className="panel-head">


<div>

<span className="eyebrow">
Business
</span>


<h2>
Revenue Analytics
</h2>


</div>


</div>





<div className="revenue-grid">



<div className="revenue-card">


<span>
Total Sales
</span>


<strong>
${Number(stats.totalSales||0).toFixed(2)}
</strong>


<small>
Completed order revenue
</small>


</div>





<div className="revenue-card">


<span>
Total Commission
</span>


<strong>
${Number(stats.totalCommission||0).toFixed(2)}
</strong>


<small>
Business earnings
</small>


</div>





<div className="revenue-card">


<span>
Average Order Value
</span>


<strong>

$

{
Number(stats.completedOrders||0)>0

?

(
Number(stats.totalSales||0) /
Number(stats.completedOrders||0)
).toFixed(2)

:

"0.00"

}

</strong>


<small>
Per completed order
</small>


</div>





<div className="revenue-card">


<span>
Completion Rate
</span>


<strong>

{

Number(stats.totalOrders||0)>0

?

(
Number(stats.completedOrders||0) /
Number(stats.totalOrders||0)
*100
).toFixed(1)

:

"0"

}%

</strong>


<small>
Order success ratio
</small>


</div>



</div>



</section>




</>

);

}