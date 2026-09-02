"use client";

import {useEffect,useState,useCallback} from "react";
import Link from "next/link";
import {UserShell} from "../components";
import {apiFetch,useRealtimeStream} from "../lib";


export default function Withdrawal(){

  const [balance,setBalance]=useState(0);
  const [pendingBalance,setPendingBalance]=useState(0);
  const [guaranteeMoney,setGuaranteeMoney]=useState(0);
  const [requests,setRequests]=useState<any[]>([]);

  const [showModal,setShowModal]=useState(false);

  const [amount,setAmount]=useState("");
  const [withdrawType,setWithdrawType]=useState("Wallet Balance");
  const [accountDetails,setAccountDetails]=useState("");
  const [message,setMessage]=useState("");
  const [transactionPassword,setTransactionPassword]=useState("");

  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [sending,setSending]=useState(false);


  const load = useCallback(async()=>{
    try{
      const r = await apiFetch("/api/withdrawals", { cache:"no-store" });
      const d = await r.json();

      if(!r.ok){
        setError(d.error || "Unable to load withdrawal data.");
        return;
      }

      setBalance(Number(d.balance || 0));
      setPendingBalance(Number(d.pendingBalance || 0));
      setGuaranteeMoney(Number(d.guaranteeMoney || 0));
      setRequests(d.requests || []);
    }catch{
      setError("Unable to load withdrawal data.");
    }
  }, []);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });


  const selectedBalance =
    withdrawType === "Guarantee Money"
      ? guaranteeMoney
      : balance;


  const sendRequest=async()=>{

    setError("");
    setSuccess("");

    const value=Number(amount);


    if(!value || value<=0){

      setError(
        "Please enter a valid withdrawal amount."
      );

      return;

    }


    if(value>selectedBalance){

      setError(
        `Insufficient ${withdrawType.toLowerCase()}.`
      );

      return;

    }


    if(!accountDetails.trim()){

      setError(
        "Please enter your account details."
      );

      return;

    }


    if(!transactionPassword.trim()){

      setError(
        "Please enter your transaction password."
      );

      return;

    }


    setSending(true);


    try{

      const r=await apiFetch(
        "/api/withdrawals",
        {

          method:"POST",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({

            amount:value,

            withdrawType,

            accountDetails:
              accountDetails.trim(),

            message:
              message.trim(),

            transactionPassword:
              transactionPassword.trim()

          })

        }
      );


      const d=await r.json();


      if(!r.ok){

        setError(
          d.error ||
          "Unable to send withdrawal request."
        );

        setSending(false);

        return;

      }


      setSuccess(
        "Withdrawal request sent successfully."
      );


      setShowModal(false);

      setAmount("");
      setAccountDetails("");
      setMessage("");
      setTransactionPassword("");

      await load();

    }catch{

      setError(
        "Unable to send withdrawal request."
      );

    }


    setSending(false);

  };


  return(

    <UserShell>

      <div className="topbar">

        <div>

          <span className="eyebrow">
            Seller Finance
          </span>

          <h1>
            Withdrawal
          </h1>

        </div>

      </div>


      {error && (

        <div className="form-error">
          {error}
        </div>

      )}


      {success && (

        <div className="info-banner">
          {success}
          {" "}
          Please contact{" "}
          <Link href="/support" style={{textDecoration:"underline"}}>
            Customer Support
          </Link>
          {" "}if you have any questions.
        </div>

      )}


      <section className="panel">


        <div className="stat-grid dashboard-stats">


          <div className="stat">

            <span>
              Pending Balance
            </span>

            <strong>
              ${pendingBalance.toFixed(2)}
            </strong>

            <small>
              Orders still in progress
            </small>

          </div>


          <div className="stat">

            <span>
              Wallet Balance
            </span>

            <strong>
              ${balance.toFixed(2)}
            </strong>

            <small>
              Available working balance
            </small>

          </div>


          <div className="stat">

            <span>
              Guarantee Money
            </span>

            <strong>
              ${guaranteeMoney.toFixed(2)}
            </strong>

            <small>
              Account security amount
            </small>

          </div>


        </div>


        <div
          className="panel-head"
          style={{
            marginTop:"28px"
          }}
        >

          <div>

            <span className="eyebrow">
              Seller Wallet
            </span>

            <h2>
              Request a Withdrawal
            </h2>

            <p>
              Submit a withdrawal request from
              your eligible balance.
            </p>

          </div>


       <button
  type="button"
  className="btn"
  onClick={() => {
    setError("");
    setSuccess("");
    setAmount("");
    setAccountDetails("");
    setMessage("");
    setTransactionPassword("");
    setWithdrawType("Wallet Balance");
    setShowModal(true);
  }}
>
  Send Withdrawal Request
</button>

        </div>


      </section>


      <section className="panel">


        <div className="panel-head">

          <div>

            <span className="eyebrow">
              Transaction History
            </span>

            <h2>
              Withdrawal Request History
            </h2>

          </div>


          <span className="admin-chip">
            {requests.length} Requests
          </span>

        </div>


        {requests.length===0 ? (

          <div className="empty-state">
            No withdrawal requests yet.
          </div>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>

                  <th>
                    Date
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Message
                  </th>

                </tr>

              </thead>


              <tbody>

                {requests.map(
                  (item:any)=>(

                    <tr key={item.id}>

                      <td>
                        {item.createdAt
                          ? new Date(
                              item.createdAt
                            ).toLocaleDateString()
                          : "-"
                        }
                      </td>


                      <td>

                        <strong>
                          ${Number(
                            item.amount || 0
                          ).toFixed(2)}
                        </strong>

                      </td>


                      <td>
                        {item.withdrawType}
                      </td>


                      <td>

                        <span
                          className={`status ${String(
                            item.status || ""
                          ).toLowerCase()}`}
                        >
                          {item.status}
                        </span>

                      </td>


                      <td>
                        {item.message || "-"}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {showModal && (

     <div
  className="modal-backdrop"
  style={{
    position:"fixed",
    inset:0,
    zIndex:99999,
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    background:"rgba(0,0,0,0.75)",
    padding:"20px"
  }}
>

        <div
  className="modal"
  style={{
    width:"100%",
    maxWidth:"620px",
    background:"#101522",
    border:"1px solid rgba(255,255,255,0.15)",
    borderRadius:"18px",
    padding:"28px",
    boxShadow:"0 25px 80px rgba(0,0,0,0.5)"
  }}
>

            <div className="panel-head">

              <div>

                <span className="eyebrow">
                  Seller Wallet
                </span>

                <h2>
                  Send a Withdrawal Request
                </h2>

              </div>


              <button
                className="table-btn"
                onClick={()=>
                  setShowModal(false)
                }
              >
                ✕
              </button>

            </div>


            <p className="hint">

              Available{" "}
              {withdrawType.toLowerCase()}:

              {" "}

              <strong>
                ${selectedBalance.toFixed(2)}
              </strong>

            </p>


            {error && (

              <div
                className="form-error"
                style={{
                  marginTop:"12px",
                  marginBottom:"4px"
                }}
              >
                {error}
              </div>

            )}


            <div className="form-grid">


              <label>

                Amount

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={e=>
                    setAmount(
                      e.target.value
                    )
                  }
                  placeholder="Enter amount"
                />

              </label>


              <label>

                Withdrawal Type

                <select
                  value={withdrawType}
                  onChange={e=>{

                    setWithdrawType(
                      e.target.value
                    );

                    setAmount("");

                  }}
                >

                  <option value="Wallet Balance">
                    Wallet Balance
                  </option>

                  <option value="Guarantee Money">
                    Guarantee Money
                  </option>

                </select>

              </label>


              <label>

                Account Details

                <textarea
                  value={accountDetails}
                  onChange={e=>
                    setAccountDetails(
                      e.target.value
                    )
                  }
                  placeholder="Enter bank/account details"
                  rows={4}
                />

              </label>


              <label>

                Message

                <textarea
                  value={message}
                  onChange={e=>
                    setMessage(
                      e.target.value
                    )
                  }
                  placeholder="Optional message"
                  rows={4}
                />

              </label>


              <label>

                Transaction Password

                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={transactionPassword}
                  onChange={e=>
                    setTransactionPassword(
                      e.target.value
                    )
                  }
                  placeholder="Enter your 6-digit transaction password"
                />

              </label>


            </div>


            <div
              className="order-actions"
              style={{
                marginTop:"20px"
              }}
            >

              <button
                className="table-btn"
                onClick={()=>
                  setShowModal(false)
                }
              >
                Close
              </button>


              <button
                className="btn"
                onClick={sendRequest}
                disabled={sending}
              >

                {sending
                  ? "Sending..."
                  : "Send Request"
                }

              </button>

            </div>


          </div>

        </div>

      )}

    </UserShell>

  );

}