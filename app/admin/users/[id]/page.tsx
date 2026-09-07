"use client";

export const dynamic = "force-dynamic";

import {useEffect,useState,useCallback} from "react";
import Link from "next/link";
import {useParams} from "next/navigation";
import {AdminShell} from "../../../components";
import {apiFetch,useRealtimeStream} from "../../../lib";
import {orderStatusLabel} from "../../../order-statuses";


export default function UserDetail(){

  const params=useParams();
  const id=String(params.id);

  const [user,setUser]=useState<any>(null);
  const [orders,setOrders]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  const [guaranteeMoney,setGuaranteeMoney]=useState("");
  const [savingGuarantee,setSavingGuarantee]=useState(false);

  const [sellerRating,setSellerRating]=useState("0");
  const [savingRating,setSavingRating]=useState(false);

  const [viewsMin,setViewsMin]=useState("0");
  const [viewsMax,setViewsMax]=useState("0");
  const [savingViews,setSavingViews]=useState(false);

  const [adjust,setAdjust]=useState("");
  const [adjustTarget,setAdjustTarget]=useState<"balance"|"profit">("balance");
  const [adjusting,setAdjusting]=useState(false);

  const [newPassword,setNewPassword]=useState("");
  const [confirmNewPassword,setConfirmNewPassword]=useState("");
  const [resetTwoFactorCode,setResetTwoFactorCode]=useState("");
  const [resettingPassword,setResettingPassword]=useState(false);

  const [message,setMessage]=useState("");

  const load = useCallback(async()=>{
    try {
      const r = await apiFetch(`/api/admin/users/${id}`, { cache:"no-store" });
      const d = await r.json();

      if(r.ok && d.user){
        setUser(d.user);
        setOrders(d.orders || []);
        setGuaranteeMoney(String(Number(d.user?.guaranteeMoney || 0)));
        setSellerRating(String(Number(d.user?.sellerRating || 0)));
        setViewsMin(String(Number(d.user?.viewsMin ?? 0)));
        setViewsMax(String(Number(d.user?.viewsMax ?? 0)));
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });






  const saveGuaranteeMoney=async()=>{


    setMessage("");



    const amount=Number(
      guaranteeMoney
    );



    if(
      !Number.isFinite(amount) ||
      amount < 0
    ){

      setMessage(
        "Enter a valid Guarantee Money amount."
      );

      return;

    }




    setSavingGuarantee(true);




    const r=await apiFetch(
      `/api/admin/users/${id}`,
      {

        method:"PATCH",

        headers:{
          "Content-Type":"application/json"
        },


        body:JSON.stringify({

          guaranteeMoney:amount

        })

      }
    );




    const d=await r.json();




    if(r.ok){


      setUser(d.user);



      setMessage(
        "Guarantee Money updated successfully."
      );


    }else{


      setMessage(
        d.error ||
        "Unable to update Guarantee Money."
      );


    }




    setSavingGuarantee(false);



  };






  const saveSellerRating=async()=>{


    setSavingRating(true);



    const rating=Number(
      sellerRating
    );



    const r=await apiFetch(
      `/api/admin/users/${id}`,
      {

        method:"PATCH",

        headers:{
          "Content-Type":"application/json"
        },


        body:JSON.stringify({

          sellerRating:rating

        })

      }
    );



    const d=await r.json();




    if(r.ok){

  setUser(d.user);

  setSellerRating(
    String(
      Number(d.user?.sellerRating || 0)
    )
  );

  setMessage(
    "Seller Rating updated successfully."
  );

}
else{


      setMessage(
        d.error ||
        "Unable to update rating."
      );


    }



    setSavingRating(false);



  };

  const saveViewsRange = async () => {
    setMessage("");

    const min = parseInt(viewsMin, 10);
    const max = parseInt(viewsMax, 10);

    if (!Number.isFinite(min) || min < 0) {
      setMessage("Please enter a valid Min Views value (0 or greater).");
      return;
    }

    if (!Number.isFinite(max) || max < min) {
      setMessage("Max Views must be greater than or equal to Min Views.");
      return;
    }

    setSavingViews(true);

    try {
      const r = await apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          viewsMin: min,
          viewsMax: max
        })
      });

      const d = await r.json();

      if (r.ok) {
        setUser(d.user);
        setViewsMin(String(Number(d.user?.viewsMin ?? min)));
        setViewsMax(String(Number(d.user?.viewsMax ?? max)));
        setMessage("Store Views limit updated successfully.");
      } else {
        setMessage(d.error || "Unable to update Store Views limit.");
      }
    } catch {
      setMessage("Unable to update Store Views limit.");
    } finally {
      setSavingViews(false);
    }
  };


  const fundsAdjust=async(mode:"add"|"deduct")=>{

    if(!adjust||adjusting) return;

    const num = Math.round(Number(adjust) * 100) / 100;
    if (!Number.isFinite(num) || num <= 0) {
      setMessage("Please enter a valid positive amount.");
      return;
    }

    setAdjusting(true);
    setMessage("");
    setAdjust("");

    try {
      const r=await apiFetch(
        adjustTarget==="balance" ? "/api/admin/balance" : "/api/admin/profit",
        {
          method:"PATCH",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ userId:id, amount:num, mode })
        }
      );

      const d=await r.json();

      if (r.ok && d.user) {
        setUser((prev:any)=>prev ? { ...prev, [adjustTarget]: d.user[adjustTarget] } : prev);
        setMessage(`${adjustTarget==="balance" ? "Total Balance" : "Total Profit"} updated to $${Number(d.user[adjustTarget]).toFixed(2)}`);
      } else {
        setMessage(d.error || "Update failed");
      }
    } catch {
      setMessage("Update failed");
    } finally {
      setAdjusting(false);
    }

  };


  const resetPassword=async()=>{

    setMessage("");

    if(newPassword.length < 6){
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if(newPassword !== confirmNewPassword){
      setMessage("Passwords do not match.");
      return;
    }

    setResettingPassword(true);

    try {
      const r = await apiFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, twoFactorCode: resetTwoFactorCode })
      });

      const d = await r.json();

      if (r.ok) {
        setNewPassword("");
        setConfirmNewPassword("");
        setResetTwoFactorCode("");
        setMessage(`Password reset successfully. New password: ${newPassword}`);
      } else {
        setMessage(d.error || "Unable to reset password.");
      }
    } catch {
      setMessage("Unable to reset password.");
    } finally {
      setResettingPassword(false);
    }

  };

  const nextOrderStatus=(status:string)=>{

    if(status==="pending") return "handed_over";
    if(status==="handed_over") return "on_the_way";
    if(status==="on_the_way") return "delivered";
    if(status==="delivered") return "completed";

    return "";

  };


  const updateOrderStatus=async(orderId:string,status:string)=>{

    setMessage("");

    const r=await apiFetch(
      `/api/admin/orders/${orderId}`,
      {
        method:"PATCH",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({status})
      }
    );

    const d=await r.json();

    if(!r.ok){
      setMessage(d.error || "Could not update order");
      return;
    }

    setMessage(`Order status changed to ${orderStatusLabel(status)}`);

    load();

  };

  if(loading){

    return(

      <AdminShell>

        <div className="loading-screen">
          Loading customer profile...
        </div>

      </AdminShell>

    );

  }




  if(!user){

    return(

      <AdminShell>

        <section className="panel empty-state">

          User not found.

        </section>

      </AdminShell>

    );

  }




  const pendingBalance =
    orders
      .filter(
        (o:any)=>
          [
            "pending",
            "handed_over",
            "on_the_way",
            "delivered"
          ].includes(o.status)
      )
      .reduce(
        (total:number,o:any)=>
          total + Number(o.orderAmount || 0),
        0
      );





  return(

    <AdminShell>


      <div className="topbar">


        <div>


          <span className="eyebrow">
            Customer Profile
          </span>



          <h1>
            {user.name}
          </h1>


        </div>




        <div className="action-row">

          {user.role !== "admin" && (

            <button
              className="btn btn-small"
              onClick={() =>
                window.open(
                  `/admin/impersonate?userId=${user.id}`,
                  "_blank"
                )
              }
            >
              Login as Seller
            </button>

          )}


          <Link
            href="/admin/users"
            className="btn btn-small"
          >

            ← Back Users

          </Link>

        </div>



      </div>





      {message && (

        <div className="info-banner">

          {message}

        </div>

      )}






      <section className="panel profile-banner">


        <div className="profile-avatar big">

          {user.name?.[0]}

        </div>



        <div>


          <h2>
            {user.name}
          </h2>



          <p>
            {user.email}
          </p>



        </div>




        <span
          className={`status ${user.status?.toLowerCase()}`}
        >

          {user.status}

        </span>



      </section>







      <div className="stat-grid dashboard-stats">



        <div className="stat">

          <span>
            Pending Balance
          </span>


          <strong>
            ${pendingBalance.toFixed(2)}
          </strong>


          <small>
            Active orders
          </small>


        </div>





        <div className="stat">

          <span>
            Wallet Balance
          </span>


          <strong>
            ${Number(user.balance||0).toFixed(2)}
          </strong>


          <small>
            Available balance
          </small>


        </div>


        <div className="stat">

          <span>
            Total Profit
          </span>


          <strong>
            ${Number(user.profit||0).toFixed(2)}
          </strong>


          <small>
            Earned commissions
          </small>


        </div>



        <div className="stat">

          <span>
            Guarantee Money
          </span>


          <strong>
            ${Number(user.guaranteeMoney||0).toFixed(2)}
          </strong>


          <small>
            Admin controlled
          </small>


        </div>





        <div className="stat">

          <span>
            Seller Rating
          </span>


          <strong>
            ⭐ {Number(user.sellerRating||0).toFixed(1)}
          </strong>


          <small>
            Customer visible
          </small>


        </div>

        <div className="stat">

          <span>
            Store Views Limit
          </span>

          <strong>
            👁️ {Number(user.viewsMin ?? 600).toLocaleString()} – {Number(user.viewsMax ?? 3200).toLocaleString()}
          </strong>

          <small>
            Min – Max Views
          </small>

        </div>




      </div>





      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">Funds</span>
            <h2>Balance & Profit Control</h2>
          </div>

          <Link
            className="btn btn-small"
            href={`/admin/pos?customerId=${id}`}
          >
            Create Order For This Seller
          </Link>
        </div>

        <label>
          Adjust

          <div className="adjust-row" style={{marginBottom:8}}>
            <select value={adjustTarget} onChange={e=>setAdjustTarget(e.target.value as "balance"|"profit")}>
              <option value="balance">Total Balance</option>
              <option value="profit">Total Profit</option>
            </select>
          </div>

          <div className="adjust-row" style={{maxWidth:"520px"}}>

            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Amount"
              value={adjust}
              disabled={adjusting}
              onChange={e=>setAdjust(e.target.value)}
            />

            <button
              className="btn btn-small"
              disabled={adjusting || !adjust}
              onClick={()=>fundsAdjust("add")}
            >
              {adjusting ? "Processing..." : "+ Add"}
            </button>

            <button
              className="btn btn-small danger-btn"
              disabled={adjusting || !adjust}
              onClick={()=>fundsAdjust("deduct")}
            >
              {adjusting ? "Processing..." : "− Deduct"}
            </button>

          </div>
        </label>

        <small className="hint">
          Only that seller&apos;s own store products are shown when creating an order for them from the POS page.
        </small>

      </section>


      <section className="panel">


        <div className="panel-head">


          <div>

            <span className="eyebrow">
              Account Security
            </span>


            <h2>
              Guarantee Money
            </h2>


          </div>


        </div>




        <p>
          Set the security amount for this customer.
          This amount is controlled by the admin.
        </p>





        <div
          className="adjust-row"
          style={{
            maxWidth:"520px"
          }}
        >



          <input

            type="number"

            min="0"

            step="0.01"

            value={guaranteeMoney}

            onChange={e=>
              setGuaranteeMoney(
                e.target.value
              )
            }


            placeholder="Guarantee Money"

          />




          <button

            className="btn"

            onClick={saveGuaranteeMoney}

            disabled={savingGuarantee}

          >


            {savingGuarantee
              ? "Saving..."
              : "Update Guarantee Money"
            }



          </button>




        </div>




      </section>


      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">
              Account Security
            </span>

            <h2>
              Reset Password
            </h2>
          </div>
        </div>

        <p>
          Set a new password for this user if they forgot theirs.
          Their current password cannot be viewed — it is stored securely
          and only a new one can be set. Share the new password with the
          user yourself after resetting it.
        </p>

        <div
          className="adjust-row"
          style={{
            maxWidth: "520px",
            display: "flex",
            gap: "12px",
            flexWrap: "wrap"
          }}
        >
          <input
            type="text"
            value={newPassword}
            onChange={e=>setNewPassword(e.target.value)}
            placeholder="New password (min 6 characters)"
          />

          <input
            type="text"
            value={confirmNewPassword}
            onChange={e=>setConfirmNewPassword(e.target.value)}
            placeholder="Confirm new password"
          />

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={resetTwoFactorCode}
            onChange={e=>setResetTwoFactorCode(e.target.value)}
            placeholder="Your 6-digit Authenticator code"
          />

          <button
            className="btn"
            onClick={resetPassword}
            disabled={resettingPassword || !newPassword || !confirmNewPassword}
          >
            {resettingPassword ? "Resetting..." : "Reset Password"}
          </button>
        </div>

        <small className="hint">
          Requires your own Google Authenticator code to confirm, so a
          stolen admin session alone can't be used to take over another
          user's account.
        </small>

      </section>

      <section className="panel">


        <div className="panel-head">


          <div>

            <span className="eyebrow">
              Seller Performance
            </span>


            <h2>
              Seller Rating
            </h2>


          </div>


        </div>





        <p>
          Set seller rating shown on customer dashboard.
        </p>





        <div
          className="adjust-row"
          style={{
            maxWidth:"520px"
          }}
        >



          <input

            type="number"

            min="0"

            max="5"

            step="0.1"

            value={sellerRating}

            onChange={e=>
              setSellerRating(
                e.target.value
              )
            }


            placeholder="Rating 0-5"

          />





          <button

            className="btn"

            onClick={saveSellerRating}

            disabled={savingRating}

          >



            {savingRating
              ? "Saving..."
              : "Update Rating"
            }



          </button>




        </div>




      </section>


      <section className="panel">

        <div className="panel-head">
          <div>
            <span className="eyebrow">Store Traffic</span>
            <h2>Store Views Limit</h2>
          </div>
        </div>

        <p>
          Set the min and max store views limit for this customer.
          The live store views counter will fluctuate dynamically within this range.
        </p>

        <div
          className="adjust-row"
          style={{
            maxWidth: "600px",
            display: "flex",
            gap: "12px",
            alignItems: "flex-end",
            flexWrap: "wrap"
          }}
        >
          <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Min Views</span>
            <input
              type="number"
              min="0"
              step="1"
              value={viewsMin}
              onChange={e => setViewsMin(e.target.value)}
              placeholder="Min Views (e.g. 500)"
            />
          </div>

          <div style={{ flex: 1, minWidth: "120px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>Max Views</span>
            <input
              type="number"
              min="0"
              step="1"
              value={viewsMax}
              onChange={e => setViewsMax(e.target.value)}
              placeholder="Max Views (e.g. 3500)"
            />
          </div>

          <button
            className="btn"
            onClick={saveViewsRange}
            disabled={savingViews}
            style={{ whiteSpace: "nowrap" }}
          >
            {savingViews ? "Saving..." : "Update Views Limit"}
          </button>
        </div>

      </section>


      <section className="panel">


        <div className="panel-head">


          <div>


            <span className="eyebrow">
              Order History
            </span>



            <h2>
              Customer Orders
            </h2>


          </div>


        </div>






        <div className="table-wrap">


          <table>


            <thead>


              <tr>


                <th>
                  Product
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


                <th>
                  Next Step
                </th>


              </tr>


            </thead>





            <tbody>



              {
                orders.length===0 ? (


                  <tr>


                    <td colSpan={5}>

                      No orders yet.

                    </td>


                  </tr>



                ) : (



                  orders.map(o=>(


                    <tr key={o.id}>


                      <td>

                        <b>
                          {o.productName}
                        </b>

                      </td>




                      <td>

                        ${Number(
                          o.orderAmount || 0
                        ).toFixed(2)}

                      </td>




                      <td>

                        ${Number(
                          o.commission || 0
                        ).toFixed(2)}

                      </td>





                      <td>


                        <span
                          className={`status order-status ${o.status}`}
                        >

                          {orderStatusLabel(o.status)}

                        </span>


                      </td>


                      <td>

                        {
                          nextOrderStatus(o.status)
                          ?
                          <div className="status-action">

                            <button
                              className="table-btn"
                              onClick={()=>updateOrderStatus(o.id, nextOrderStatus(o.status))}
                            >
                              Mark {orderStatusLabel(nextOrderStatus(o.status))}
                            </button>

                          </div>
                          :
                          <span className="hint">Completed</span>
                        }

                      </td>



                    </tr>


                  ))



                )
              }



            </tbody>



          </table>



        </div>




      </section>





    </AdminShell>


  );


}