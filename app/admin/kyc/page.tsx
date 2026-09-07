"use client";

import { useEffect, useState, useCallback } from "react";
import { apiFetch, useRealtimeStream } from "../../lib";
import { AdminShell } from "../../components";


export default function AdminKyc(){

  const [applications,setApplications] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [tab,setTab] = useState("pending");
  const [preview,setPreview] = useState("");
  const [expanded,setExpanded] = useState<string>("");
  const [documentsById,setDocumentsById] = useState<Record<string,any[]>>({});
  const [loadingDocsFor,setLoadingDocsFor] = useState("");

  const load = useCallback(async()=>{
    try {
      const r = await apiFetch(`/api/admin/kyc?status=${tab}`, { cache:"no-store" });
      const d = await r.json();
      setApplications(d.applications || []);
    } catch {} finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });




  const toggleDocuments = async(userId:string)=>{

    if(expanded===userId){
      setExpanded("");
      return;
    }

    setExpanded(userId);

    if(documentsById[userId]) return;

    setLoadingDocsFor(userId);

    try {
      const r = await apiFetch(`/api/admin/kyc?userId=${userId}`, { cache:"no-store" });
      const d = await r.json();
      setDocumentsById(prev=>({ ...prev, [userId]: d.documents || [] }));
    } catch {} finally {
      setLoadingDocsFor("");
    }

  };


  const updateKyc = async(
    userId:string,
    action:string
  )=>{


    await apiFetch("/api/admin/kyc",{

      method:"PATCH",

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        userId,
        action
      })

    });


    load();

  };



  if(loading){

    return <div className="loading-screen">
      Loading KYC Applications...
    </div>

  }



  return (

    <AdminShell>

    <main className="admin-page">


      <h1>
        KYC Verification
      </h1>


      <p>
        Review seller documents before account activation.
      </p>
    <div style={{
  display:"flex",
  gap:10,
  margin:"25px 0"
}}>

<button
  className={tab==="pending" ? "btn" : "btn btn-ghost"}
  onClick={()=>setTab("pending")}
>
  Pending
</button>


<button
  className={tab==="approved" ? "btn" : "btn btn-ghost"}
  onClick={()=>setTab("approved")}
>
  Approved
</button>


<button
  className={tab==="rejected" ? "btn" : "btn btn-ghost"}
  onClick={()=>setTab("rejected")}
>
  Rejected
</button>

</div>


      <div className="kyc-admin-grid">


      {
        applications.map((u)=>(
          
          <div
            className="kyc-admin-card"
            key={u.id}
          >

            <div className="kyc-seller-info">

  <h2>
    {u.shopName || "No Shop Name"}
  </h2>


  <p>
    <b>Seller:</b> {u.name}
  </p>


  <p>
    <b>Email:</b> {u.email}
  </p>

</div>


           <span
  className={
    u.kycStatus === "Approved"
      ? "kyc-status-approved"
      : u.kycStatus === "Rejected"
      ? "kyc-status-rejected"
      : "kyc-status-pending"
  }
>
  Status: {u.kycStatus}
</span>



            <button
              className="btn btn-small btn-ghost"
              style={{marginTop:12}}
              onClick={()=>toggleDocuments(u.id)}
            >
              {expanded===u.id ? "Hide Documents" : `View Documents (${u.documentCount})`}
            </button>

            {
              expanded===u.id && (

                loadingDocsFor===u.id ? (

                  <p style={{marginTop:12}}>Loading documents...</p>

                ) : (

                  documentsById[u.id]?.map((doc:any,index:number)=>(

                    <div key={index}>

                      <h4>
                        {doc.certificateType}
                      </h4>


                      <div className="kyc-images">


    {
      doc.certificateFront &&

      <div className="kyc-document-card">

        <span>ID Front</span>

        <img
          src={doc.certificateFront}
          alt="Front"
          onClick={()=>setPreview(doc.certificateFront)}
        />

      </div>

    }



    {
      doc.certificateBack &&

      <div className="kyc-document-card">

        <span>ID Back</span>

        <img
          src={doc.certificateBack}
          alt="Back"
          onClick={()=>setPreview(doc.certificateBack)}
        />

      </div>

    }



    {
      doc.selfie &&

      <div className="kyc-document-card">

        <span>Selfie Verification</span>

        <img
          src={doc.selfie}
          alt="Selfie"
          onClick={()=>setPreview(doc.selfie)}
        />

      </div>

    }



    </div>


                    </div>

                  ))

                )

              )
            }


{tab==="pending" && (
            <div style={{
              display:"flex",
              gap:10,
              marginTop:20
            }}>


              <button
                className="btn"
                onClick={()=>
                  updateKyc(u.id,"approve")
                }
              >
                Approve
              </button>



              <button
                className="btn btn-danger"
                onClick={()=>
                  updateKyc(u.id,"reject")
                }
              >
                Reject
              </button>


            </div>

)}

          </div>

        ))
      }


      </div>


       </main>
    {
  preview && (

    <div
      onClick={()=>setPreview("")}
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(0,0,0,.85)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        zIndex:9999,
        cursor:"pointer"
      }}
    >

      <img
        src={preview}
        alt="Document Preview"
        style={{
          maxWidth:"85%",
          maxHeight:"85%",
          borderRadius:"20px",
          border:"1px solid rgba(255,255,255,.2)"
        }}
      />

    </div>

  )
}
    </AdminShell>

  );

}