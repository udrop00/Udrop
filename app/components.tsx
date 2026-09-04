"use client";

import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {clearSession,apiMe,apiFetch,useRealtimeStream} from "./lib";
import {useEffect,useState,useCallback} from "react";


export function Logo(){

return (

<a
href="/"
className="brand"
style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
>

<img
src="/dropzone-logo.png"
alt="Udrop"
style={{ height: "36px", width: "auto", objectFit: "contain" }}
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


function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState<any | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await apiFetch("/api/notifications", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        const list = d.notifications || [];
        setNotifications(list);
        setUnreadCount(Number(d.unreadCount || 0));

        // Trigger toast for newest unread notification
        if (list.length > 0 && !list[0].read) {
          setToast(list[0]);
        }
      }
    } catch {}
  }, []);

  const markAllAsRead = async () => {
    try {
      const r = await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (r.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {}
  };

  const markAsRead = async (id: string) => {
    try {
      await apiFetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  useEffect(() => {
    load();
  }, [load]);

  useRealtimeStream(() => {
    load();
  });

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    markAsRead,
    toast,
    setToast
  };
}


function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead, toast, setToast } = useNotifications();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [toast, setToast]);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".notification-wrapper")) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleDocClick);
      return () => document.removeEventListener("mousedown", handleDocClick);
    }
  }, [open]);

  const getIconAndColor = (type: string) => {
    switch (type) {
      case "balance":
        return { icon: "💳", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Wallet" };
      case "guarantee":
        return { icon: "🛡️", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", label: "Guarantee" };
      case "profit":
        return { icon: "💰", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", label: "Profit" };
      case "order":
        return { icon: "📦", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", label: "Order" };
      case "package":
        return { icon: "🎁", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", label: "Package" };
      case "kyc":
        return { icon: "🛡️", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", label: "Verification" };
      case "withdrawal":
        return { icon: "💳", color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", label: "Withdrawal" };
      default:
        return { icon: "🔔", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", label: "System" };
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="notification-wrapper" style={{ position: "relative" }}>
      {/* 1. BELL BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        className="icon-btn"
        style={{
          position: "relative",
          cursor: "pointer",
          width: "42px",
          height: "42px",
          borderRadius: "12px",
          display: "grid",
          placeItems: "center",
          background: open ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
          border: open ? "1px solid rgba(56, 189, 248, 0.5)" : "1px solid rgba(255, 255, 255, 0.1)",
          transition: "all 0.2s ease"
        }}
        title="Notifications"
      >
        <span style={{ fontSize: "18px" }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
              color: "#ffffff",
              borderRadius: "99px",
              fontSize: "10px",
              fontWeight: 800,
              minWidth: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 4px",
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.6)",
              border: "2px solid #070d19"
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* 2. LUXURY NOTIFICATION DROPDOWN */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "50px",
            right: "0",
            width: "360px",
            maxWidth: "calc(100vw - 32px)",
            background: "rgba(13, 21, 39, 0.96)",
            backdropFilter: "blur(25px)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            borderRadius: "18px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.7), 0 0 30px rgba(56, 189, 248, 0.15)",
            zIndex: 99999,
            overflow: "hidden"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 18px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, transparent 100%)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "15px", color: "#ffffff", fontWeight: 800 }}>
                Notifications
              </strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    fontSize: "11px",
                    fontWeight: 800,
                    padding: "2px 8px",
                    borderRadius: "99px",
                    border: "1px solid rgba(56, 189, 248, 0.3)"
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px"
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div
            style={{
              maxHeight: "380px",
              overflowY: "auto",
              padding: "8px 0"
            }}
          >
            {notifications.length === 0 ? (
              <div style={{ padding: "35px 20px", textAlign: "center", color: "#64748b" }}>
                <span style={{ fontSize: "28px", display: "block", marginBottom: "8px" }}>✨</span>
                <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>No notifications yet</p>
                <small style={{ color: "#64748b", fontSize: "11px" }}>You are completely up to date!</small>
              </div>
            ) : (
              notifications.map(n => {
                const conf = getIconAndColor(n.type);
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    style={{
                      padding: "12px 16px",
                      display: "flex",
                      gap: "12px",
                      alignItems: "flex-start",
                      background: n.read ? "transparent" : "rgba(56, 189, 248, 0.05)",
                      borderLeft: n.read ? "3px solid transparent" : `3px solid ${conf.color}`,
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: conf.bg,
                        display: "grid",
                        placeItems: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                        border: `1px solid ${conf.color}33`
                      }}
                    >
                      {conf.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", marginBottom: "3px" }}>
                        <span style={{ fontSize: "13px", fontWeight: n.read ? 600 : 800, color: n.read ? "#e2e8f0" : "#ffffff", lineHeight: 1.3 }}>
                          {n.title}
                        </span>
                        <span style={{ fontSize: "10px", color: "#64748b", flexShrink: 0 }}>
                          {timeAgo(n.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "12px", color: n.read ? "#94a3b8" : "#cbd5e1", lineHeight: 1.4 }}>
                        {n.message}
                      </p>
                    </div>

                    {!n.read && (
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "#38bdf8",
                          boxShadow: "0 0 8px #38bdf8",
                          marginTop: "6px",
                          flexShrink: 0
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. FLOATING REAL-TIME TOAST POPUP (Slide-in) */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999999,
            width: "350px",
            maxWidth: "calc(100vw - 32px)",
            background: "linear-gradient(135deg, rgba(13, 21, 39, 0.98) 0%, rgba(20, 32, 60, 0.98) 100%)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(56, 189, 248, 0.5)",
            borderRadius: "16px",
            padding: "16px 18px",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.3)",
            display: "flex",
            gap: "12px",
            alignItems: "flex-start"
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "10px",
              background: getIconAndColor(toast.type).bg,
              border: `1px solid ${getIconAndColor(toast.type).color}44`,
              display: "grid",
              placeItems: "center",
              fontSize: "18px",
              flexShrink: 0
            }}
          >
            {getIconAndColor(toast.type).icon}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "10px", textTransform: "uppercase", fontWeight: 800, color: "#38bdf8", letterSpacing: "0.08em" }}>
                Live Notification
              </span>
              <button
                onClick={() => setToast(null)}
                style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: "14px" }}
              >
                ✕
              </button>
            </div>
            <strong style={{ display: "block", fontSize: "13px", color: "#ffffff", marginTop: "2px", fontWeight: 800 }}>
              {toast.title}
            </strong>
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#cbd5e1", lineHeight: 1.35 }}>
              {toast.message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
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
Loading Ubuy…
</div>

);





return (

<div className={`app-shell ${sidebarOpen ? "" : "sidebar-collapsed"}`}>

<aside className="sidebar">


<div className="side-brand" style={{ paddingLeft: "60px", paddingBottom: "20px", display: "flex", alignItems: "center", minHeight: "44px" }}>

<Logo/>

</div>





<div className="side-label">
SELLER AREA
</div>





<Nav 
href="/dashboard"
active={pathname==="/dashboard"}
>

◈ Seller Dashboard

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
href="/products"
active={pathname==="/products"}
>
📦 Products

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
role="Seller Account"
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
style={{ display: "inline-flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
>
  <span className="globe-icon" style={{ fontSize: "24px", lineHeight: 1 }}>🌐</span>
  <span className="dashboard-logo-text" style={{ fontWeight: 900, letterSpacing: "0.5px", fontSize: "19px" }}>
    <span style={{ color: "#ffffff", fontWeight: 900 }}>U</span>
    <span style={{ 
      color: "#ffc220", 
      fontWeight: 900,
      textShadow: "0 0 12px rgba(255, 194, 32, 0.45)" 
    }}>buy</span>
  </span>
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



  <div className="top-actions" style={{ display: "flex", alignItems: "center", gap: "12px" }}>

    <NotificationBell />

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



<div className="side-brand" style={{ paddingLeft: "60px", paddingBottom: "20px", display: "flex", alignItems: "center", minHeight: "44px" }}>

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
href="/admin/pos"
active={pathname.startsWith("/admin/pos")}
>

$ POS

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