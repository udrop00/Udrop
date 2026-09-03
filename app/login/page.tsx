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

  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail("");
    setPassword("");
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
        }),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Unable to sign in");
      }

      saveSession(
        data.user.role,
        data.user,
        data.token
      );

     if(data.user.role === "admin"){

  router.push("/admin");

}
else{

  if(data.user.kycStatus !== "Approved"){

    router.push("/kyc-pending");

  }
  else{

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

        <div className="auth-icon" style={{ background: "transparent", width: "auto", height: "auto", display: "flex", alignItems: "center", marginBottom: "20px", boxShadow: "none" }}>
          <img src="/dropzone-logo.png" alt="Ubuy" style={{ height: "55px", width: "auto", objectFit: "contain" }} />
        </div>


        <h1>
          Welcome back
        </h1>


        <p>
          Sign in to your Ubuy workspace.
        </p>



        <form className="auth-form" onSubmit={submit} autoComplete="off">


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}



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
              display:"flex",
              gap:"8px"
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
                  flex:1
                }}
              />


              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                style={{
                  padding:"0 15px",
                  cursor:"pointer",
                  borderRadius:"6px"
                }}
              >

                {showPassword ? "Hide" : "Show"}

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


        </form>




        <p className="switch">

          New to Ubuy?{" "}

          <Link href="/register">
            Create an account
          </Link>

        </p>



      </section>


    </main>
  );
}