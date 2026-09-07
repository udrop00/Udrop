"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { UserShell } from "../components";
import { apiFetch, apiMe } from "../lib";
import { DEFAULT_PRODUCTS } from "../lib/defaultProducts";


export default function Products() {

  const [products,setProducts] = useState<any[]>(DEFAULT_PRODUCTS);
  const [q,setQ] = useState("");

  const [storeProductIds,setStoreProductIds] = useState<Set<string>>(new Set());
  const [limit,setLimit] = useState(0);
  const [packageStatus,setPackageStatus] = useState("");
  const [packageName,setPackageName] = useState("");
  const [addingId,setAddingId] = useState("");
  const [autoAdding,setAutoAdding] = useState(false);
  const [message,setMessage] = useState("");



  const loadProducts = async()=>{
    try {
      const productsRes = await apiFetch(
        "/api/products",
        {
          cache:"no-store"
        }
      );
      const productsData = await productsRes.json();
      if (Array.isArray(productsData?.products) && productsData.products.length > 0) {
        setProducts(productsData.products);
      }
    } catch {}
  };


  const loadStore = useCallback(async()=>{

    try {
      const [meRes, storeRes] = await Promise.all([
        apiMe(),
        apiFetch("/api/seller-products", { cache:"no-store" })
      ]);

      const user = meRes?.user;
      setLimit(Number(user?.productLimit || 0));
      setPackageStatus(user?.packageStatus || "");
      setPackageName(user?.currentPackageName || user?.currentPackage || "");

      const d = await storeRes.json();
      setStoreProductIds(new Set((d.products || []).map((it:any)=>String(it.productId))));
    } catch {}

  }, []);


  const addToStore = async(productId:any)=>{

    if(addingId) return;

    setAddingId(String(productId));
    setMessage("");

    const r = await apiFetch(
      "/api/seller-products",
      {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ productId })
      }
    );

    const d = await r.json();

    if(!r.ok){
      setMessage(d.error || "Unable to add product to your store.");
      setAddingId("");
      return;
    }

    setStoreProductIds(prev => new Set(prev).add(String(productId)));
    setAddingId("");

  };


  const autoAddProducts = async()=>{
    if(autoAdding) return;
    setAutoAdding(true);
    setMessage("");

    try {
      const r = await apiFetch("/api/seller-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoAdd: true })
      });
      const d = await r.json();
      if (r.ok) {
        setMessage(d.message || "Products automatically added to your store!");
        await loadStore();
      } else {
        setMessage(d.error || "Unable to auto-add products.");
      }
    } catch {
      setMessage("Auto-add failed.");
    } finally {
      setAutoAdding(false);
    }
  };



 useEffect(()=>{

  

  loadProducts();
  loadStore();


},[loadStore]);








  const list = products.filter(p =>

    (p.status === "Active" || !p.status)

    &&

    (
      p.name +
      (p.category || "")
    )
    .toLowerCase()
    .includes(
      q.toLowerCase()
    )

  );




  return (

    <UserShell>


      <div className="topbar">

        <div>

          <span className="eyebrow">
            Marketplace
          </span>


          <h1>
            All Products
          </h1>

        </div>



        <input
          className="search"
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search products..."
        />


      </div>


      <div className="panel" style={{marginBottom:"20px",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
        <div>
          <p style={{margin:0,fontSize:"14px"}}>
            Active Package: <strong style={{color:"#38bdf8"}}>{packageName || "No Active Package"}</strong>
            {" · "}
            Products in Store: <strong>{storeProductIds.size} / {limit}</strong>
            {" · "}
            Remaining Slots: <strong style={{color: storeProductIds.size >= limit ? "#ef4444" : "#10b981"}}>{Math.max(limit - storeProductIds.size, 0)}</strong>
          </p>
        </div>

        <div className="action-btn-row" style={{display:"flex",gap:"10px",alignItems:"center"}}>
          <button
            className="btn btn-small"
            style={{
              background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
              border: "1px solid rgba(56, 189, 248, 0.4)",
              fontWeight: 700
            }}
            disabled={
              packageStatus !== "active" ||
              autoAdding ||
              storeProductIds.size >= limit
            }
            onClick={autoAddProducts}
          >
            {autoAdding ? "⚡ Auto Adding..." : "⚡ Auto Add Products"}
          </button>

          <Link
            href="/my-store"
            className="btn btn-small btn-ghost"
          >
            View My Store →
          </Link>
        </div>
      </div>

      {message && (
        <div className="info-banner">{message}</div>
      )}





      <div className="product-grid">


        {list.map(p=>(


          <div
            className="product-card"
            key={p.id}
          >



            <Link href={`/products/${p.id}`}>

              {p.image && (

                <img
                  src={p.image}
                  alt={p.name}
                />

              )}



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



                <small>
                  {p.stock > 0
                    ? `Stock Available: ${p.stock}`
                    : "Out of Stock"
                  }
                </small>



              </div>


            </Link>




          {
            storeProductIds.has(String(p.id)) ? (

              <button
                className="btn btn-small btn-ghost"
                style={{width:"100%",marginTop:"10px"}}
                disabled
              >
                ✓ In My Store
              </button>

            ) : (

              <button
                className="btn btn-small"
                style={{width:"100%",marginTop:"10px"}}
                disabled={
                  packageStatus !== "active" ||
                  addingId === String(p.id) ||
                  storeProductIds.size >= limit
                }
                onClick={()=>addToStore(p.id)}
              >
                {
                  packageStatus !== "active"
                    ? "No Active Package"
                    : storeProductIds.size >= limit
                    ? "Limit Reached"
                    : addingId === String(p.id)
                    ? "Adding..."
                    : "+ Add to My Store"
                }
              </button>

            )
          }


          </div>


        ))}


      </div>



    </UserShell>

  );

}