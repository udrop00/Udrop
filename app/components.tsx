"use client";

import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {clearSession,apiMe,apiFetch,useRealtimeStream} from "./lib";
import {useEffect,useState} from "react";


export function Logo(){

return (

<a
href="https://www.google.com/aclk?sa=L&pf=1&ai=DChsSEwiRu_nh6LmWAxUYaUECHcDSMJoYACICCAEQBRoCd3M&co=1&ase=2&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXxHbxoCyvRJM8xxU8tHKLjLZEM1eqRjs5-Xby2Rtg1Z-xIPSzHZSxEaAnz5EALw_wcB&sph=&cid=CAASuwHkaNuRJtWDEIFbsINJpQ0EcL3OypD-L0v3GK1YSSTsAcG-R1F4LTDz4FVnYNDSzZ4c06XJUOG5N0RmWU95igoOVtLaKayRbXJbcrmtMMsQRu3XX0QPF643dMMIkcc320yCfmNsFfXoKj2ndp8PY1B6uF27Nt1t_WJ_D19wEu28SMuFkgqNiio0q9hRfgxoYD9RAw55G1FwFQo60bq0SapFEwW7n-sNd0AIvlxHZw0HG0g2HMFk1xYKboeg&cce=2&category=acrcp_v1_32&sig=AOD64_0CWc2m3fAd_V33TNSTpG57RMk0yg&nis=4&ved=2ahUKEwi5gvPh6LmWAxUISaQEHWRfCOwQqyQoAXoECAwQDw&adurl=https://www.global.ubuy.com/%3Fcampaign_source%3Dgoogleads%26campaign_medium%3DSEA%26campaign_name%3DSEA_1_GGL_20_brand_UGL_3_EN_5_IN_USD_1_3_Low_Countries%26campaignid%3D24114281488%26gad_source%3D1%26gad_campaignid%3D24114281488%26gbraid%3D0AAAABAKZZAU0VSqkwOrKe4biM_QMHIvJQ%26gclid%3DCj0KCQjw16_UBhCqARIsAIdOaXxHbxoCyvRJM8xxU8tHKLjLZEM1eqRjs5-Xby2Rtg1Z-xIPSzHZSxEaAnz5EALw_wcB"
target="_blank"
rel="noopener noreferrer"
className="brand"
>

<img
src="/dropzone-logo.png"
alt="Drop Zone"
className="sidebar-logo"
/>

</a>

);

}


function useUnreadCount(){
  const [count, setCount] = useState(0);

  const load = async () => {
    try {
      const r = await apiFetch("/api/support", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        setCount(Number(d.unreadCount || 0));
      }
    } catch {}
  };

  useEffect(() => {
    load();
  }, []);

  useRealtimeStream(() => {
    load();
  });

  return count;
}





function SidebarProfile({name,role}:{name:string;role:string}){


return (

<div className="sidebar-profile">


<div className="profile-avatar">

{name?.[0] || "D"}

</div>


<div>

<b>
{name}
</b>

<small>
{role}
</small>


</div>


</div>

);


}
export function UserShell({children}:{children:React.ReactNode}){


const pathname=usePathname();
const router=useRouter();


const[name,setName]=useState("User");
const[profileImage,setProfileImage]=useState("");
const [sellerRating,setSellerRating]=useState(0);
const[loading,setLoading]=useState(true);

const [sidebarOpen,setSidebarOpen] = useState(true);


const unread=useUnreadCount();



useEffect(()=>{


apiMe()
.then(d=>{

if(d.user.role!=="customer")
throw new Error();


setName(d.user.name);
setProfileImage(
d.user.profileImage || ""
);
setSellerRating(
Number(d.user.sellerRating || 0)
);

})
.catch(()=>{

clearSession();
router.replace("/login");

})
.finally(()=>setLoading(false));


},[router]);

useRealtimeStream(d => {
  if (d?.user) {
    setName(d.user.name);
    setProfileImage(d.user.profileImage || "");
    setSellerRating(Number(d.user.sellerRating || 0));
  }
});






const logout=async()=>{


await apiFetch(
"/api/auth/logout",
{
method:"POST"
}
);


clearSession();

router.push("/");


};





if(loading)

return (

<div className="loading-screen">
Loading Drop Zone…
</div>

);





return (

<div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

<aside className="sidebar">


<div className="side-brand">

<Logo/>

</div>





<div className="side-label">
CUSTOMER AREA
</div>





<Nav 
href="/dashboard"
active={pathname==="/dashboard"}
>

◈ Dashboard

</Nav>




<Nav
href="/profile"
active={pathname==="/profile"}
>

◎ Profile

</Nav>




<Nav
href="/my-store"
active={pathname==="/my-store"}
>
◈ My Store

</Nav>




<Nav
href="/traffic-packages"
active={pathname==="/traffic-packages"}
>
◉ Packages

</Nav>





<Nav
href="/orders"
active={pathname==="/orders"}
>

▣ Orders

</Nav>





<Nav
href="/order-status"
active={pathname==="/order-status"}
>

◷ Tracking

</Nav>







<Nav
href="/withdrawal"
active={pathname==="/withdrawal"}
>
💳 Withdrawal

</Nav>





<div className="side-bottom">


<SidebarProfile
name={name}
role="Customer Account"
/>




<button
className="side-link"
onClick={logout}
>

↪ Logout

</button>


</div>




</aside>



<button
  className="sidebar-toggle"
  onClick={()=>setSidebarOpen(!sidebarOpen)}
>
  ☰
</button>


<main className="app-main">


<div className="topbar">


  <div className="brand-welcome">

    <div className="brand-row">

  <a
  href="https://www.google.com/aclk?sa=L&pf=1&ai=DChsSEwiRu_nh6LmWAxUYaUECHcDSMJoYACICCAEQBRoCd3M&co=1&ase=2&gclid=Cj0KCQjw16_UBhCqARIsAIdOaXxHbxoCyvRJM8xxU8tHKLjLZEM1eqRjs5-Xby2Rtg1Z-xIPSzHZSxEaAnz5EALw_wcB&sph=&cid=CAASuwHkaNuRJtWDEIFbsINJpQ0EcL3OypD-L0v3GK1YSSTsAcG-R1F4LTDz4FVnYNDSzZ4c06XJUOG5N0RmWU95igoOVtLaKayRbXJbcrmtMMsQRu3XX0QPF643dMMIkcc320yCfmNsFfXoKj2ndp8PY1B6uF27Nt1t_WJ_D19wEu28SMuFkgqNiio0q9hRfgxoYD9RAw55G1FwFQo60bq0SapFEwW7n-sNd0AIvlxHZw0HG0g2HMFk1xYKboeg&cce=2&category=acrcp_v1_32&sig=AOD64_0CWc2m3fAd_V33TNSTpG57RMk0yg&nis=4&ved=2ahUKEwi5gvPh6LmWAxUISaQEHWRfCOwQqyQoAXoECAwQDw&adurl=https://www.global.ubuy.com/%3Fcampaign_source%3Dgoogleads%26campaign_medium%3DSEA%26campaign_name%3DSEA_1_GGL_20_brand_UGL_3_EN_5_IN_USD_1_3_Low_Countries%26campaignid%3D24114281488%26gad_source%3D1%26gad_campaignid%3D24114281488%26gbraid%3D0AAAABAKZZAU0VSqkwOrKe4biM_QMHIvJQ%26gclid%3DCj0KCQjw16_UBhCqARIsAIdOaXxHbxoCyvRJM8xxU8tHKLjLZEM1eqRjs5-Xby2Rtg1Z-xIPSzHZSxEaAnz5EALw_wcB"
  target="_blank"
  rel="noopener noreferrer"
className="dashboard-logo"
>
  <img
    src="/ubuy-link.png"
    alt="Drop Zone"
  />
</a>


  <div className="seller-rating">

    <span>
      Rating
    </span>

    <strong className="rating-stars">

{
Array.from({length:5}).map((_,i)=>{

const fill=Math.min(
Math.max(sellerRating-i,0),
1
)*100;


return(
<span
key={i}
style={{
background:
`linear-gradient(90deg,#ffd43b ${fill}%,#39465a ${fill}%)`,
WebkitBackgroundClip:"text",
color:"transparent"
}}
>
★
</span>
);

})
}

</strong>

    <b>
  {sellerRating.toFixed(1)}
</b>

  </div>

</div>


    <h1>
      Welcome, {name.split(" ")[0]}
    </h1>


  </div>



  <div className="top-actions">


    


    <span className="admin-chip live-chip">

      <i/>

      Live Account

    </span>



    <div
      className="profile-avatar"
      style={{
        width:42,
        height:42,
        margin:0,
        fontSize:15,
        ...(profileImage?
        {
          backgroundImage:`url(${profileImage})`,
          backgroundSize:"cover",
          backgroundPosition:"center",
          color:"transparent"
        }
        :{})
      }}
    >

      {!profileImage && name[0]}

    </div>


  </div>


</div>


{children}


</main>


</div>


);

}
export function AdminShell({children}:{children:React.ReactNode}){


const pathname=usePathname();
const router=useRouter();


const[loading,setLoading]=useState(true);


const [sidebarOpen,setSidebarOpen] = useState(true);

const unread=useUnreadCount();





useEffect(()=>{

const session = sessionStorage.getItem("dz_tab_session");

if(!session){

clearSession();
router.replace("/login");
return;

}


apiMe()

.then(d=>{

if(d.user.role!=="admin"){
throw new Error("Not admin");
}

})

.catch((err)=>{

console.log("Admin auth error:",err);

})

.finally(()=>{

setLoading(false);

});


},[router]);







const logout=async()=>{


await apiFetch(
"/api/auth/logout",
{
method:"POST"
}
);


clearSession();

router.push("/");


};







if(loading)

return (

<div className="loading-screen">

Loading Admin Control Center…

</div>

);






return (

<div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

<aside className="sidebar">



<div className="side-brand">

<Logo/>

</div>





<div className="admin-badge">

⚡ ADMIN CONTROL CENTER

</div>






<div className="side-label">

MANAGEMENT

</div>






<Nav
href="/admin"
active={pathname==="/admin"}
>

▦ Overview

</Nav>





<Nav
href="/admin/users"
active={pathname.startsWith("/admin/users")}
>

♙ Users

</Nav>


<Nav
href="/admin/kyc"
active={pathname.startsWith("/admin/kyc")}
>

✓ KYC Verification

</Nav>

<Nav
href="/admin/orders"
active={pathname.startsWith("/admin/orders")}
>

▣ Orders

</Nav>





<Nav
href="/admin/products"
active={pathname.startsWith("/admin/products")}
>

◈ Products

</Nav>


<Nav
href="/admin/package-requests"
active={pathname.startsWith("/admin/package-requests")}
>
◇ Package Requests
</Nav>


<Nav
  href="/admin/withdrawals"
  active={pathname.startsWith("/admin/withdrawals")}
>
  ▤ Withdrawal Requests
</Nav>


<Nav
href="/support?admin=1"
active={pathname==="/support"}
>

◌ Support

{unread>0 &&

<b className="count">

{unread>99?"99+":unread}

</b>

}

</Nav>







<div className="side-bottom">



<div className="sidebar-profile">


<div className="profile-avatar">

A

</div>


<div>

<b>
Administrator
</b>


<small>
Super Admin
</small>


</div>


</div>





<button

className="side-link"

onClick={logout}

>

↪ Logout

</button>




</div>





</aside>





<button
className="sidebar-toggle"
onClick={()=>setSidebarOpen(!sidebarOpen)}
>
☰
</button>

<main className="app-main">


{children}


</main>





</div>


);

}







function Nav({
href,
active,
children
}:{
href:string;
active:boolean;
children:React.ReactNode
}){


return (

<Link

href={href}

className={`side-link ${active?"active":""}`}

>

{children}

</Link>

);


}