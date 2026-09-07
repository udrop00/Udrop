"use client";

import Link from "next/link";
import {useEffect,useState,useCallback} from "react";
import {AdminShell} from "../components";
import {apiFetch,useRealtimeStream} from "../lib";
import AdminCharts from "./AdminCharts";


export default function Admin(){


const [users,setUsers]=useState<any[]>([]);
const [orders,setOrders]=useState<any[]>([]);


const [stats,setStats]=useState<any>({

totalUsers:0,
totalProducts:0,
totalOrders:0,

pendingOrders:0,
onWayOrders:0,
deliveredOrders:0,
completedOrders:0,

totalSales:0,
totalCommission:0,

activeProducts:0,
inactiveProducts:0,
lowStockProducts:0,
outOfStockProducts:0

});



const [invites,setInvites]=useState<any[]>([]);
const [inviteUrl,setInviteUrl]=useState("");
const [inviteError,setInviteError]=useState("");
const [inviteLinkCopied,setInviteLinkCopied]=useState(false);

const [currentPassword, setCurrentPassword] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [pwdTwoFactorCode, setPwdTwoFactorCode] = useState("");
const [pwdMessage, setPwdMessage] = useState("");
const [pwdError, setPwdError] = useState("");
const [pwdLoading, setPwdLoading] = useState(false);

// Google Authenticator (2FA) States
const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
const [twoFactorSecret, setTwoFactorSecret] = useState("");
const [twoFactorQR, setTwoFactorQR] = useState("");
const [twoFactorCode, setTwoFactorCode] = useState("");
const [twoFactorLoading, setTwoFactorLoading] = useState(false);
const [twoFactorMessage, setTwoFactorMessage] = useState("");
const [twoFactorError, setTwoFactorError] = useState("");
const [showSetup2FA, setShowSetup2FA] = useState(false);
const [showResetModal, setShowResetModal] = useState(false);
const [resetPassword, setResetPassword] = useState("");
const [resetCode, setResetCode] = useState("");
const [resetLoading, setResetLoading] = useState(false);
const [resetError, setResetError] = useState("");

// Recovery Passkey States
const [passkeyExists, setPasskeyExists] = useState(false);
const [showGeneratePasskey, setShowGeneratePasskey] = useState(false);
const [passkeyPassword, setPasskeyPassword] = useState("");
const [passkeyTwoFactorCode, setPasskeyTwoFactorCode] = useState("");
const [passkeyLoading, setPasskeyLoading] = useState(false);
const [passkeyError, setPasskeyError] = useState("");
const [generatedPasskey, setGeneratedPasskey] = useState("");

const load2FAStatus = useCallback(async () => {
  try {
    const res = await apiFetch("/api/admin/2fa", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) {
      setTwoFactorEnabled(Boolean(d.enabled));
      if (!d.enabled && d.qrCode) {
        setTwoFactorQR(d.qrCode);
        setTwoFactorSecret(d.secret);
      }
    }
  } catch {}
}, []);

const loadPasskeyStatus = useCallback(async () => {
  try {
    const res = await apiFetch("/api/admin/recovery-passkey", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) {
      setPasskeyExists(Boolean(d.exists));
    }
  } catch {}
}, []);

const generatePasskey = async (e: React.FormEvent) => {
  e.preventDefault();
  setPasskeyError("");

  if (!passkeyPassword) {
    setPasskeyError("Please enter your current password.");
    return;
  }

  setPasskeyLoading(true);
  try {
    const res = await apiFetch("/api/admin/recovery-passkey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passkeyPassword, twoFactorCode: passkeyTwoFactorCode })
    });
    const d = await res.json();
    if (res.ok) {
      setGeneratedPasskey(d.passkey);
      setPasskeyExists(true);
      setPasskeyPassword("");
      setPasskeyTwoFactorCode("");
    } else {
      setPasskeyError(d.error || "Unable to generate passkey.");
    }
  } catch {
    setPasskeyError("Unable to generate passkey.");
  } finally {
    setPasskeyLoading(false);
  }
};

const startSetup2FA = async () => {
  setTwoFactorError("");
  setTwoFactorMessage("");
  setTwoFactorLoading(true);
  try {
    const res = await apiFetch("/api/admin/2fa", { cache: "no-store" });
    const d = await res.json();
    if (res.ok) {
      setTwoFactorQR(d.qrCode);
      setTwoFactorSecret(d.secret);
      setShowSetup2FA(true);
    } else {
      setTwoFactorError(d.error || "Unable to load QR Code.");
    }
  } catch {
    setTwoFactorError("Failed to initiate 2FA setup.");
  } finally {
    setTwoFactorLoading(false);
  }
};

const activate2FA = async (e: React.FormEvent) => {
  e.preventDefault();
  setTwoFactorError("");
  setTwoFactorMessage("");

  if (!twoFactorCode || twoFactorCode.length !== 6) {
    setTwoFactorError("Please enter a valid 6-digit code from your app.");
    return;
  }

  setTwoFactorLoading(true);
  try {
    const res = await apiFetch("/api/admin/2fa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: twoFactorCode, secret: twoFactorSecret })
    });
    const d = await res.json();
    if (res.ok) {
      setTwoFactorEnabled(true);
      setShowSetup2FA(false);
      setTwoFactorCode("");
      setTwoFactorMessage("✓ Google Authenticator (2FA) is now active and protecting your Admin account!");
    } else {
      setTwoFactorError(d.error || "Invalid 6-digit code. Please try again.");
    }
  } catch {
    setTwoFactorError("Failed to activate 2FA.");
  } finally {
    setTwoFactorLoading(false);
  }
};

const handleReset2FA = async (e: React.FormEvent) => {
  e.preventDefault();
  setResetError("");

  if (!resetPassword) {
    setResetError("Current admin password is required.");
    return;
  }

  setResetLoading(true);
  try {
    const res = await apiFetch("/api/admin/2fa", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPassword, code: resetCode })
    });
    const d = await res.json();
    if (res.ok) {
      setTwoFactorEnabled(false);
      setShowResetModal(false);
      setShowSetup2FA(false);
      setResetPassword("");
      setResetCode("");
      setTwoFactorMessage("✓ Google Authenticator has been reset. You can set it up on a new device whenever needed.");
      load2FAStatus();
    } else {
      setResetError(d.error || "Reset failed. Please check credentials.");
    }
  } catch {
    setResetError("Failed to reset 2FA.");
  } finally {
    setResetLoading(false);
  }
};

const changeAdminPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  setPwdMessage("");
  setPwdError("");
  if (!currentPassword || !newPassword || !confirmPassword) {
    setPwdError("All password fields are required.");
    return;
  }
  if (newPassword.length < 6) {
    setPwdError("New password must be at least 6 characters.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setPwdError("New password and confirm password do not match.");
    return;
  }
  if (twoFactorEnabled && (!pwdTwoFactorCode || pwdTwoFactorCode.length !== 6)) {
    setPwdError("Please enter your 6-digit Google Authenticator code.");
    return;
  }
  setPwdLoading(true);
  try {
    const res = await apiFetch("/api/profile/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword,
        twoFactorCode: twoFactorEnabled ? pwdTwoFactorCode : undefined
      })
    });
    const d = await res.json();
    if (!res.ok) {
      setPwdError(d.error || "Password update failed.");
    } else {
      setPwdMessage("✓ Admin password has been successfully updated!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdTwoFactorCode("");
    }
  } catch {
    setPwdError("Failed to update password.");
  } finally {
    setPwdLoading(false);
  }
};


const load = useCallback(()=>{

apiFetch("/api/admin/users",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setUsers(d.users||[]))
.catch(()=>{});

apiFetch("/api/admin/orders",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setOrders(d.orders||[]))
.catch(()=>{});

apiFetch("/api/admin/stats",{ cache:"no-store" })
.then(r=>r.json())
.then(d=>setStats(d))
.catch(()=>{});

}, []);


useEffect(()=>{
load();
loadInvites();
load2FAStatus();
loadPasskeyStatus();
},[load, load2FAStatus, loadPasskeyStatus]);

useRealtimeStream(()=>{
load();
load2FAStatus();
});







const loadInvites=()=>{


apiFetch(
"/api/admin/invites",
{
cache:"no-store"
}
)
.then(r=>r.json())
.then(d=>
setInvites(d.invites||[])
)
.catch(()=>{});


};







const createInvite=async()=>{


setInviteError("");



const r=await apiFetch(
"/api/admin/invites",
{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
days:7
})

}

);



const d=await r.json();




if(!r.ok){

setInviteError(
d.error || "Invite creation failed"
);

return;

}




setInviteUrl(
d.invite.url
);


loadInvites();


};







const revokeInvite=async(token:string)=>{


await apiFetch(

`/api/admin/invites/${encodeURIComponent(token)}`,

{
method:"DELETE"
}

);



loadInvites();


};


const deleteInvite=async(token:string)=>{


await apiFetch(

`/api/admin/invites/${encodeURIComponent(token)}?permanent=true`,

{
method:"DELETE"
}

);



loadInvites();


};





return (

<AdminShell>
<div className="topbar">


<div>

<span className="eyebrow">
UBUY INTELLIGENCE
</span>


<h1>
Business Control Center
</h1>


</div>



<span className="admin-chip live-chip">

<i/>

Live Database

</span>


</div>





<section className="admin-hero-panel">


<div>

<span className="eyebrow">

Business Overview

</span>


<h2>

Manage Your Complete Store Operations

</h2>


<p>

Monitor orders, products, customers and revenue from one premium dashboard.

</p>


</div>




<div className="hero-actions-admin">


<Link
href="/admin/orders"
className="btn"
>

Manage Orders

</Link>



<Link
href="/admin/products"
className="btn btn-ghost"
>

Products

</Link>



</div>



</section>






<div className="info-banner">


<b>
Live Backend
</b>


<span>

Real-time business statistics connected.

</span>


</div>








<div className="stat-grid admin-stats">



<div className="stat">

<span>
Total Users
</span>

<strong>
{stats.totalUsers}
</strong>

<small>
Registered accounts
</small>

</div>





<div className="stat">

<span>
Products
</span>

<strong>
{stats.totalProducts}
</strong>

<small>
Store inventory
</small>

</div>





<div className="stat">

<span>
Orders
</span>

<strong>
{stats.totalOrders}
</strong>

<small>
Customer orders
</small>

</div>





<div className="stat">

<span>
Revenue
</span>

<strong>
${Number(stats.totalSales||0).toFixed(2)}
</strong>

<small>
Completed sales
</small>

</div>





<div className="stat">

<span>
Commission
</span>

<strong>
${Number(stats.totalCommission||0).toFixed(2)}
</strong>

<small>
Total profit
</small>

</div>





<div className="stat">

<span>
Pending Orders
</span>

<strong>
{stats.pendingOrders}
</strong>

<small>
Waiting process
</small>

</div>





<div className="stat">

<span>
On The Way
</span>

<strong>
{stats.onWayOrders}
</strong>

<small>
Delivery flow
</small>

</div>





<div className="stat">

<span>
Completed
</span>

<strong>
{stats.completedOrders}
</strong>

<small>
Finished orders
</small>

</div>



</div>







<AdminCharts stats={stats}/>







<section className="panel">



<div className="panel-head">


<div>

<span className="eyebrow">
Orders
</span>


<h2>
Recent Orders
</h2>


</div>




<Link

href="/admin/orders"

className="btn btn-small"

>

Manage Orders

</Link>



</div>








<div className="table-wrap">


<table>


<thead>


<tr>

<th>
Product
</th>


<th>
Customer
</th>


<th>
Amount
</th>


<th>
Commission
</th>


<th>
Status
</th>


</tr>


</thead>





<tbody>



{orders.slice(0,8).map((o:any)=>(



<tr key={o.id}>


<td>


<b>
{o.productName}
</b>


<br/>


<small>
#{o.id.slice(0,8)}
</small>


</td>




<td>


{
users.find(
(u:any)=>u.id===o.customerId
)?.name || "Customer"

}


</td>




<td>

${Number(o.orderAmount||0).toFixed(2)}

</td>




<td>

${Number(o.commission||0).toFixed(2)}

</td>




<td>

<span className={`status ${o.status}`}>

{o.status}

</span>

</td>



</tr>



))}



</tbody>


</table>


</div>



</section>
<section className="panel">


<div className="panel-head">


<div>

<span className="eyebrow">
Access Control
</span>


<h2>
Customer Invitations
</h2>


</div>




<button

className="btn btn-small"

onClick={createInvite}

>

Create 7-day Invite

</button>



</div>






{inviteError && (

<div className="form-error">

{inviteError}

</div>

)}







{inviteUrl && (

<div className="invite-box">


<input

value={inviteUrl}

readOnly

/>


<button

className="table-btn"

onClick={()=>{
navigator.clipboard.writeText(inviteUrl);
setInviteLinkCopied(true);
setTimeout(()=>setInviteLinkCopied(false), 2000);
}}

>

{inviteLinkCopied ? "✓ Copied" : "Copy Link"}

</button>


</div>

)}








<div className="table-wrap" style={{maxHeight:"420px",overflowY:"auto"}}>


<table>


<thead>

<tr>

<th>
Token
</th>

<th>
Status
</th>

<th>
Expiry
</th>

<th>
Action
</th>


</tr>

</thead>





<tbody>


{invites.map((i:any)=>(


<tr key={i.id}>


<td>

<small>

{i.token}

</small>

</td>




<td>


<span className={`status ${i.revoked ? "suspended" : "active"}`}>

{i.used ? "Used" : i.revoked ? "Revoked" : "Available"}

</span>


</td>




<td>

{new Date(i.expiresAt).toLocaleString()}

</td>




<td>


{!i.used && !i.revoked ? (

<button

className="table-btn"

onClick={()=>revokeInvite(i.token)}

>

Revoke

</button>

) : (

<button

className="table-btn danger-btn"

title="Delete from history"

onClick={()=>deleteInvite(i.token)}

>

🗑️

</button>

)}


</td>



</tr>



))}


</tbody>


</table>


</div>



</section>








<section className="panel">



<div className="panel-head">


<div>


<span className="eyebrow">
Customers
</span>


<h2>
Latest Accounts
</h2>


</div>




<Link

href="/admin/users"

className="btn btn-small"

>

Manage Users

</Link>



</div>







<div className="table-wrap">


<table>



<thead>


<tr>

<th>
User
</th>


<th>
Email
</th>


<th>
Balance
</th>


<th>
Status
</th>


</tr>


</thead>





<tbody>



{users.slice(-8).reverse().map((u:any)=>(



<tr key={u.id}>


<td>


<div className="user-cell">


<span className="avatar">

{u.name?.[0] || "U"}

</span>



<div>

<b>

{u.name}

</b>


</div>



</div>


</td>





<td>

{u.email}

</td>





<td>

${Number(u.balance||0).toFixed(2)}

</td>





<td>


<span className="status active">

{u.status}

</span>


</td>




</tr>



))}



</tbody>


</table>


</div>



</section>

<section className="panel" style={{ marginTop: "24px" }}>
  <div className="panel-head">
    <div>
      <span className="eyebrow">Account Security</span>
      <h2>Google Authenticator (2FA)</h2>
    </div>

    {twoFactorEnabled ? (
      <span className="status active" style={{ fontSize: "12px", padding: "6px 12px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
        🛡️ 2FA Active & Protected
      </span>
    ) : (
      <span className="status pending" style={{ fontSize: "12px", padding: "6px 12px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
        ⚠️ 2FA Not Enabled
      </span>
    )}
  </div>

  <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
    Two-Factor Authentication adds an extra layer of security to your admin account. When enabled, a 6-digit code from Google Authenticator is required to sign in and change admin credentials.
  </p>

  {twoFactorMessage && (
    <div className="info-banner" style={{ borderLeft: "4px solid #10b981", color: "#10b981", background: "rgba(16, 185, 129, 0.1)", margin: "16px 0" }}>
      {twoFactorMessage}
    </div>
  )}

  {twoFactorError && (
    <div className="form-error" style={{ margin: "16px 0" }}>
      {twoFactorError}
    </div>
  )}

  {twoFactorEnabled ? (
    <div style={{ marginTop: "16px", padding: "18px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "14px", maxWidth: "620px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
        <div style={{ fontSize: "28px" }}>✅</div>
        <div>
          <b style={{ color: "#f8fafc", fontSize: "15px" }}>Admin Account is Protected</b>
          <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
            Google Authenticator is actively required on every Admin login and password modification.
          </p>
        </div>
      </div>

      {!showResetModal ? (
        <button
          type="button"
          onClick={() => { setShowResetModal(true); setResetError(""); }}
          className="table-btn"
          style={{ padding: "8px 16px", color: "#f87171", borderColor: "rgba(248, 113, 113, 0.3)" }}
        >
          🔄 Reset / Re-bind Authenticator (Phone Change / Handover)
        </button>
      ) : (
        <form onSubmit={handleReset2FA} style={{ marginTop: "14px", padding: "14px", background: "rgba(0, 0, 0, 0.25)", borderRadius: "10px", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
          <b style={{ color: "#f87171", fontSize: "13px", display: "block", marginBottom: "10px" }}>
            Confirm Reset Authenticator:
          </b>

          {resetError && <div className="form-error" style={{ marginBottom: "10px" }}>{resetError}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <label style={{ fontSize: "12px", color: "#94a3b8" }}>
              Admin Current Password:
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="Enter current password"
                required
                style={{ marginTop: "4px" }}
              />
            </label>

            <label style={{ fontSize: "12px", color: "#94a3b8" }}>
              Current 6-Digit Authenticator Code:
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
                style={{ marginTop: "4px" }}
              />
            </label>

            <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
              <button
                type="submit"
                className="btn danger-btn"
                disabled={resetLoading}
                style={{ padding: "8px 16px" }}
              >
                {resetLoading ? "Resetting..." : "Confirm Reset 2FA"}
              </button>

              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="table-btn"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  ) : (
    <div style={{ marginTop: "16px" }}>
      {!showSetup2FA ? (
        <button
          type="button"
          onClick={startSetup2FA}
          disabled={twoFactorLoading}
          className="btn"
          style={{ minWidth: "220px" }}
        >
          {twoFactorLoading ? "Generating QR…" : "📲 Setup Google Authenticator"}
        </button>
      ) : (
        <div style={{ padding: "20px", background: "rgba(255, 255, 255, 0.025)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "16px", maxWidth: "580px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#38bdf8", marginBottom: "12px" }}>
            Step 1: Scan QR Code with Google Authenticator
          </h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "16px" }}>
            Open the <b>Google Authenticator</b> app on your mobile phone, tap <b>+</b> and choose <b>Scan a QR code</b>.
          </p>

          {twoFactorQR && (
            <div style={{ display: "flex", justifyContent: "center", padding: "12px", background: "#ffffff", borderRadius: "12px", width: "fit-content", margin: "0 auto 16px" }}>
              <img src={twoFactorQR} alt="Google Authenticator QR Code" style={{ width: "200px", height: "200px", display: "block" }} />
            </div>
          )}

          {twoFactorSecret && (
            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", marginBottom: "18px", textAlign: "center" }}>
              <span style={{ fontSize: "11px", color: "#94a3b8", display: "block" }}>Manual Setup Key (if camera scan not working):</span>
              <code style={{ fontSize: "14px", color: "#fbbf24", fontWeight: 700, letterSpacing: "2px" }}>{twoFactorSecret}</code>
            </div>
          )}

          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#38bdf8", marginBottom: "8px" }}>
            Step 2: Verify & Activate
          </h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>
            Enter the 6-digit code currently shown in your Google Authenticator app to confirm:
          </p>

          <form onSubmit={activate2FA} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              maxLength={6}
              inputMode="numeric"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
              style={{
                textAlign: "center",
                fontSize: "22px",
                letterSpacing: "6px",
                fontWeight: 700,
                maxWidth: "240px",
                margin: "0 auto"
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "6px" }}>
              <button
                type="submit"
                className="btn"
                disabled={twoFactorLoading || twoFactorCode.length !== 6}
                style={{ minWidth: "160px" }}
              >
                {twoFactorLoading ? "Activating…" : "✓ Verify & Activate 2FA"}
              </button>

              <button
                type="button"
                onClick={() => { setShowSetup2FA(false); setTwoFactorCode(""); setTwoFactorError(""); }}
                className="table-btn"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )}
</section>

<section className="panel" style={{ marginTop: "24px" }}>
  <div className="panel-head">
    <div>
      <span className="eyebrow">Security & Credentials</span>
      <h2>Change Admin Password</h2>
    </div>
  </div>

  {pwdMessage && (
    <div className="info-banner" style={{ borderLeft: "4px solid #10b981", color: "#10b981", background: "rgba(16, 185, 129, 0.1)" }}>
      <b>Success:</b> {pwdMessage}
    </div>
  )}

  {pwdError && (
    <div className="form-error" style={{ marginBottom: "16px" }}>
      {pwdError}
    </div>
  )}

  <form onSubmit={changeAdminPassword} style={{ maxWidth: "540px", display: "flex", flexDirection: "column", gap: "16px" }}>
    <small className="hint">
      Forgot your password and logged in using your recovery passkey instead?
      Enter that passkey below as your &quot;current password&quot; to set a new one.
    </small>

    <label>
      Current / Old Password
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Enter current password"
        required
      />
    </label>

    <label>
      New Password (min. 6 characters)
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        required
      />
    </label>

    <label>
      Confirm New Password
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Confirm new password"
        required
      />
    </label>

    {twoFactorEnabled && (
      <label>
        Google Authenticator Code (6-Digit)
        <input
          type="text"
          maxLength={6}
          inputMode="numeric"
          value={pwdTwoFactorCode}
          onChange={(e) => setPwdTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter 6-digit code from app"
          required
          style={{ letterSpacing: "4px", fontWeight: 700 }}
        />
      </label>
    )}

    <div style={{ marginTop: "8px" }}>
      <button
        type="submit"
        className="btn"
        disabled={pwdLoading}
        style={{ minWidth: "160px" }}
      >
        {pwdLoading ? "Updating..." : "Update Password"}
      </button>
    </div>
  </form>
</section>

<section className="panel" style={{ marginTop: "24px" }}>
  <div className="panel-head">
    <div>
      <span className="eyebrow">Security & Credentials</span>
      <h2>Recovery Passkey</h2>
    </div>
  </div>

  <p>
    A one-time recovery key you can use to log in if you ever forget
    your password. {passkeyExists
      ? "A passkey has already been generated for this account."
      : "No passkey has been generated yet."}
  </p>

  {passkeyError && (
    <div className="form-error" style={{ marginBottom: "16px" }}>
      {passkeyError}
    </div>
  )}

  {generatedPasskey ? (
    <div className="info-banner" style={{ borderLeft: "4px solid #10b981" }}>
      <p style={{ marginTop: 0 }}>
        <b>Save this passkey somewhere safe now — it will not be shown again:</b>
      </p>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: "16px",
          fontWeight: 700,
          letterSpacing: "1px",
          wordBreak: "break-all",
          background: "rgba(255,255,255,.04)",
          border: "1px solid var(--line)",
          borderRadius: "10px",
          padding: "14px",
          margin: "10px 0"
        }}
      >
        {generatedPasskey}
      </div>
      <button
        className="btn btn-small"
        onClick={() => {
          setGeneratedPasskey("");
          setShowGeneratePasskey(false);
        }}
      >
        Done, I've saved it
      </button>
    </div>
  ) : showGeneratePasskey ? (
    <form onSubmit={generatePasskey} style={{ maxWidth: "540px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <label>
        Current Password
        <input
          type="password"
          value={passkeyPassword}
          onChange={(e) => setPasskeyPassword(e.target.value)}
          placeholder="Enter current password"
          required
        />
      </label>

      {twoFactorEnabled && (
        <label>
          Google Authenticator Code (6-Digit)
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            value={passkeyTwoFactorCode}
            onChange={(e) => setPasskeyTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Enter 6-digit code from app"
            required
            style={{ letterSpacing: "4px", fontWeight: 700 }}
          />
        </label>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        <button type="submit" className="btn" disabled={passkeyLoading}>
          {passkeyLoading ? "Generating..." : (passkeyExists ? "Regenerate Passkey" : "Generate Passkey")}
        </button>
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={() => setShowGeneratePasskey(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  ) : (
    <button className="btn" onClick={() => setShowGeneratePasskey(true)}>
      {passkeyExists ? "Regenerate Passkey" : "Generate Passkey"}
    </button>
  )}
</section>

</AdminShell>

);

}