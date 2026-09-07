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
      } catch {}

      document
        .querySelectorAll(
          'salesmartly-chat-widget, [id*="salesmartly"], [class*="salesmartly"], iframe[src*="salesmartly"], div[id^="ss_"], div[id^="ss-"], #salesmartly-container, #salesmartly-widget'
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

    // 3. Bind logged-in customer identity.
    // SaleSmartly's widget only recognizes a fixed command set (setLoginInfo,
    // setUserInfo, clearUser, chatOpen, ...) - "set"/"show" are silently
    // ignored, which is why identity binding never actually worked before.
    // We also track the last-synced user id per browser so that switching
    // accounts on a shared device clears the previous visitor's identity
    // instead of continuing their chat history under the new user.
    const SYNCED_USER_KEY = "ss_synced_user_id";
    const syncUser = () => {
      try {
        const ssq = (window as any).ssq;
        if (!ssq?.push) return;

        const session = getSession();
        const user = session?.user;
        const lastSyncedId = localStorage.getItem(SYNCED_USER_KEY);

        if (user && user.role !== "admin") {
          if (lastSyncedId && lastSyncedId !== user.id) {
            ssq.push(["clearUser"]);
          }
          ssq.push([
            "setLoginInfo",
            {
              user_id: user.id,
              user_name: user.name || user.shopName || user.email,
              email: user.email,
              phone: user.phone || "",
              description: user.shopName || "",
              custom_fields_ext: {
                "Shop Name": user.shopName || "N/A",
                "Package": user.currentPackageName || user.currentPackage || "Silver",
                "Balance": `$${Number(user.balance || 0).toFixed(2)}`
              }
            }
          ]);
          localStorage.setItem(SYNCED_USER_KEY, user.id);
        } else if (lastSyncedId) {
          ssq.push(["clearUser"]);
          localStorage.removeItem(SYNCED_USER_KEY);
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
