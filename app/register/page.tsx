"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "../lib";
import { Logo } from "../components";
import { countryCodes, getCountry } from "../countries";

export default function Register() {
  const router = useRouter();

  const [invite, setInvite] = useState("");
  const [inviteState, setInviteState] = useState<"checking" | "valid" | "invalid">("invalid");
  const [inviteError, setInviteError] = useState("");

  const [name, setName] = useState("");
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [country, setCountry] = useState("United States");

  const [pw, setPw] = useState("");
  const [transactionPassword, setTransactionPassword] = useState("");
  const [confirmTransactionPassword, setConfirmTransactionPassword] = useState("");
const [certificateType,setCertificateType] = useState("ID Card");
const [certificateFront,setCertificateFront] = useState("");
const [certificateBack,setCertificateBack] = useState("");
const [selfie,setSelfie] = useState("");
const uploadFile = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: (value:string)=>void
) => {

  const file = e.target.files?.[0];

  if(!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setter(String(reader.result));
  };

  reader.readAsDataURL(file);

};
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selected = getCountry(country);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("invite") || "";

    setInvite(token);

    if (!token) {
      setInviteState("invalid");
      return;
    }

    setInviteState("checking");

    fetch(`/api/invites/${encodeURIComponent(token)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const d = await r.json();

        if (!r.ok || !d.valid) {
          throw new Error(d.error || "Invalid invitation");
        }

        setInviteState("valid");
      })
      .catch((e) => {
        setInviteState("invalid");
        setInviteError(e.message);
      });

  }, []);

  const changeCountry = (value: string) => {
const uploadFile = (
  e: React.ChangeEvent<HTMLInputElement>,
  setter: any
) => {

  const file = e.target.files?.[0];

  if(!file) return;


  const reader = new FileReader();


  reader.onload = () => {

    setter(
      String(reader.result || "")
    );

  };


  reader.readAsDataURL(file);

};
    const x = getCountry(value);

    setCountry(value);
    setCountryCode(x?.code || "+1");
    setPhone("");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();

    setError("");

    if (transactionPassword.length !== 6 || !/^\d+$/.test(transactionPassword)) {
      setError("Transaction password must be exactly 6 digits.");
      return;
    }

    if (transactionPassword !== confirmTransactionPassword) {
      setError("Transaction passwords do not match.");
      return;
    }

    setLoading(true);

    try {

      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  name,
  shopName,
  email,
  phone,
  countryCode,
  country,
  password: pw,
  transactionPassword,
  remember,
  inviteToken: invite,

  certificateType,
  certificateFront,
  certificateBack,
  selfie
}),
      });

      const data = await r.json();

      if (!r.ok) {
        throw new Error(data.error || "Unable to create account");
      }

     saveSession(data.user.role, data.user, data.token);

router.push("/kyc-pending");

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create account");

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

        <div className="auth-icon">+</div>

        <h1>Create account</h1>

        <p>
          Start your private Drop Zone workspace.
        </p>


        {inviteState !== "valid" && (
          <div className="form-error">

            {invite
              ? inviteState === "checking"
                ? "Checking invitation…"
                : inviteError || "This invitation is not valid."
              : "An invitation link is required to create an account."
            }

          </div>
        )}


        {inviteState === "valid" && (
          <div className="info-banner">
            Invitation accepted
          </div>
        )}



        <form className="auth-form" onSubmit={submit}>


          {error && (
            <div className="form-error">
              {error}
            </div>
          )}



          <label>
            Full name

            <input
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder="Your name"
              required
            />

          </label>



          <label>
            Shop Name

            <input
              value={shopName}
              onChange={(e)=>setShopName(e.target.value)}
              placeholder="Your shop name"
              required
            />

          </label>



          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(e)=>setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

          </label>



          <label>
            Country

            <select
              value={country}
              onChange={(e)=>changeCountry(e.target.value)}
            >

              {countryCodes.map(c=>(
                <option key={c.country}>
                  {c.country}
                </option>
              ))}

            </select>

          </label>




          <label>
            Phone number


            <div style={{display:"flex",gap:8}}>

              <select
                disabled
                style={{width:110}}
              >

                <option>
                  {countryCode}
                </option>

              </select>



              <input
                value={phone}
                inputMode="numeric"
                maxLength={selected?.digits || 10}
                onChange={(e)=>
                  setPhone(
                    e.target.value
                    .replace(/\D/g,"")
                    .slice(0,selected?.digits || 10)
                  )
                }
                placeholder="Phone number"
                required
              />


            </div>

          </label>





          <label>
            Password

            <input
              type="password"
              value={pw}
              onChange={(e)=>setPw(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />

          </label>





          <label>
            Transaction Password (6 Digit)


            <input
              type="password"
              value={transactionPassword}
              maxLength={6}
              inputMode="numeric"
              onChange={(e)=>
                setTransactionPassword(
                  e.target.value.replace(/\D/g,"")
                )
              }
              placeholder="Enter 6 digit PIN"
              required
            />


          </label>





          <label>
            Confirm Transaction Password


            <input
              type="password"
              value={confirmTransactionPassword}
              maxLength={6}
              inputMode="numeric"
              onChange={(e)=>
                setConfirmTransactionPassword(
                  e.target.value.replace(/\D/g,"")
                )
              }
              placeholder="Confirm 6 digit PIN"
              required
            />


          </label>



<label>
  Certificate Type

  <select
    value={certificateType}
    onChange={(e)=>setCertificateType(e.target.value)}
  >
    <option>ID Card</option>
    <option>Passport</option>
    <option>Driving License</option>
    <option>Social Security Card</option>
  </select>

</label>


<label>
  Certificate Front *

  <input
    type="file"
    accept="image/*"
    onChange={(e)=>uploadFile(e,setCertificateFront)}
    required
  />

</label>


<label>
  Certificate Back *

  <input
    type="file"
    accept="image/*"
    onChange={(e)=>uploadFile(e,setCertificateBack)}
    required
  />

</label>


<label>
  Selfie Verification *

  <input
    type="file"
    accept="image/*"
    onChange={(e)=>uploadFile(e,setSelfie)}
    required
  />

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
            disabled={loading || inviteState !== "valid"}
            type="submit"
          >

            {loading ? "Creating…" : "Create account"}

          </button>




        </form>





        <p className="switch">

          Already have an account?

          {" "}

          <Link href="/login">
            Sign in
          </Link>

        </p>



      </section>


    </main>
  );
}