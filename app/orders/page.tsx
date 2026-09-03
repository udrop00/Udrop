"use client";

import { useEffect, useState, useCallback } from "react";
import { UserShell } from "../components";
import { apiFetch, useRealtimeStream } from "../lib";

export default function Orders(){

  const [orders,setOrders] = useState<any[]>([]);
  const [balance,setBalance] = useState(0);
  const [error,setError] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/orders", { cache:"no-store" })
      .then(r => r.json())
      .then(d => {
        setOrders(d.orders || []);
        setBalance(Number(d.balance || 0));
      })
      .catch(()=>{});
  }, []);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });


  const grab = async(id:string)=>{

    setError("");

    const r = await apiFetch(
      "/api/orders",
      {
        method:"POST",

        headers:{
          "Content-Type":
            "application/json"
        },

        body:JSON.stringify({
          orderId:id
        })

      }
    );


    const d = await r.json();


    if(!r.ok){

      setError(
        d.error ||
        "Unable to pick up order"
      );

      return;

    }


    load();

  };


  const pending =
    orders.filter(
      o => o.status === "sent"
    );


  return (

    <UserShell>

      <div className="topbar">

        <div>

          <span className="eyebrow">
            Orders
          </span>

          <h1>
            Available Orders
          </h1>

        </div>


        <span className="balance-chip">
          Total Balance $
          {balance.toFixed(2)}
        </span>

      </div>


      {error && (

        <div className="form-error">
          {error}
        </div>

      )}


      {pending.length === 0 ? (

        <section className="panel empty-state">

          No new orders right now.
          Your admin will send orders here.

        </section>

      ) : (

        <div className="order-grid">

          {pending.map(o => (

            <article
              className="order-card"
              key={o.id}
            >

              <img
                src={o.image}
                alt={o.productName}
              />


              <div className="order-content">

                <span className="status sent">
                  New Order
                </span>


                <h2>
                  {o.productName}
                </h2>


                <div className="amount-row">

                  <span>
                    Order Amount
                  </span>

                  <b>
                    ${Number(
                      o.orderAmount || 0
                    ).toFixed(2)}
                  </b>

                </div>


                <div className="amount-row">

                  <span>
                    Commission ({o.commissionPercent}%)
                  </span>

                  <b>
                    ${Number(
                      o.commission || 0
                    ).toFixed(2)}
                  </b>

                </div>


                <div className="amount-row total">

                  <span>
                    Total Amount
                  </span>

                  <b>
                    ${Number(
                      o.totalAmount || 0
                    ).toFixed(2)}
                  </b>

                </div>


                <div className="order-actions">

                  <button
                    className="btn"
                    onClick={() =>
                      grab(o.id)
                    }
                  >
                    Pick Up Order
                  </button>

                </div>


                <small className="hint">
                  Once you pick up this order,
                  it will move to Pending.
                  Orders cannot be cancelled
                  by the seller.
                </small>

              </div>

            </article>

          ))}

        </div>

      )}

    </UserShell>

  );

}