"use client";

import Link from "next/link";

export default function ForgotPassword() {

  return (

    <main className="auth-page">

      <section className="auth-card">

        <h1>
          Forgot Password
        </h1>

        <p>
          For your account&apos;s security, passwords can no longer be reset
          from this page. Please contact our support team through Live Chat
          and an admin will reset your password for you.
        </p>

        <p className="switch">

          <Link href="/login">
            Back to Login
          </Link>

        </p>

      </section>

    </main>

  );
}
