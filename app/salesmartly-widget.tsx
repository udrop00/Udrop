"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { getSession } from "./lib";

/**
 * Salesmartly Customer Chat Widget
 *
 * 1. Automatic Customer Identity & History Isolation:
 *    - Each logged-in customer account is uniquely bound with their user ID, name, email & shop name.
 *    - Prevents conversation mixing between different users.
 * 2. Strict & Permanent Admin Panel Suppression:
 *    - Strictly blocked and removed on all /admin pages.
 */
export default function SalesmartlyWidget() {
  const pathname = usePathname();
  const isAdmin = Boolean(pathname?.startsWith("/admin"));
  const lastIdentifiedId = useRef<string | null>(null);

  useEffect(() => {
    // -------------------------------------------------------------
    // 1. ADMIN PAGES: Strict suppression & removal
    // -------------------------------------------------------------
    if (isAdmin) {
      document.body.classList.add("admin-mode");

      const pruneAdminChat = () => {
        try {
          (window as any).ssq?.push(["hide"]);
          (window as any).salesmartly?.hide?.();
        } catch {}

        const selectors = [
          '[id*="salesmartly"]',
          '[class*="salesmartly"]',
          'iframe[src*="salesmartly"]',
          'iframe[id*="salesmartly"]',
          'div[id^="ss_"]',
          'div[id^="ss-"]',
          'div[class*="ss-"]',
          'div[class*="ss_"]',
          '#salesmartly-container',
          '#salesmartly-widget'
        ];

        document.querySelectorAll(selectors.join(",")).forEach((el) => {
          (el as HTMLElement).style.setProperty("display", "none", "important");
          (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
          (el as HTMLElement).style.setProperty("opacity", "0", "important");
          (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
        });
      };

      pruneAdminChat();
      const interval = setInterval(pruneAdminChat, 500);
      return () => {
        clearInterval(interval);
      };
    }

    // -------------------------------------------------------------
    // 2. CUSTOMER & PUBLIC PAGES: Active Chat & User Binding
    // -------------------------------------------------------------
    document.body.classList.remove("admin-mode");

    try {
      (window as any).ssq?.push(["show"]);
      (window as any).salesmartly?.show?.();
    } catch {}

    // Inject widget script if not present
    if (!document.getElementById("salesmartly-widget-script")) {
      const script = document.createElement("script");
      script.id = "salesmartly-widget-script";
      script.src =
        "https://plugin-code.salesmartly.com/js/project_822568_852939_1788610045.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // Pass user identity and isolate conversations per user
    const syncUserIdentity = () => {
      try {
        const session = getSession();
        const user = session?.user;

        if (user && user.role !== "admin") {
          // If a new user account is active, update SaleSmartly
          if (lastIdentifiedId.current !== user.id) {
            lastIdentifiedId.current = user.id;

            const ssq = ((window as any).ssq = (window as any).ssq || []);
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
                "Current Package": user.currentPackageName || user.currentPackage || "Silver",
                "Balance": `$${Number(user.balance || 0).toFixed(2)}`,
                "Guarantee Money": `$${Number(user.guaranteeMoney || 0).toFixed(2)}`
              }
            };

            ssq.push(["set", identifier]);
            (window as any).salesmartly?.set?.(identifier);
          }
        } else if (!user && lastIdentifiedId.current) {
          // If user logged out, reset identification
          lastIdentifiedId.current = null;
          try {
            (window as any).ssq?.push(["logout"]);
          } catch {}
        }
      } catch {}
    };

    syncUserIdentity();
    const syncTimer = setTimeout(syncUserIdentity, 1500);

    return () => clearTimeout(syncTimer);
  }, [isAdmin, pathname]);

  return null;
}
