"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./components";

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
        <Logo />
        <div className="nav-links">
          <Link href="/login">Login</Link>
          <Link className="btn btn-small" href="/register">Get Started</Link>
        </div>
      </nav>

      <section className="hero container">
        <div className="hero-copy">
          <div className="eyebrow"><span className="dot" /> Dropshipping workspace</div>
          <h1>
            <span style={{ color: "#ffffff", fontWeight: 900 }}>U</span>
            <span style={{ color: "#fbbf24", fontWeight: 900, textShadow: "0 0 20px rgba(251, 191, 36, 0.6)" }}>drop</span> Platform.<br />
            <span>We handle it all.</span>
          </h1>
          <p>One clean workspace for your seller account, orders, balance, support and customer communication.</p>
          <div className="hero-actions">
            <Link className="btn" href="/register">Create Account</Link>
            <Link className="btn btn-ghost" href="/login">Sign In</Link>
          </div>
          <div className="trust-row">
            <span>✓ Seller accounts</span>
            <span>✓ Admin controls</span>
            <span>✓ 24/7 Support</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="glow" />
          <div className="mock-top">
            <span style={{ fontWeight: 800 }}>
              <span style={{ color: "#ffffff" }}>U</span>
              <span style={{ color: "#fbbf24" }}>drop</span> Platform
            </span>
            <span className="status-pill">● Live workspace</span>
          </div>
          <div className="mock-stat-grid">
            <div>
              <small>Active sellers</small>
              <strong>{activeUsers.toLocaleString()}</strong>
              <em>Live activity</em>
            </div>
            <div>
              <small>Open chats</small>
              <strong>{openChats}</strong>
              <em>Live support</em>
            </div>
          </div>
          <div className="mock-chart">
            <div className="chart-line" />
            <div className="chart-bars">
              <i /><i /><i /><i /><i /><i /><i />
            </div>
          </div>
          <div className="mock-message">
            <span className="avatar">U</span>
            <div>
              <b>Udrop Support</b>
              <p>Need help with your seller account?</p>
            </div>
            <span className="unread">1</span>
          </div>
        </div>
      </section>

      <section className="features container">
        <div className="section-head">
          <span className="eyebrow">Everything in one place</span>
          <h2>Simple tools. Clear account control.</h2>
          <p>Manage your store, products, orders, profit and balance from one streamlined Udrop workspace.</p>
        </div>
        <div className="feature-grid">
          <article>
            <span>01</span>
            <h3>Seller Accounts</h3>
            <p>Secure login, customized shop profile and store dashboard for every seller.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Store & Orders</h3>
            <p>Add products, pick up orders, earn commissions and track delivery status in real time.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Dedicated Support</h3>
            <p>Stay connected with real-time support and instant luxury notifications.</p>
          </article>
        </div>
      </section>

      <section className="cta container">
        <div>
          <span className="eyebrow">Stay connected</span>
          <h2>Get Udrop updates.</h2>
        </div>
        {sent ? (
          <div className="success-box">✓ You’re on the update list.</div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); if (email.trim()) setSent(true); }}>
            <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <button className="btn" type="submit">Notify me</button>
          </form>
        )}
      </section>

      <footer className="footer container">
        <Logo />
        <span>Udrop workspace © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
