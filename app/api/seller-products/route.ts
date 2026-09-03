import { NextResponse } from "next/server";
import { readDB, writeDB, userFromRequest } from "../../lib/server";

export const runtime = "nodejs";


// GET CUSTOMER STORE PRODUCTS

export async function GET(req:Request){

  const user = userFromRequest(req);


  if(!user || user.role !== "customer"){

    return NextResponse.json(
      {
        error:"Unauthorized"
      },
      {
        status:401
      }
    );

  }


  const db = readDB();
  if(!db.sellerProducts) db.sellerProducts = [];

  const items = db.sellerProducts.filter(
    (p:any)=>p.sellerId === user.id
  );

  const products = items.map((item:any)=>{
    const product = (db.products || []).find(
      (p:any)=>String(p.id) === String(item.productId)
    );
    return {
      ...item,
      product
    };
  }).filter((item:any) => Boolean(item.product));


  return NextResponse.json({
    products
  });

}


// ADD PRODUCT TO STORE (Manual single or Auto-add bulk)

export async function POST(req:Request){

  const user = userFromRequest(req);


  if(!user || user.role !== "customer"){

    return NextResponse.json(
      {
        error:"Unauthorized"
      },
      {
        status:401
      }
    );

  }

  if(user.packageStatus !== "active"){
    return NextResponse.json(
      {
        error:"Please select a package and wait for admin approval."
      },
      {
        status:403
      }
    );
  }

  const body = await req.json();
  const db = readDB();
  if(!db.sellerProducts) db.sellerProducts = [];

  const limit = Number(user.productLimit || 0);
  const userItems = db.sellerProducts.filter((p:any)=>p.sellerId === user.id);
  const existingIds = new Set(userItems.map((p:any)=>String(p.productId)));

  // 1. Bulk Auto-Add
  if(body.autoAdd){
    const needed = limit > 0 ? Math.max(limit - existingIds.size, 0) : 0;
    if(needed <= 0){
      return NextResponse.json(
        { error: "Product limit already reached." },
        { status: 400 }
      );
    }

    const available = (db.products || []).filter((p:any)=>!existingIds.has(String(p.id)));
    if(available.length === 0){
      return NextResponse.json(
        { error: "No more products available in catalog to add." },
        { status: 400 }
      );
    }

    const toAdd = available.slice(0, needed);
    for(const prod of toAdd){
      db.sellerProducts.push({
        id: crypto.randomUUID(),
        sellerId: user.id,
        productId: prod.id,
        addedDate: new Date().toISOString(),
        status: "Active"
      });
    }

    writeDB(db);
    return NextResponse.json({
      success: true,
      addedCount: toAdd.length,
      message: `Successfully auto-added ${toAdd.length} products to your store.`
    });
  }

  // 2. Single Manual Add
  if(!body.productId){
    return NextResponse.json(
      {
        error:"Product ID required"
      },
      {
        status:400
      }
    );
  }

  if(limit > 0 && userItems.length >= limit){
    return NextResponse.json(
      {
        error:`Product limit reached. Your ${user.currentPackageName || "package"} allows up to ${limit} products.`
      },
      {
        status:403
      }
    );
  }

  if(existingIds.has(String(body.productId))){
    return NextResponse.json(
      {
        error:"Product already in your store"
      },
      {
        status:400
      }
    );
  }

  const newProduct = {
    id: crypto.randomUUID(),
    sellerId: user.id,
    productId: body.productId,
    addedDate: new Date().toISOString(),
    status: "Active"
  };

  db.sellerProducts.push(newProduct);
  writeDB(db);

  return NextResponse.json({
    success: true,
    product: newProduct
  });

}
export async function DELETE(req:Request){

  const user = userFromRequest(req);


  if(!user || user.role !== "customer"){

    return NextResponse.json(
      {
        error:"Unauthorized"
      },
      {
        status:401
      }
    );

  }



  const body = await req.json();



  if(!body.id){

    return NextResponse.json(
      {
        error:"Product id required"
      },
      {
        status:400
      }
    );

  }



  const db = readDB();



  db.sellerProducts =
    (db.sellerProducts || [])
    .filter(
      (p:any)=>
        !(
          p.id === body.id &&
          p.sellerId === user.id
        )
    );



  writeDB(db);



  return NextResponse.json({
    success:true
  });

}