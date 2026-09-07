"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "./lib";

/**
 * Salesmartly Customer Chat Widget
 *
 * - Always active & visible on Customer/Seller and Landing pages across mobile & desktop.
 * - Strictly suppressed on Admin pages (/admin).
 * - Binds logged-in customer info (name, email, shop) to SaleSmartly.
 */
export default function SalesmartlyWidget() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));

  useEffect(() => {
    // 1. ADMIN PAGES: Add admin-mode class to body to hide chat widget via CSS
    if (isAdmin) {
      document.body.classList.add("admin-mode");
      return;
    }

    // 2. CUSTOMER & PUBLIC PAGES: Remove admin-mode and restore widget visibility
    document.body.classList.remove("admin-mode");

    const restoreVisibility = () => {
      try {
        localStorage.removeItem("ss_widget_hide");
        localStorage.removeItem("salesmartly_hide");
        sessionStorage.removeItem("ss_widget_hide");
        // Only push if the vendor script has already initialized window.ssq itself.
        // Never pre-create it here: the vendor's own bootstrap script checks
        // `if (window.ssq) return false` and skips loading the real widget
        // if window.ssq already exists, which silently breaks the chat widget.
        (window as any).ssq?.push?.(["show"]);
        (window as any).salesmartly?.show?.();
      } catch {}

      document
        .querySelectorAll(
          '[id*="salesmartly"], [class*="salesmartly"], iframe[src*="salesmartly"], div[id^="ss_"], div[id^="ss-"], #salesmartly-container, #salesmartly-widget'
        )
        .forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style.display === "none") {
            htmlEl.style.removeProperty("display");
          }
          if (htmlEl.style.visibility === "hidden") {
            htmlEl.style.removeProperty("visibility");
          }
          if (htmlEl.style.opacity === "0") {
            htmlEl.style.removeProperty("opacity");
          }
        });
    };

    restoreVisibility();
    const t1 = setTimeout(restoreVisibility, 500);
    const t2 = setTimeout(restoreVisibility, 1500);
    const t3 = setTimeout(restoreVisibility, 3000);

    // 3. Bind logged-in customer identity
    const syncUser = () => {
      try {
        const session = getSession();
        const user = session?.user;

        if (user && user.role !== "admin") {
          const ssq = (window as any).ssq;
          const identifier = {
            user_id: user.id,
            user_name: user.name || user.shopName || user.email,
            name: user.name || user.shopName || user.email,
            nickname: user.name || user.shopName || user.email,
            email: user.email,
            phone: user.phone || "",
            shop_name: user.shopName || "",
            custom_fields: {
              "User ID": user.id,
              "Shop Name": user.shopName || "N/A",
              "Email": user.email,
              "Package": user.currentPackageName || user.currentPackage || "Silver",
              "Balance": `$${Number(user.balance || 0).toFixed(2)}`
            }
          };

          ssq?.push?.(["set", identifier]);
          (window as any).salesmartly?.set?.(identifier);
        }
      } catch {}
    };

    syncUser();
    const userTimer1 = setTimeout(syncUser, 1500);
    const userTimer2 = setTimeout(syncUser, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(userTimer1);
      clearTimeout(userTimer2);
    };
  }, [isAdmin, pathname]);

  return null;
}
