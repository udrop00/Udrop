"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [activeUsers, setActiveUsers] = useState(12500);
  const [openChats, setOpenChats] = useState(40);

  useEffect(() => {
    const randomBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;
    setActiveUsers(randomBetween(10000, 15000));
    setOpenChats(randomBetween(20, 80));
  }, []);

  return (
    <main className="landing">
      <nav className="nav container">
        <div className="brand"><span className="brand-mark">D</span><span>DROP <b>ZONE</b></span></div>
        <div className="nav-links"><Link href="/login">Login</Link><Link className="btn btn-small" href="/register">Get Started</Link></div>
      </nav>

      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="dot" /> Dropshipping workspace</div>
          <h1>Drop it.<br /><span>We handle it.</span></h1>
          <p>One clean workspace for your account, orders, balance, support and customer communication.</p>
          <div className="hero-actions"><Link className="btn" href="/register">Create Account</Link><Link className="btn btn-ghost" href="/dashboard">View Dashboard</Link></div>
          <div className="trust-row"><span>✓ User accounts</span><span>✓ Admin controls</span><span>✓ Support chat</span></div>
        </div>
        <div className="hero-card">
          <div className="glow" />
          <div className="mock-top"><span>Drop Zone</span><span className="status-pill">● Live workspace</span></div>
          <div className="mock-stat-grid"><div><small>Active users</small><strong>{activeUsers.toLocaleString()}</strong><em>Live activity</em></div><div><small>Open chats</small><strong>{openChats}</strong><em>Live support</em></div></div>
          <div className="mock-chart"><div className="chart-line" /><div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
          <div className="mock-message"><span className="avatar">C</span><div><b>Customer Support</b><p>Need help with your account?</p></div><span className="unread">1</span></div>
        </div>
      </section>

      <section className="features container">
        <div className="section-head"><span className="eyebrow">Everything in one place</span><h2>Simple tools. Clear account control.</h2><p>Manage your account, orders, customer support and balance from one streamlined Drop Zone workspace.</p></div>
        <div className="feature-grid"><article><span>01</span><h3>Accounts</h3><p>Secure login, profile and dashboard access for every customer.</p></article><article><span>02</span><h3>Orders</h3><p>Track products, order amounts, commissions and delivery progress.</p></article><article><span>03</span><h3>Support</h3><p>Stay connected with customer support through live conversations.</p></article></div>
      </section>

      <section className="cta container">
        <div><span className="eyebrow">Stay connected</span><h2>Get Drop Zone updates.</h2></div>
        {sent ? <div className="success-box">✓ You’re on the update list.</div> : <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSent(true); }}><input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /><button className="btn" type="submit">Notify me</button></form>}
      </section>

      <footer className="footer container"><div className="brand"><span className="brand-mark">D</span><span>DROP <b>ZONE</b></span></div><span>Drop Zone workspace</span></footer>
    </main>
  );
}
