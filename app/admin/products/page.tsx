"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "../../components";
import { apiFetch, useRealtimeStream } from "../../lib";

export default function AdminProducts() {

  const [tab, setTab] = useState<"all"|"seller">("all");

  const [products, setProducts] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState("");

  const [sku, setSku] = useState("");
const [name, setName] = useState("");
const [brand, setBrand] = useState("");
const [supplier, setSupplier] = useState("");
const [category, setCategory] = useState("");
const [description, setDescription] = useState("");
const [purchasePrice, setPurchasePrice] = useState("");
const [price, setPrice] = useState("");
const [image, setImage] = useState("");
const [stock, setStock] = useState("");
const [lowStockLimit, setLowStockLimit] = useState("");
const [status, setStatus] = useState("Active");

  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/products", { cache:"no-store" })
      .then(r=>r.json())
      .then(d=>setProducts(d.products || []))
      .catch(()=>{});
  }, []);

  useEffect(()=>{
    load();
  },[load]);

  useRealtimeStream(()=>{
    load();
  });



  const resetForm = () => {

    setEditId("");
    setSku("");
setName("");
setBrand("");
setSupplier("");
setCategory("");
setDescription("");
setPurchasePrice("");
setPrice("");
setImage("");
setStock("");
setLowStockLimit("");
setStatus("Active");

  };




  const saveProduct = async(e:React.FormEvent)=>{

    e.preventDefault();

    setMessage("");


    const url = editId
      ? `/api/products/${editId}`
      : "/api/products";


    const method = editId
      ? "PATCH"
      : "POST";



    const r = await apiFetch(url,{

      method,

      headers:{
        "Content-Type":"application/json"
      },

      body:JSON.stringify({

        sku,
        name,
        category,
        description,
        price,
        image,
        stock,
        status

      })

    });



    const d = await r.json();



    if(!r.ok){

      setMessage(
        d.error || "Unable to save product"
      );

      return;

    }



    setMessage(
      editId
        ? "Product updated successfully."
        : "Product added successfully."
    );


    resetForm();

    setShowForm(false);

    load();


  };




  const editProduct = (p:any)=>{

    setEditId(p.id);

    setSku(p.sku || "");
    setName(p.name || "");
    setCategory(p.category || "");
    setDescription(p.description || "");
    setPrice(String(p.price || ""));
    setImage(p.image || "");
    setStock(String(p.stock || ""));
    setStatus(p.status || "Active");

    setShowForm(true);

  };




  const deleteProduct = async(id:string)=>{

    if(!confirm("Delete this product?")) return;


    const r = await apiFetch(
      `/api/products/${id}`,
      {
        method:"DELETE"
      }
    );


    if(r.ok){

      setMessage("Product deleted.");

      load();

    }

  };



  const list = products.filter(p =>
    p.name
      .toLowerCase()
      .includes(q.toLowerCase())
  );



  return (

    <AdminShell>
      <div className="topbar">

        <div>

          <span className="eyebrow">
            Catalog management
          </span>

          <h1>
            Products
          </h1>

        </div>


        {tab==="all" && (
          <button
            className="btn btn-small"
            onClick={()=>{

              resetForm();

              setShowForm(!showForm);

            }}
          >

            {showForm
              ? "Close"
              : "Add Product"
            }

          </button>
        )}


      </div>


      <div className="tabs" style={{display:"flex",gap:8,marginBottom:16}}>

        <button
          className={`table-btn${tab==="all" ? " active" : ""}`}
          style={tab==="all" ? {background:"var(--accent, #2563eb)",color:"#fff"} : {}}
          onClick={()=>setTab("all")}
        >
          All Products
        </button>

        <button
          className={`table-btn${tab==="seller" ? " active" : ""}`}
          style={tab==="seller" ? {background:"var(--accent, #2563eb)",color:"#fff"} : {}}
          onClick={()=>setTab("seller")}
        >
          Seller Products
        </button>

      </div>


      {tab==="seller" ? (

        <SellerProductsPanel />

      ) : (

      <>

      {message && (

        <div className="info-banner">
          {message}
        </div>

      )}






      {showForm && (

        <section className="panel">


          <h2>

            {editId
              ? "Edit Product"
              : "Add New Product"
            }

          </h2>



          <form
            className="auth-form"
            onSubmit={saveProduct}
          >


            <label>
              Product SKU

              <input
                value={sku}
                onChange={e=>setSku(e.target.value)}
                placeholder="DZ-001"
              />

            </label>



            <label>
              Product Name

              <input
                value={name}
                onChange={e=>setName(e.target.value)}
                required
              />

            </label>



            <label>
              Category

              <input
                value={category}
                onChange={e=>setCategory(e.target.value)}
                placeholder="Router"
              />

            </label>



            <label>
              Description

              <textarea
                value={description}
                onChange={e=>setDescription(e.target.value)}
                placeholder="Product details..."
              />

            </label>



            <label>
              Price

              <input
                type="number"
                value={price}
                onChange={e=>setPrice(e.target.value)}
                required
              />

            </label>



            <label>
              Image URL

              <input
                value={image}
                onChange={e=>setImage(e.target.value)}
              />

            </label>



            <label>
              Stock

              <input
                type="number"
                value={stock}
                onChange={e=>setStock(e.target.value)}
              />

            </label>



            <label>
              Status

              <select
                value={status}
                onChange={e=>setStatus(e.target.value)}
              >

                <option>
                  Active
                </option>

                <option>
                  Inactive
                </option>

              </select>

            </label>




            <button
              className="btn full"
              type="submit"
            >

              {editId
                ? "Update Product"
                : "Save Product"
              }

            </button>



          </form>


        </section>

      )}






      <section className="panel">


        <div className="panel-head">


          <div>

            <span className="eyebrow">
              {products.length} products
            </span>


            <h2>
              Product Catalog
            </h2>


          </div>



          <input
            className="search"
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="Search products..."
          />


        </div>





        <div className="product-grid admin-product-grid">


          {list.map(p=>(

            <div
              className="product-card"
              key={p.id}
            >


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
                  SKU: {p.sku || "-"}
                </small>



                <br/>


                <small>
                  Category: {p.category || "-"}
                </small>




                <div style={{marginTop:"10px"}}>

                  <strong>
                    ${p.price?.toLocaleString()}
                  </strong>

                </div>




                                <div style={{marginTop:"8px"}}>

                  <span className="status active">
                    {p.status || "Active"}
                  </span>

                </div>




                                <div
                  style={{
                    display:"flex",
                    gap:8,
                    marginTop:12
                  }}
                >

                  <button
                    className="table-btn"
                    onClick={()=>editProduct(p)}
                  >
                    Edit
                  </button>


                </div>



              </div>


            </div>


          ))}


        </div>


      </section>

      </>

      )}

    </AdminShell>

  );

}




function SellerProductsPanel(){

  const [email, setEmail] = useState("");
  const [sellers, setSellers] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const searchSellers = useCallback((value:string)=>{
    setEmail(value);
    setSeller(null);
    setItems([]);

    if(!value.trim()){
      setSellers([]);
      return;
    }

    apiFetch(`/api/admin/seller-products?email=${encodeURIComponent(value.trim())}`)
      .then(r=>r.json())
      .then(d=>setSellers(d.sellers || []))
      .catch(()=>{});

  },[]);

  const openSeller = useCallback((id:string)=>{

    setLoading(true);
    setMessage("");

    apiFetch(`/api/admin/seller-products?sellerId=${id}`)
      .then(r=>r.json())
      .then(d=>{
        setSeller(d.seller || null);
        setItems(d.items || []);
        setSellers([]);
      })
      .catch(()=>setMessage("Unable to load seller products."))
      .finally(()=>setLoading(false));

  },[]);

  const removeOne = async(id:string)=>{

    if(!confirm("Remove this product from the seller's store?")) return;

    const r = await apiFetch("/api/admin/seller-products", {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({id})
    });

    if(r.ok){
      setItems(prev => prev.filter(it=>it.id!==id));
      setMessage("Product removed from seller's store.");
    } else {
      setMessage("Unable to remove product.");
    }

  };

  const removeAll = async()=>{

    if(!seller) return;

    if(!confirm(`Remove ALL products from ${seller.email}'s store? This cannot be undone.`)) return;

    const r = await apiFetch("/api/admin/seller-products", {
      method:"DELETE",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({sellerId:seller.id, all:true})
    });

    if(r.ok){
      setItems([]);
      setMessage("All products removed from seller's store.");
    } else {
      setMessage("Unable to remove products.");
    }

  };

  return (

    <section className="panel">

      <div className="panel-head">
        <div>
          <span className="eyebrow">Seller Products</span>
          <h2>Search by seller email</h2>
        </div>
      </div>

      {message && (
        <div className="info-banner">{message}</div>
      )}

      <input
        className="search"
        placeholder="Search seller by email..."
        value={email}
        onChange={e=>searchSellers(e.target.value)}
        style={{maxWidth:420, marginBottom:16}}
      />

      {sellers.length>0 && !seller && (

        <div className="customer-results" style={{position:"static"}}>

          {sellers.map((s:any)=>(

            <div
              key={s.id}
              className="customer-option"
              onClick={()=>openSeller(s.id)}
            >
              <b>{s.name}</b>
              <br/>
              <small>{s.email}</small>
              <br/>
              <small>Shop: {s.shopName || "N/A"} · {s.productCount} products · {s.currentPackageName || "No package"}</small>
            </div>

          ))}

        </div>

      )}

      {loading && <div className="loading-screen">Loading...</div>}

      {seller && (

        <>

          <div className="panel" style={{padding:"14px",marginBottom:16}}>

            <b>{seller.name}</b> — {seller.email}
            <br/>
            <small>Shop: {seller.shopName || "N/A"} · Package: {seller.currentPackageName || "None"} · Limit: {seller.productLimit}</small>

            <div style={{marginTop:10, display:"flex", gap:8}}>

              <button className="table-btn" onClick={()=>{setSeller(null);setItems([]);}}>
                ← Back to search
              </button>

              <button className="table-btn danger-btn" onClick={removeAll} disabled={items.length===0}>
                Remove All ({items.length})
              </button>

            </div>

          </div>

          <div className="table-wrap">

            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Added</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>

                {items.length===0 ? (
                  <tr><td colSpan={4}>No products in this seller's store.</td></tr>
                ) : (

                  items.map((item:any)=>(

                    <tr key={item.id}>
                      <td>
                        <div className="order-product-cell">
                          <img className="table-thumb" src={item.product?.image} alt={item.product?.name} />
                          <div><b>{item.product?.name}</b></div>
                        </div>
                      </td>
                      <td>${Number(item.product?.price||0).toLocaleString()}</td>
                      <td><small>{item.addedDate ? new Date(item.addedDate).toLocaleDateString() : "-"}</small></td>
                      <td>
                        <button className="table-btn danger-btn" onClick={()=>removeOne(item.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>

                  ))

                )}

              </tbody>
            </table>

          </div>

        </>

      )}

    </section>

  );

}