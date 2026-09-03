"use client";
import {FormEvent,useEffect,useRef,useState} from "react";
import {UserShell} from "../components";
import {apiFetch,apiMe} from "../lib";
import {countryCodes,getCountry} from "../countries";

export default function Profile(){
const[name,setName]=useState(""); const[shopName,setShopName]=useState(""); const[email,setEmail]=useState(""); const[phone,setPhone]=useState(""); const[countryCode,setCountryCode]=useState("+1"); const[country,setCountry]=useState("United States");
 const[status,setStatus]=useState("Active"); const[image,setImage]=useState(""); const[saved,setSaved]=useState(false); const[error,setError]=useState("");
 const fileRef=useRef<HTMLInputElement>(null);

 const[currentPassword,setCurrentPassword]=useState(""); const[newPassword,setNewPassword]=useState(""); const[confirmPassword,setConfirmPassword]=useState("");
 const[pwSaving,setPwSaving]=useState(false); const[pwMessage,setPwMessage]=useState(""); const[pwError,setPwError]=useState("");

 const[txCurrentPassword,setTxCurrentPassword]=useState(""); const[newTxPassword,setNewTxPassword]=useState(""); const[confirmTxPassword,setConfirmTxPassword]=useState("");
 const[txSaving,setTxSaving]=useState(false); const[txMessage,setTxMessage]=useState(""); const[txError,setTxError]=useState("");

 useEffect(()=>{apiMe().then(d=>{setName(d.user.name||"");setShopName(d.user.shopName||"");setEmail(d.user.email||"");setPhone(d.user.phone||"");setCountryCode(d.user.countryCode||"+1");setCountry(d.user.country||"United States");setStatus(d.user.status||"Active");setImage(d.user.profileImage||"")}).catch(()=>{})},[]);
 const save=async(e:FormEvent)=>{e.preventDefault();setSaved(false);setError("");const r=await apiFetch("/api/profile",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({
name,
shopName,
profileImage:image
})});const d=await r.json();if(!r.ok){setError(d.error||"Could not save");return}setSaved(true);setTimeout(()=>setSaved(false),1800)};
 const chooseImage=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith("image/")){setError("Please select an image file.");return}if(f.size>900000){setError("Please choose an image smaller than 900 KB.");return}const r=new FileReader();r.onload=()=>setImage(String(r.result||""));r.readAsDataURL(f)};
 const selected=getCountry(country);

 const changePassword=async(e:FormEvent)=>{
  e.preventDefault();
  setPwMessage("");setPwError("");setPwSaving(true);

  const r=await apiFetch("/api/profile/change-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword,newPassword,confirmPassword})});
  const d=await r.json();

  if(!r.ok){setPwError(d.error||"Could not update password");setPwSaving(false);return}

  setPwMessage("Login password updated successfully.");
  setCurrentPassword("");setNewPassword("");setConfirmPassword("");
  setPwSaving(false);
 };

 const changeTransactionPassword=async(e:FormEvent)=>{
  e.preventDefault();
  setTxMessage("");setTxError("");setTxSaving(true);

  const r=await apiFetch("/api/profile/change-transaction-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({currentPassword:txCurrentPassword,newTransactionPassword:newTxPassword,confirmTransactionPassword:confirmTxPassword})});
  const d=await r.json();

  if(!r.ok){setTxError(d.error||"Could not update transaction password");setTxSaving(false);return}

  setTxMessage("Transaction password updated successfully.");
  setTxCurrentPassword("");setNewTxPassword("");setConfirmTxPassword("");
  setTxSaving(false);
 };

 return <UserShell><section className="panel form-panel"><div className="profile-banner"><div className="profile-avatar big" style={image?{backgroundImage:`url(${image})`,backgroundSize:"cover",backgroundPosition:"center",color:"transparent"}:{}}>{!image&&(name[0]||"A")}</div><div><h2>Profile</h2><p>Manage your personal account details.</p><input ref={fileRef} type="file" accept="image/*" onChange={chooseImage} style={{display:"none"}}/><button type="button" className="btn btn-small btn-ghost" onClick={()=>fileRef.current?.click()}>{image?"Change profile picture":"Add profile picture"}</button></div></div>
 <form className="form-grid" onSubmit={save}>
  {error&&<div className="form-error" style={{gridColumn:"1/-1"}}>{error}</div>}
  <label>Full name<input value={name} onChange={e=>setName(e.target.value)} /></label>
  <label>Shop name<input value={shopName} onChange={e=>setShopName(e.target.value)} placeholder="Enter your store/shop name" /></label>
  <label>Email<input type="email" value={email} readOnly /></label>
  <label>Phone number<div style={{display:"flex",gap:8}}><select value={countryCode} disabled style={{width:110}}><option value={countryCode}>{countryCode}</option></select><input value={phone} readOnly placeholder="Phone number" style={{flex:1}} maxLength={selected?.digits||10}/></div></label>
  <label>Country<select value={country} disabled>{countryCodes.map(c=><option key={c.country}>{c.country}</option>)}</select></label>
  <label>Account status<input value={status} readOnly /></label>
  <div className="save-row" style={{gridColumn:"1/-1"}}><span>{saved?"✓ Changes saved":"Country, country code and phone number are fixed after registration."}</span><button className="btn" type="submit">Save changes</button></div>
 </form></section>

 <section className="panel form-panel">
  <div className="panel-head">
   <div>
    <span className="eyebrow">Account Security</span>
    <h2>Change Login Password</h2>
   </div>
  </div>

  <form className="form-grid" onSubmit={changePassword}>
   {pwError&&<div className="form-error" style={{gridColumn:"1/-1"}}>{pwError}</div>}
   {pwMessage&&<div className="info-banner" style={{gridColumn:"1/-1"}}>{pwMessage}</div>}
   <label>Current password<input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} /></label>
   <label>New password<input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>
   <label>Confirm new password<input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /></label>
   <div className="save-row" style={{gridColumn:"1/-1"}}><span>Use at least 6 characters.</span><button className="btn" type="submit" disabled={pwSaving||!currentPassword||!newPassword||!confirmPassword}>{pwSaving?"Saving...":"Update Login Password"}</button></div>
  </form>
 </section>

 <section className="panel form-panel">
  <div className="panel-head">
   <div>
    <span className="eyebrow">Account Security</span>
    <h2>Change Transaction Password</h2>
   </div>
  </div>

  <p>Your 6-digit transaction password is required for withdrawals.</p>

  <form className="form-grid" onSubmit={changeTransactionPassword}>
   {txError&&<div className="form-error" style={{gridColumn:"1/-1"}}>{txError}</div>}
   {txMessage&&<div className="info-banner" style={{gridColumn:"1/-1"}}>{txMessage}</div>}
   <label>Current login password<input type="password" value={txCurrentPassword} onChange={e=>setTxCurrentPassword(e.target.value)} /></label>
   <label>New transaction password (6 digits)<input type="password" inputMode="numeric" maxLength={6} value={newTxPassword} onChange={e=>setNewTxPassword(e.target.value.replace(/\D/g,""))} /></label>
   <label>Confirm transaction password<input type="password" inputMode="numeric" maxLength={6} value={confirmTxPassword} onChange={e=>setConfirmTxPassword(e.target.value.replace(/\D/g,""))} /></label>
   <div className="save-row" style={{gridColumn:"1/-1"}}><span>Your login password confirms this change.</span><button className="btn" type="submit" disabled={txSaving||!txCurrentPassword||newTxPassword.length!==6||confirmTxPassword.length!==6}>{txSaving?"Saving...":"Update Transaction Password"}</button></div>
  </form>
 </section>
 </UserShell>
}

