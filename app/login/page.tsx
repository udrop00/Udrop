"use client";

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "../lib";
import { Logo } from "../components";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
    setTwoFactorCode("");
    setTwoFactorRequired(false);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          remember,
          twoFactorCode: twoFactorRequired ? twoFactorCode.trim() : undefined,
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Unable to sign in");
      }

      if (data.requireTwoFactor) {
        setTwoFactorRequired(true);
        setError("");
        setLoading(false);
        return;
      }

      saveSession(
        data.user.role,
        data.user,
        data.token
      );

      if (data.user.role === "admin") {
        router.push("/admin");
      } else {
        if (data.user.kycStatus !== "Approved") {
          router.push("/kyc-pending");
        } else {
          router.push("/dashboard");
        }
      }

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <main className="auth-page">

      <div className="auth-logo">
        <Logo />
      </div>


      <section className="auth-card">

        <div className="auth-icon" style={{ background: "transparent", width: "auto", height: "auto", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px", boxShadow: "none" }}>
          <span style={{ fontSize: "36px", fontWeight: 900, letterSpacing: "-0.5px" }}>
            <span style={{ color: "#ffffff", fontWeight: 900 }}>U</span>
            <span style={{ color: "#fbbf24", fontWeight: 900, textShadow: "0 0 20px rgba(251, 191, 36, 0.7)" }}>drop</span>
          </span>
        </div>


        <h1>
          Welcome back
        </h1>


        <p>
          Sign in to your Udrop workspace.
        </p>



        <form className="auth-form" onSubmit={submit} autoComplete="off">


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {twoFactorRequired ? (
            <>
              <div style={{ textAlign: "center", marginBottom: "18px" }}>
                <div style={{ fontSize: "36px", marginBottom: "6px" }}>🛡️</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff", margin: 0 }}>Two-Factor Authentication</h3>
                <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
                  Enter the 6-digit code from your Google Authenticator app to access Admin panel.
                </p>
              </div>

              <label>
                Authenticator Code

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoFocus
                  required
                  style={{
                    textAlign: "center",
                    fontSize: "22px",
                    letterSpacing: "6px",
                    fontWeight: 700
                  }}
                />
              </label>

              <button
                className="btn full"
                disabled={loading || twoFactorCode.length !== 6}
                type="submit"
                style={{ marginTop: "10px" }}
              >
                {loading ? "Verifying…" : "Verify & Sign in"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTwoFactorRequired(false);
                  setTwoFactorCode("");
                  setError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "13px",
                  cursor: "pointer",
                  marginTop: "12px",
                  textAlign: "center",
                  width: "100%",
                  padding: "6px"
                }}
              >
                ← Back to login
              </button>
            </>
          ) : (
            <>
              <label>
                Email

                <input
                  type="text"
                  name="user_email_address_field"
                  autoComplete="off"
                  value={email}
                  onChange={(e)=>setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />

              </label>




              <label>
                Password

                <div style={{
                  position:"relative",
                  display:"flex",
                  alignItems:"center"
                }}>

                  <input
                    type={showPassword ? "text" : "password"}
                    name="user_login_secret_field"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e)=>setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{
                      width:"100%",
                      paddingRight:"44px"
                    }}
                  />


                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    title={showPassword ? "Hide password" : "Show password"}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position:"absolute",
                      right:"8px",
                      top:"50%",
                      transform:"translateY(-50%)",
                      background:"transparent",
                      border:"none",
                      color:showPassword ? "#38bdf8" : "#94a3b8",
                      cursor:"pointer",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center",
                      padding:"6px",
                      borderRadius:"6px",
                      transition:"color 0.2s"
                    }}
                  >

                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                        <line x1="2" y1="2" x2="22" y2="22"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}

                  </button>


                </div>

              </label>





              <label className="remember-row">

                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e)=>setRemember(e.target.checked)}
                />

                <span>
                  Remember me
                </span>

              </label>




              <button
                className="btn full"
                disabled={loading}
                type="submit"
              >

                {loading
                  ? "Signing in…"
                  : "Sign in"
                }

              </button>
            </>
          )}


        </form>




        <p className="switch">

          New to Udrop?{" "}

          <Link href="/register">
            Create an account
          </Link>

        </p>



      </section>


    </main>
  );
}