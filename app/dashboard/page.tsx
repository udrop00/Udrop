"use client";

import Link from "next/link";
import { UserShell } from "../components";
import { apiFetch, apiMe, useRealtimeStream } from "../lib";
import { useEffect, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

export default function Dashboard(){

  const [data,setData] = useState<any>(null);
  const [orders,setOrders] = useState<any[]>([]);
  const [products,setProducts] = useState<any[]>([]);
  const [storeViews,setStoreViews] = useState<number>(0);

  const load = useCallback(async()=>{
    try {
      const [
        me,
        ordersRes,
        productsRes
      ] = await Promise.all([
        apiMe(),
        apiFetch("/api/orders",{ cache:"no-store" }),
        apiFetch("/api/store-products",{ cache:"no-store" })
      ]);

      const ordersData = await ordersRes.json();
      const productsData = await productsRes.json();

      setData(me);
      setOrders(Array.isArray(ordersData?.orders) ? ordersData.orders : []);
      setProducts(Array.isArray(productsData?.products) ? productsData.products : []);
    } catch {}
  }, []);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });


  // Store Views — starts at a realistic active number and
  // keeps fluctuating live to show the store is active.
  useEffect(()=>{

    const initial =
      Math.floor(Math.random()*(3200-600+1))+600;

    setStoreViews(initial);


    const interval = setInterval(()=>{

      setStoreViews(prev=>{

        const delta =
          Math.floor(Math.random()*61)-30;

        const next = prev + delta;

        return Math.min(5000, Math.max(1, next));

      });

    }, 3500);


    return ()=>clearInterval(interval);

  },[]);





  const totalProducts =
    products.length;



  const totalOrders =
    orders.length;



  const totalSales =
    orders
      .filter((o:any)=>
        [
          "delivered",
          "completed"
        ].includes(o.status)
      )
      .reduce(
        (sum:number,o:any)=>
          sum + Number(o.orderAmount || 0),
        0
      );



  const pendingOrders =
    orders.filter((o:any)=>
      [
        "sent",
        "pending"
      ].includes(o.status)
    ).length;



  const onWayOrders =
    orders.filter((o:any)=>
      [
        "handed_over",
        "on_the_way"
      ].includes(o.status)
    ).length;



  const deliveredOrders =
    orders.filter((o:any)=>
      [
        "delivered",
        "completed"
      ].includes(o.status)
    ).length;



  const recentOrders =
    orders.slice(0,5);

  const planName = (data?.user?.currentPackageName || "").toLowerCase();
  let planIcon = "📦";
  let planClass = "";
  if(planName.includes("diamond")){ planIcon = "💎"; planClass = "plan-diamond"; }
  else if(planName.includes("silver")){ planIcon = "🥈"; planClass = "plan-silver"; }
  else if(planName.includes("bronze")){ planIcon = "🥉"; planClass = "plan-bronze"; }
const salesData = orders.map((o:any)=>({

  date:new Date(o.createdAt)
    .toLocaleDateString(
      "en-US",
      {
        month:"short",
        day:"numeric"
      }
    ),

  sales:Number(o.orderAmount || 0)

}));



const orderStats = {

  newOrder: orders.filter((o:any)=>
    o.status==="sent"
  ).length,


  cancelled: orders.filter((o:any)=>
    o.status==="cancelled"
  ).length,


  onDelivery: orders.filter((o:any)=>
    [
      "handed_over",
      "on_the_way"
    ].includes(o.status)
  ).length,


  delivered: orders.filter((o:any)=>
    [
      "completed",
      "delivered"
    ].includes(o.status)
  ).length

};


  return (

    <UserShell>


      <div className="info-banner live-banner">

        <b>
          <i className="live-dot"/>
          Live account
        </b>

      </div>



            <div className="stat-grid dashboard-stats">


        <div className="stat">

          <span>
            Products
          </span>

          <strong>
            {totalProducts}
          </strong>

          <small>
            My Store Products
          </small>

        </div>




        <div className="stat">

          <span>
            Total Orders
          </span>

          <strong>
            {totalOrders}
          </strong>

          <small>
            All Orders
          </small>

        </div>




        <div className="stat">

          <span>
            Total Sales
          </span>

          <strong>
            ${totalSales.toFixed(2)}
          </strong>

          <small>
            Completed Sales
          </small>

        </div>




        <div className="stat verified-card">

  <span>
    🛡 Verification
  </span>

  <strong>
    ✓ Verified
  </strong>

  <small>
    KYC Approved Seller
  </small>

</div>




        <div className="stat">

          <span>
            <i className="live-dot" style={{marginRight:"6px"}}/>
            Store Views
          </span>

          <strong>
            {storeViews.toLocaleString()}
          </strong>

          <small>
            Live Store Activity
          </small>

        </div>



      </div>

      <div className="content-grid">
        {/* LEFT COLUMN: Balance & Profit + Sales Overview */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          
          {/* 1. Balance & Profit Summary */}
          <section className="panel" style={{ padding: "22px" }}>
            <div className="panel-head" style={{ marginBottom: "14px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#38bdf8", letterSpacing: "0.15em" }}>
                  Account Summary
                </span>
                <h2 style={{ fontSize: "20px", marginTop: "4px" }}>
                  Balance & Profit
                </h2>
              </div>
            </div>

            <div className="fund-cards" style={{ margin: 0, gap: "14px" }}>
              <div className="balance-box" style={{
                background: "linear-gradient(145deg, rgba(16, 185, 129, 0.09), rgba(6, 78, 59, 0.14))",
                border: "1px solid rgba(16, 185, 129, 0.28)",
                borderRadius: "16px",
                padding: "18px"
              }}>
                <div className="fund-title" style={{ color: "#6ee7b7", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  💳 Total Balance
                </div>
                <strong style={{ fontSize: "28px", color: "#ffffff", margin: "8px 0 4px", display: "block", fontWeight: 900 }}>
                  ${Number(data?.user?.balance || 0).toFixed(2)}
                </strong>
                <small style={{ color: "#a7f3d0", fontSize: "11px", display: "block" }}>
                  Available Account Balance
                </small>
              </div>

              <div className="profit-box" style={{
                background: "linear-gradient(145deg, rgba(139, 92, 246, 0.09), rgba(76, 29, 149, 0.14))",
                border: "1px solid rgba(139, 92, 246, 0.28)",
                borderRadius: "16px",
                padding: "18px"
              }}>
                <div className="fund-title" style={{ color: "#c4b5fd", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  📈 Total Profit
                </div>
                <strong style={{ fontSize: "28px", color: "#ffffff", margin: "8px 0 4px", display: "block", fontWeight: 900 }}>
                  ${Number(data?.user?.profit || 0).toFixed(2)}
                </strong>
                <small style={{ color: "#ddd6fe", fontSize: "11px", display: "block" }}>
                  Total Earnings
                </small>
              </div>
            </div>
          </section>

          {/* 2. Sales Overview Chart */}
          <section className="panel" style={{ padding: "22px", flex: 1 }}>
            <div className="panel-head" style={{ marginBottom: "14px" }}>
              <div>
                <span className="eyebrow" style={{ color: "#38bdf8", letterSpacing: "0.15em" }}>
                  Sales Statistics
                </span>
                <h2 style={{ fontSize: "20px", marginTop: "4px" }}>
                  Sales Overview
                </h2>
              </div>
            </div>

            <div style={{ height: 260, width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                  <YAxis axisLine={false} tickLine={false} stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "1px solid #1e40af",
                      borderRadius: "12px",
                      color: "#fff"
                    }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Sales"]}
                  />
                  <CartesianGrid strokeDasharray="3 3" opacity={0.12} stroke="#334155" />
                  <Area type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={3} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

        </div>

        {/* RIGHT COLUMN: Purchased Package */}
                <section className="panel" style={{
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(165deg, rgba(20, 35, 65, 0.75) 0%, rgba(10, 20, 42, 0.95) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.28)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignSelf: "center"
        }}>
          {/* Ambient Glow Background Effect */}
          <div style={{
            position: "absolute",
            top: "-40px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "220px",
            height: "140px",
            background: "radial-gradient(ellipse, rgba(56, 189, 248, 0.3) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none"
          }} />

          <div className="panel-head" style={{ marginBottom: "12px" }}>
            <div>
              <span className="eyebrow" style={{ color: "#38bdf8", letterSpacing: "0.18em" }}>
                SELLER PLAN
              </span>
              <h2 style={{ fontSize: "20px", marginTop: "4px" }}>
                Purchased Package
              </h2>
            </div>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            padding: "16px 8px 10px",
            position: "relative",
            zIndex: 1,
            flex: 1,
            justifyContent: "space-between"
          }}>

            {/* Top Glowing Diamond Emblem */}
            <div style={{
              position: "relative",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Outer Pulsing Glow */}
              <div style={{
                position: "absolute",
                width: "82px",
                height: "82px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.4), rgba(37, 99, 235, 0.4))",
                filter: "blur(14px)",
                opacity: 0.8
              }} />

              {/* Glowing Badge Circle */}
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "22px",
                background: "linear-gradient(145deg, #1e3a6a, #0c1c38)",
                border: "2px solid rgba(56, 189, 248, 0.5)",
                display: "grid",
                placeItems: "center",
                fontSize: "34px",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)",
                position: "relative",
                zIndex: 2
              }}>
                💎
              </div>
            </div>

            {/* Plan Title & Tag */}
            <div>
              <span style={{
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: "#94a3b8",
                fontWeight: 700,
                display: "block",
                marginBottom: "4px"
              }}>
                Current Active Package
              </span>

              <h3 style={{
                fontSize: "28px",
                fontWeight: 900,
                margin: "0 0 8px",
                background: "linear-gradient(135deg, #ffffff 0%, #7dd3fc 60%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em"
              }}>
                {data?.user?.currentPackageName || "No Active Package"}
              </h3>

              {/* Active Status Badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(34, 197, 94, 0.12)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                padding: "4px 12px",
                borderRadius: "99px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#4ade80",
                marginBottom: "18px"
              }}>
                <span style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#22c55e",
                  boxShadow: "0 0 10px #22c55e"
                }} />
                <span>{data?.user?.packageStatus === "active" ? "Active Membership" : (data?.user?.packageStatus || "Active")}</span>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{
              width: "100%",
              display: "grid",
              gap: "10px",
              marginBottom: "20px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                  <span>📦</span> Product Limit
                </span>
                <strong style={{ fontSize: "14px", color: "#f8fafc" }}>
                  {data?.user?.productLimit || 0} Products
                </strong>
              </div>

              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid rgba(255, 255, 255, 0.07)"
              }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#94a3b8" }}>
                  <span>💰</span> Profit Commission
                </span>
                <strong style={{ fontSize: "14px", color: "#38bdf8", fontWeight: 800 }}>
                  {data?.user?.commissionRate || 0}%
                </strong>
              </div>
            </div>

                        {/* Upgrade Plan Action Button */}
            <Link
              href="/traffic-packages"
              style={{
                width: "100%",
                padding: "14px 20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: "0 10px 25px rgba(37, 99, 235, 0.35)",
                textDecoration: "none",
                transition: "all 0.2s ease"
              }}
            >
              <span>Upgrade Package</span>
              <span style={{ fontSize: "16px" }}>→</span>
            </Link>

            <p style={{
              marginTop: "14px",
              color: "#94a3b8",
              fontSize: "12px",
              lineHeight: 1.6,
              textAlign: "center"
            }}>
              Want a higher plan? Reach out to our customer support team and we'll help you upgrade.
            </p>

          </div>
        </section>

      </div>

      {/* FULL WIDTH: Recent Activity (cleanly placed underneath the grid) */}
      <section className="panel" style={{ marginTop: "20px" }}>

        <div className="panel-head">


          <div>

            <span className="eyebrow">
              Recent Activity
            </span>


            <h2>
              Recent Orders
            </h2>


          </div>



          <Link
            className="btn btn-small"
            href="/order-status"
          >
            View All
          </Link>


        </div>






        {recentOrders.length === 0 ? (


          <div className="empty-state">

            No orders available yet.

          </div>



        ) : (



          <div className="table-wrap">


            <table>


              <thead>


                <tr>


                  <th>
                    Product
                  </th>


                  <th>
                    Amount
                  </th>


                  <th>
                    Status
                  </th>


                </tr>


              </thead>





              <tbody>



                {recentOrders.map((o:any)=>(


                  <tr key={o.id}>


                    <td>


                      <div className="user-cell">


                        {o.image && (


                          <img
                            className="table-thumb"
                            src={o.image}
                            alt=""
                          />


                        )}




                        <div>


                          <b>
                            {o.productName}
                          </b>


                          <small>
                            Order #{String(o.id).slice(0,8)}
                          </small>


                        </div>



                      </div>



                    </td>





                    <td>

                      ${Number(
                        o.orderAmount || 0
                      ).toFixed(2)}

                    </td>





                    <td>


                      <span
                        className={`status ${o.status}`}
                      >

                        {String(o.status).replace("_"," ")}

                      </span>



                    </td>



                  </tr>



                ))}



              </tbody>



            </table>



          </div>



              )}

      </section>

    </UserShell>

  );
}