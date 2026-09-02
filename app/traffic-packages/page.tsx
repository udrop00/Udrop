"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { UserShell } from "../components";
import { apiFetch, apiMe, useRealtimeStream } from "../lib";

function PackageBadge({
  type
}:{
  type:string
}){
  const key=type.toLowerCase();
  const isSilver=key.includes("silver");
  const isDiamond=key.includes("diamond");
  const mainColor=isSilver ? "#d8e3ef" : isDiamond ? "#218cff" : "#e6b83f";
  const secondColor=isSilver ? "#7ea6d9" : isDiamond ? "#0d51c7" : "#8d6614";

  return(
    <div style={{ width:"118px", height:"118px", position:"relative", display:"grid", placeItems:"center", flex:"0 0 auto" }}>
      <div style={{ position:"absolute", bottom:"4px", left:"24px", width:"30px", height:"58px", background:secondColor, clipPath:"polygon(0 0,100% 0,80% 100%,50% 78%,20% 100%)", transform:"rotate(8deg)" }} />
      <div style={{ position:"absolute", bottom:"4px", right:"24px", width:"30px", height:"58px", background:mainColor, clipPath:"polygon(0 0,100% 0,80% 100%,50% 78%,20% 100%)", transform:"rotate(-8deg)" }} />
      <div style={{ width:"88px", height:"88px", borderRadius:"50%", background:`linear-gradient(145deg,${mainColor},${secondColor})`, display:"grid", placeItems:"center", position:"relative", zIndex:2, boxShadow:`0 12px 35px ${secondColor}55`, border:"6px solid rgba(255,255,255,.14)" }}>
        <div style={{ width:"58px", height:"58px", borderRadius:"50%", background:"rgba(4,14,32,.82)", display:"grid", placeItems:"center", border:`3px solid ${mainColor}` }}>
          <span style={{ fontSize:"29px", fontWeight:900, color:mainColor, lineHeight:1 }}>
            {isSilver ? "◆" : isDiamond ? "★" : "●"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function TrafficPackages(){

  const [packages,setPackages]=useState<any[]>([]);
  const [currentUserPackage,setCurrentUserPackage]=useState("");
  const [message,setMessage]=useState("");
  const [messageOk,setMessageOk]=useState(false);
  const [requesting,setRequesting]=useState("");

  const load = useCallback(async()=>{
    try {
      const [pkgRes, meRes] = await Promise.all([
        apiFetch("/api/packages", { cache:"no-store" }),
        apiMe()
      ]);
      const pkgData = await pkgRes.json();
      setPackages(pkgData.packages || []);
      setCurrentUserPackage(meRes?.user?.currentPackageName || "");
    } catch {}
  }, []);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });



  const requestPlan=async(id:string)=>{

    setMessage("");
    setRequesting(id);


    try{

      const r=await apiFetch(
        "/api/package-request",
        {
          method:"POST",

          headers:{
            "Content-Type":"application/json"
          },

          body:JSON.stringify({
            packageId:id
          })
        }
      );


      const d=await r.json();


      setMessage(
        r.ok
          ? "Package request submitted successfully. Please wait for admin approval. If you have any questions, feel free to contact customer support."
          : d.error || "Request failed."
      );

      setMessageOk(r.ok);

    }catch{

      setMessage(
        "Unable to submit package request."
      );

      setMessageOk(false);

    }finally{

      setRequesting("");

    }

  };



  const featuresFor=(p:any)=>[

    `${p.productLimit} Product Upload Limit`,

    `Max profit ${p.commission}%`,

    "Seller Dashboard",

    "Order Management",

    "Order Tracking",

    "Withdrawal Requests"

  ];



  return(

    <UserShell>


      <div
        style={{
          width:"100%",
          paddingBottom:"35px"
        }}
      >


        <div
          style={{
            textAlign:"center",
            padding:"18px 15px 35px"
          }}
        >

          <div
            style={{
              fontSize:"30px",
              marginBottom:"8px"
            }}
          >
            ♛
          </div>


          <span className="eyebrow">
            SELLER MEMBERSHIP
          </span>


          <h1
            style={{
              fontSize:"38px",
              margin:"8px 0 8px"
            }}
          >
            Premium Packages for Sellers
          </h1>


          <p
            style={{
              maxWidth:"650px",
              margin:"0 auto",
              opacity:.68,
              fontSize:"15px"
            }}
          >
            Choose the right package for your store.
            Every package request requires admin approval.
          </p>

        </div>



        {message && (

          <div
            className="info-banner"
            style={{
              maxWidth:"1180px",
              margin:"0 auto 22px"
            }}
          >
            {message}
            {" "}
            {messageOk && (
              <Link href="/support" style={{textDecoration:"underline"}}>
                Contact Customer Support
              </Link>
            )}
          </div>

        )}



        <div
          style={{
            maxWidth:"1180px",
            margin:"0 auto",
            display:"grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap:"22px"
          }}
        >


          {packages.map((p:any)=>{

            const name=
              String(p.name || "");

            const key=
              name.toLowerCase();

            const isSilver=
              key.includes("silver");

            const isDiamond=
              key.includes("diamond");

            const accent=
              isSilver
                ? "#56a8ff"
                : isDiamond
                ? "#238cff"
                : "#e1b13e";

            const price=
              Number(p.price || 0);


            return(

              <section
                key={p.id}
                style={{
                  minHeight:"650px",
                  borderRadius:"20px",
                  padding:"27px",
                  position:"relative",
                  overflow:"hidden",
                  display:"flex",
                  flexDirection:"column",
                  border:
                    `1px solid ${accent}88`,
                  background:
                    isSilver
                      ? "linear-gradient(160deg,#142033 0%,#09121f 72%)"
                      : isDiamond
                      ? "linear-gradient(160deg,#10203c 0%,#07111f 72%)"
                      : "linear-gradient(160deg,#201c12 0%,#0c111a 72%)",
                  boxShadow:
                    `0 20px 55px ${accent}18`
                }}
              >


                <div
                  style={{
                    position:"absolute",
                    width:"220px",
                    height:"220px",
                    borderRadius:"50%",
                    background:accent,
                    filter:"blur(100px)",
                    opacity:.10,
                    right:"-65px",
                    top:"-55px",
                    pointerEvents:"none"
                  }}
                />


                <div
                  style={{
                    display:"flex",
                    justifyContent:"space-between",
                    alignItems:"flex-start",
                    gap:"15px"
                  }}
                >

                  <div>

                    <span
                      style={{
                        display:"block",
                        color:accent,
                        fontWeight:800,
                        fontSize:"19px",
                        marginBottom:"19px"
                      }}
                    >
                      {name} Shop
                    </span>


                    <strong
                      style={{
                        display:"block",
                        fontSize:"38px",
                        lineHeight:1,
                        marginBottom:"16px",
                        color:"#f4f8ff"
                      }}
                    >
                      {price===0
                        ? "Free"
                        : `$${price.toLocaleString()}`
                      }
                    </strong>


                    <p
                      style={{
                        opacity:.62,
                        maxWidth:"190px",
                        lineHeight:1.5,
                        margin:0
                      }}
                    >
                      {isSilver
                        ? "Perfect for getting started."
                        : isDiamond
                        ? "For advanced high-volume sellers."
                        : "Best for growing sellers."
                      }
                    </p>

                  </div>


                  <PackageBadge
                    type={name}
                  />

                </div>



                <div
                  style={{
                    height:"1px",
                    background:
                      "rgba(255,255,255,.12)",
                    margin:"27px 0"
                  }}
                />



                <div
                  style={{
                    display:"grid",
                    gap:"18px"
                  }}
                >

                  {featuresFor(p).map(
                    (feature,index)=>(

                      <div
                        key={feature}
                        style={{
                          display:"flex",
                          alignItems:"center",
                          gap:"12px",
                          fontSize:"15px"
                        }}
                      >

                        <span
                          style={{
                            width:"24px",
                            height:"24px",
                            borderRadius:"50%",
                            display:"grid",
                            placeItems:"center",
                            background:
                              `${accent}25`,
                            color:accent,
                            border:
                              `1px solid ${accent}66`,
                            flex:"0 0 auto",
                            fontSize:"13px",
                            fontWeight:900
                          }}
                        >
                          ✓
                        </span>


                        <span>

                          {index===0 ? (

                            <>
                              <b
                                style={{
                                  color:accent
                                }}
                              >
                                {p.productLimit}
                              </b>
                              {" "}
                              Product Upload Limit
                            </>

                          ) : index===1 ? (

                            <>
                              Max profit{" "}
                              <b
                                style={{
                                  color:accent
                                }}
                              >
                                {p.commission}%
                              </b>
                            </>

                          ) : (

                            feature

                          )}

                        </span>

                      </div>

                    )
                  )}

                </div>



                <div
                  style={{
                    marginTop:"auto",
                    paddingTop:"32px"
                  }}
                >

                  {!isSilver && (
  <button
    type="button"
    disabled={requesting===p.id}
    onClick={()=>
      requestPlan(p.id)
    }
    style={{
      width:"100%",
      height:"56px",
      borderRadius:"11px",
      cursor:
        requesting===p.id
          ? "wait"
          : "pointer",
      border:
        `1px solid ${accent}`,
      background:
        `linear-gradient(135deg,${accent},${accent}bb)`,
      color:"#07111f",
      fontWeight:900,
      fontSize:"15px",
      boxShadow:
        `0 10px 28px ${accent}26`
    }}
  >
    {requesting===p.id
      ? "Sending Request..."
      : price===0
      ? "Request Free Plan →"
      : "Request This Plan →"
    }
  </button>
)}

{isSilver && (
  <div
    style={{
      width:"100%",
      height:"56px",
      borderRadius:"11px",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      border:"1px solid #35d39a",
      color:"#35d39a",
      fontWeight:900
    }}
  >
    ✓ Default Active Plan
  </div>
)}

                </div>


              </section>

            );

          })}


        </div>



        <div
          style={{
            maxWidth:"1180px",
            margin:"28px auto 0",
            border:
              "1px solid rgba(115,160,215,.20)",
            borderRadius:"18px",
            background:
              "linear-gradient(135deg,rgba(15,29,50,.94),rgba(9,17,31,.96))",
            padding:"22px",
            display:"grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(170px,1fr))",
            gap:"15px"
          }}
        >


          {[
            ["🛡","Secure & Safe","Protected seller account"],
            ["✓","Admin Controlled","Plans require approval"],
            ["◉","Priority Support","Seller support access"],
            ["🔒","Account Protection","Freeze/closure protection"],
            ["$","Guarantee Money","Admin-controlled security"]
          ].map(item=>(

            <div
              key={item[1]}
              style={{
                display:"flex",
                gap:"11px",
                alignItems:"center",
                padding:"8px"
              }}
            >

              <div
                style={{
                  width:"40px",
                  height:"40px",
                  borderRadius:"12px",
                  display:"grid",
                  placeItems:"center",
                  background:
                    "rgba(35,140,255,.12)",
                  border:
                    "1px solid rgba(35,140,255,.28)"
                }}
              >
                {item[0]}
              </div>


              <div>

                <b
                  style={{
                    display:"block",
                    fontSize:"13px"
                  }}
                >
                  {item[1]}
                </b>

                <small
                  style={{
                    opacity:.56
                  }}
                >
                  {item[2]}
                </small>

              </div>

            </div>

          ))}


        </div>



        <p
          style={{
            textAlign:"center",
            opacity:.58,
            marginTop:"22px",
            fontSize:"13px"
          }}
        >
          🔒 All package requests are subject to admin approval.
        </p>


      </div>


    </UserShell>

  );

}