"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiMe, clearSession } from "../lib";

export default function KycPending(){

  const router = useRouter();
  const [shopName,setShopName] = useState("");
  const [kycStatus,setKycStatus] = useState("Pending");

  useEffect(()=>{

    let stopped = false;

    const check = () => {
      apiMe()
      .then((d:any)=>{
        if(stopped) return;
        setShopName(d.user.shopName || "");
        setKycStatus(d.user.kycStatus || "Pending");
      })
      .catch(()=>{
        if(stopped) return;
        clearSession();
        router.replace("/login");
      });
    };

    check();
    const timer = setInterval(check, 5000);

    return ()=>{
      stopped = true;
      clearInterval(timer);
    };

  },[router]);


  const approved = kycStatus === "Approved";
  const rejected = kycStatus === "Rejected";

  const tone = approved
    ? {
        icon: "linear-gradient(135deg,#22c55e,#15803d)",
        badgeBg: "rgba(34,197,94,.15)",
        badgeColor: "#4ade80",
        badgeBorder: "1px solid rgba(34,197,94,.4)"
      }
    : rejected
      ? {
          icon: "linear-gradient(135deg,#ef4444,#991b1b)",
          badgeBg: "rgba(239,68,68,.15)",
          badgeColor: "#f87171",
          badgeBorder: "1px solid rgba(239,68,68,.4)"
        }
      : {
          icon: "linear-gradient(135deg,#facc15,#d97706)",
          badgeBg: "rgba(250,204,21,.15)",
          badgeColor: "#facc15",
          badgeBorder: "1px solid rgba(250,204,21,.45)"
        };


  return (

    <main className="kyc-pending-page">


      <section className="kyc-pending-card">


        <div
          className="kyc-status-icon"
          style={{ background: tone.icon }}
        >
          {approved ? "✓" : rejected ? "✕" : "!"}
        </div>


        <div
          className="verify-badge"
          style={{
            background: tone.badgeBg,
            color: tone.badgeColor,
            border: tone.badgeBorder
          }}
        >
          {approved ? "KYC APPROVED" : rejected ? "KYC REJECTED" : "KYC PENDING"}
        </div>


        <h1>
          Seller Application
          <span>
            {approved ? "Approved" : rejected ? "Rejected" : "Under Review"}
          </span>
        </h1>


        <p className="kyc-text">
          {approved
            ? "Congratulations! Your KYC has been approved and your seller account is now active. Continue to login to start using your account."
            : rejected
              ? "Your KYC application was not approved. Please contact support for more information."
              : "Your seller application has been submitted successfully. Our team will review your KYC documents before activating your seller account."}
        </p>


        {shopName && (

          <div className="shop-box">

            <small>
              SHOP NAME
            </small>

            <strong>
              {shopName}
            </strong>

          </div>

        )}



        <div className="kyc-info">

          <div>
            <span>Status</span>
            <b>{approved ? "KYC Approved" : rejected ? "KYC Rejected" : "KYC Pending"}</b>
          </div>


          <div>
            <span>Access</span>
            <b>{approved ? "Account Active" : rejected ? "Access Denied" : "Waiting for Admin Review"}</b>
          </div>

        </div>



        <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginTop:"22px" }}>

          {approved && (

            <button
              onClick={()=>{
                clearSession();
                router.replace("/login");
              }}
              className="btn full"
            >
              Continue to Login
            </button>

          )}


          <button
            onClick={()=>router.push("/")}
            className="btn btn-ghost full"
            style={{ border:"1px solid rgba(255,255,255,.28)" }}
          >
            Back to Home
          </button>


          <button
            onClick={()=>{
              clearSession();
              router.replace("/login");
            }}
            className="btn btn-danger full"
            style={{ background:"linear-gradient(135deg,#ef4444,#b91c1c)", boxShadow:"0 12px 28px rgba(239,68,68,.22)" }}
          >
            Logout
          </button>

        </div>


      </section>


    </main>

  );
}
