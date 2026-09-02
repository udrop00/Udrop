"use client";

import { useEffect, useState, useCallback } from "react";
import { UserShell } from "../components";
import { apiFetch, apiMe, useRealtimeStream } from "../lib";


export default function MyStore(){

  const [products,setProducts] = useState<any[]>([]);
  const [loading,setLoading] = useState(true);
  const [limit,setLimit] = useState(0);
  const [packageName,setPackageName] = useState("");
  const [commissionRate,setCommissionRate] = useState(0);
  const [selectedProduct,setSelectedProduct] = useState<any|null>(null);


  const load = useCallback(async()=>{
    try {
      const [prodRes, meRes] = await Promise.all([
        apiFetch("/api/seller-products", { cache:"no-store" }),
        apiMe()
      ]);

      const d = await prodRes.json();
      setProducts(d.products || []);

      const user = meRes?.user;
      setLimit(Number(user?.productLimit || 0));
      setPackageName(user?.currentPackageName || "");
      setCommissionRate(Number(user?.commissionRate || 0));
    } catch {} finally {
      setLoading(false);
    }
  }, []);



  const removeProduct = async(id:string)=>{

    if(!confirm("Remove this product from your store?")) return;


    const r = await apiFetch(
      "/api/seller-products",
      {
        method:"DELETE",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          id
        })
      }
    );


    if(r.ok){
      load();
    }

  };



  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });




  return (

    <UserShell>


      <div className="topbar">

        <div>

          <span className="eyebrow">
            Seller Store
          </span>


          <h1>
            My Store Products
          </h1>



          <div
            className="panel"
            style={{
              marginTop:"20px"
            }}
          >

            <p>
              Active Package: {packageName || "No Package"}
            </p>


            <p>
              Products Added: {products.length} / {limit}
            </p>


            <p>
              Remaining Slots: {Math.max(limit-products.length,0)}
            </p>


          </div>


        </div>


      </div>



      {
        loading ? (

          <section className="panel">
            Loading products...
          </section>


        ) : products.length===0 ? (

          <section className="panel empty-state">
            No products added to your store yet.
          </section>


        ) : (


          <div className="product-grid">


            {
              products.map((item:any)=>{

                const p=item.product;


                if(!p) return null;


                return (

                  <div
                    className="product-card"
                    key={item.id}
                    onClick={()=>setSelectedProduct(item)}
                    style={{cursor:"pointer"}}
                  >


                    {
                      p.image && (

                        <img
                          src={p.image}
                          alt={p.name}
                        />

                      )
                    }


                    <div className="product-body">


                      <h3>
                        {p.name}
                      </h3>


                      <small>
                        {p.category || "General"}
                      </small>



                      <div style={{marginTop:"10px"}}>

                        <strong>
                          ${Number(p.price).toLocaleString()}
                        </strong>

                      </div>



                      <div style={{marginTop:"8px"}}>

                        <small>
                          Added:{" "}
                          {new Date(
                            item.addedDate
                          ).toLocaleDateString()}
                        </small>

                      </div>



                      <div style={{marginTop:"10px"}}>


                        <span className="status active">
                          {item.status}
                        </span>



                       


                      </div>


                    </div>


                  </div>

                );

              })
            }


          </div>

        )

      }


      {selectedProduct && (

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
          onClick={()=>setSelectedProduct(null)}
        >

          <div
            className="modal"
            style={{
              width:"100%",
              maxWidth:"520px",
              background:"#101522",
              border:"1px solid rgba(255,255,255,0.15)",
              borderRadius:"18px",
              padding:"28px",
              boxShadow:"0 25px 80px rgba(0,0,0,0.5)"
            }}
            onClick={(e)=>e.stopPropagation()}
          >

            <div className="panel-head">

              <div>
                <span className="eyebrow">
                  Product Details
                </span>
                <h2>
                  {selectedProduct.product?.name}
                </h2>
              </div>

              <button
                className="table-btn"
                onClick={()=>setSelectedProduct(null)}
              >
                ✕
              </button>

            </div>

            {selectedProduct.product?.image && (
              <img
                src={selectedProduct.product.image}
                alt={selectedProduct.product.name}
                style={{
                  width:"100%",
                  maxHeight:"260px",
                  objectFit:"contain",
                  borderRadius:"12px",
                  background:"rgba(255,255,255,0.03)",
                  marginTop:"14px"
                }}
              />
            )}

            <div
              style={{
                marginTop:"18px",
                display:"flex",
                gap:"14px",
                flexWrap:"wrap"
              }}
            >

              <div
                style={{
                  flex:"1 1 160px",
                  background:"rgba(255,255,255,0.04)",
                  borderRadius:"12px",
                  padding:"14px 16px"
                }}
              >
                <span className="eyebrow">Product Price</span>
                <p style={{marginTop:"6px"}}>
                  <strong style={{fontSize:"22px"}}>
                    ${Number(selectedProduct.product?.price || 0).toLocaleString()}
                  </strong>
                </p>
              </div>

              <div
                style={{
                  flex:"1 1 160px",
                  background:"rgba(33,140,255,0.08)",
                  border:"1px solid rgba(33,140,255,0.25)",
                  borderRadius:"12px",
                  padding:"14px 16px"
                }}
              >
                <span className="eyebrow">Your Commission ({commissionRate}%)</span>
                <p style={{marginTop:"6px"}}>
                  <strong style={{fontSize:"22px"}}>
                    $
                    {(
                      (Number(selectedProduct.product?.price || 0) * commissionRate) / 100
                    ).toLocaleString(undefined,{maximumFractionDigits:2})}
                  </strong>
                  {" "}
                  <small>per sale</small>
                </p>
              </div>

            </div>

            <div className="form-grid" style={{marginTop:"16px"}}>

              <div>
                <span className="eyebrow">Product Code</span>
                <p style={{marginTop:"4px"}}>
                  {selectedProduct.product?.sku || "-"}
                </p>
              </div>

              <div>
                <span className="eyebrow">Status</span>
                <p style={{marginTop:"4px"}}>
                  <span className="status active">
                    {selectedProduct.status}
                  </span>
                </p>
              </div>

              <div>
                <span className="eyebrow">Added On</span>
                <p style={{marginTop:"4px"}}>
                  {new Date(selectedProduct.addedDate).toLocaleDateString()}
                </p>
              </div>

              {Number(selectedProduct.product?.stock) > 0 && (
                <div>
                  <span className="eyebrow">Stock Available</span>
                  <p style={{marginTop:"4px"}}>
                    {selectedProduct.product.stock}
                  </p>
                </div>
              )}

            </div>

            {selectedProduct.product?.description && (
              <div style={{marginTop:"16px"}}>
                <span className="eyebrow">Description</span>
                <p style={{marginTop:"4px"}}>
                  {selectedProduct.product.description}
                </p>
              </div>
            )}

            <div
              className="order-actions"
              style={{marginTop:"20px"}}
            >
              <button
                className="table-btn"
                onClick={()=>setSelectedProduct(null)}
              >
                Close
              </button>
            </div>

          </div>

        </div>

      )}


    </UserShell>

  );

}