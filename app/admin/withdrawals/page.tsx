"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "../../components";
import { apiFetch, useRealtimeStream } from "../../lib";


export default function AdminWithdrawals(){

  const [requests,setRequests] =
    useState<any[]>([]);

  const [search, setSearch] =
    useState("");

  const [loading,setLoading] =
    useState(true);

  const [error,setError] =
    useState("");

  const [actionTarget,setActionTarget] =
    useState<{id:string; action:"approved"|"rejected"} | null>(null);

  const [actionMessage,setActionMessage] =
    useState("");

  const [processing,setProcessing] =
    useState(false);


  const loadRequests = useCallback(async()=>{
    try{
      setError("");
      const r = await apiFetch("/api/withdrawals", { cache:"no-store" });
      const d = await r.json();

      if(!r.ok){
        setError(d.error || "Unable to load withdrawal requests.");
        return;
      }

      setRequests(Array.isArray(d.requests) ? d.requests : []);
    }catch{
      setError("Unable to load withdrawal requests.");
    }finally{
      setLoading(false);
    }
  }, []);


  useEffect(()=>{
    loadRequests();
  },[loadRequests]);

  useRealtimeStream(()=>{
    loadRequests();
  });


  const openActionModal = (
    id:string,
    action:"approved" | "rejected"
  )=>{

    setActionTarget({ id, action });

    setActionMessage(
      action === "approved"
        ? "Your withdrawal request has been successfully approved."
        : ""
    );

    setError("");

  };


  const closeActionModal = ()=>{
    setActionTarget(null);
    setActionMessage("");
  };


  const confirmAction = async()=>{

    if(!actionTarget) return;


    if(
      actionTarget.action === "rejected" &&
      !actionMessage.trim()
    ){

      setError(
        "Please enter a rejection reason."
      );

      return;

    }


    try{

      setError("");
      setProcessing(true);


      const r = await apiFetch(
        "/api/withdrawals",
        {

          method:"PATCH",

          headers:{
            "Content-Type":
              "application/json"
          },

          body:JSON.stringify({
            id: actionTarget.id,
            action: actionTarget.action,
            message: actionMessage.trim()
          })

        }
      );


      const d = await r.json();


      if(!r.ok){

        setError(
          d.error ||
          "Unable to process withdrawal request."
        );

        return;

      }


      closeActionModal();

      await loadRequests();


    }catch{

      setError(
        "Something went wrong while processing the request."
      );

    }finally{

      setProcessing(false);

    }

  };


  return(

    <AdminShell>


      <div className="topbar">

        <div>

          <span className="eyebrow">
            Finance Management
          </span>

          <h1>
            Withdrawal Requests
          </h1>

        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, name, account details..."
            style={{ minWidth: "300px" }}
          />
        </div>

      </div>


      {error && (

        <div className="info-banner">
          {error}
        </div>

      )}


      <section className="panel">


        <div className="panel-head">

          <div>

            <span className="eyebrow">
              Seller Withdrawals
            </span>

            <h2>
              Withdrawal Requests
            </h2>

          </div>


          <strong>
            {requests.filter((r: any) => {
              const q = search.toLowerCase();
              return (
                (r.customerName || "").toLowerCase().includes(q) ||
                (r.customerEmail || "").toLowerCase().includes(q) ||
                (r.accountDetails || "").toLowerCase().includes(q) ||
                (r.message || "").toLowerCase().includes(q) ||
                (r.status || "").toLowerCase().includes(q)
              );
            }).length} Requests
          </strong>

        </div>


        {loading ? (

          <div className="empty-state">
            Loading withdrawal requests...
          </div>

        ) : requests.filter((r: any) => {
          const q = search.toLowerCase();
          return (
            (r.customerName || "").toLowerCase().includes(q) ||
            (r.customerEmail || "").toLowerCase().includes(q) ||
            (r.accountDetails || "").toLowerCase().includes(q) ||
            (r.message || "").toLowerCase().includes(q) ||
            (r.status || "").toLowerCase().includes(q)
          );
        }).length === 0 ? (

          <div className="empty-state">
            {search ? "No matching withdrawal requests found." : "No withdrawal requests yet."}
          </div>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>

                  <th>
                    Customer
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Account Details
                  </th>

                  <th>
                    Message
                  </th>

                  <th>
                    Requested
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Action
                  </th>

                </tr>

              </thead>


              <tbody>

                {requests.filter((r: any) => {
                  const q = search.toLowerCase();
                  return (
                    (r.customerName || "").toLowerCase().includes(q) ||
                    (r.customerEmail || "").toLowerCase().includes(q) ||
                    (r.accountDetails || "").toLowerCase().includes(q) ||
                    (r.message || "").toLowerCase().includes(q) ||
                    (r.status || "").toLowerCase().includes(q)
                  );
                }).map(
                  (request:any)=>(

                    <tr key={request.id}>


                      <td>

                        <strong>
                          {request.customerName || "-"}
                        </strong>

                        <br />

                        <small>
                          {request.email || "-"}
                        </small>

                      </td>


                      <td>

                        <strong>
                          ${Number(
                            request.amount || 0
                          ).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits:2
                            }
                          )}
                        </strong>

                      </td>


                      <td>
                        {request.withdrawType || "-"}
                      </td>


                      <td>
                        {request.accountDetails || "-"}
                      </td>


                      <td>
                        {request.message || "-"}
                      </td>


                      <td>

                        {request.createdAt
                          ? new Date(
                              request.createdAt
                            ).toLocaleDateString()
                          : "-"
                        }

                      </td>


                      <td>

                        <span
                          className={`status ${
                            String(
                              request.status || "Pending"
                            ).toLowerCase()
                          }`}
                        >
                          {request.status || "Pending"}
                        </span>

                      </td>


                      <td>

                        {request.status === "Pending" ? (

                          <div
                            style={{
                              display:"flex",
                              gap:"8px"
                            }}
                          >

                            <button
                              type="button"
                              className="btn"
                              onClick={()=>
                                openActionModal(
                                  request.id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>


                            <button
                              type="button"
                              className="table-btn danger-btn"
                              onClick={()=>
                                openActionModal(
                                  request.id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
                            </button>

                          </div>

                        ) : (

                          <span className="hint">
                            Processed
                          </span>

                        )}

                      </td>


                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {actionTarget && (

        <div
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
          onClick={closeActionModal}
        >

          <div
            style={{
              width:"100%",
              maxWidth:"480px",
              background:"#101522",
              border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:"18px",
              padding:"28px",
              boxShadow:"0 25px 80px rgba(0,0,0,0.5)"
            }}
            onClick={(e)=>e.stopPropagation()}
          >

            <span className="eyebrow">
              {actionTarget.action === "approved"
                ? "Approve Withdrawal"
                : "Reject Withdrawal"}
            </span>

            <h2 style={{marginTop:"6px"}}>
              {actionTarget.action === "approved"
                ? "Confirm approval"
                : "Provide a rejection reason"}
            </h2>

            <p className="hint" style={{marginTop:"6px"}}>
              {actionTarget.action === "approved"
                ? "This message will be sent to the seller. You can edit it if you'd like to add a custom note."
                : "This reason will be sent to the seller explaining why the request was rejected."}
            </p>

            {error && (

              <div
                className="form-error"
                style={{marginTop:"12px"}}
              >
                {error}
              </div>

            )}

            <label style={{display:"block", marginTop:"14px"}}>

              Message to seller

              <textarea
                rows={4}
                value={actionMessage}
                onChange={e=>setActionMessage(e.target.value)}
                placeholder={
                  actionTarget.action === "rejected"
                    ? "Enter the reason for rejection..."
                    : "Optional custom message..."
                }
              />

            </label>

            <div
              className="order-actions"
              style={{marginTop:"20px"}}
            >

              <button
                type="button"
                className="table-btn"
                onClick={closeActionModal}
                disabled={processing}
              >
                Cancel
              </button>

              <button
                type="button"
                className={
                  actionTarget.action === "rejected"
                    ? "table-btn danger-btn"
                    : "btn"
                }
                onClick={confirmAction}
                disabled={processing}
              >
                {processing
                  ? "Processing..."
                  : actionTarget.action === "approved"
                    ? "Confirm Approve"
                    : "Confirm Reject"
                }
              </button>

            </div>

          </div>

        </div>

      )}

    </AdminShell>

  );

}