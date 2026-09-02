"use client";

import { useEffect, useState, useCallback } from "react";
import { UserShell } from "../components";
import { apiFetch, useRealtimeStream } from "../lib";
import { ORDER_STATUSES, orderStatusLabel } from "../order-statuses";

export default function OrderStatus() {
  const [orders, setOrders] = useState<any[]>([]);

  const load = useCallback(() => {
    apiFetch("/api/orders", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setOrders((d.orders || []).filter((o: any) => o.status !== "sent")))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeStream(() => {
    load();
  });

  return (
    <UserShell>
      <div className="topbar">
        <div>
          <span className="eyebrow">Order tracking</span>
          <h1>Order Status</h1>
        </div>
      </div>

      {orders.length === 0 ? (
        <section className="panel empty-state">
          Grabbed orders will appear here as Pending.
        </section>
      ) : (
        <div className="status-list">
          {orders.map(o => {
            const current = ORDER_STATUSES.findIndex(s => s.value === o.status);
            return (
              <article className="status-card" key={o.id}>
                <img src={o.image} alt={o.productName} />
                <div className="status-main">
                  <div className="status-head">
                    <span className={`status ${o.status}`}>
                      {orderStatusLabel(o.status)}
                    </span>
                    <small>Order ID {o.id.slice(0, 8).toUpperCase()}</small>
                  </div>
                  <h2>{o.productName}</h2>
                  <div className="amount-row">
                    <span>Order Amount</span>
                    <b>${Number(o.orderAmount || 0).toFixed(2)}</b>
                  </div>
                  <div className="amount-row">
                    <span>Commission</span>
                    <b>${Number(o.commission || 0).toFixed(2)}</b>
                  </div>
                  <div className="amount-row total">
                    <span>Total Amount</span>
                    <b>${Number(o.totalAmount || 0).toFixed(2)}</b>
                  </div>
                  <div className="status-timeline">
                    {ORDER_STATUSES.map((s, i) => (
                      <div
                        key={s.value}
                        className={`timeline-step ${i <= current ? "done" : ""}`}
                      >
                        <span>{i + 1}</span>
                        <small>{s.label}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </UserShell>
  );
}
