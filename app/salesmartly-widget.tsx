"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { getSession } from "./lib";

/**
 * Salesmartly customer chat widget.
 *
 * 1. Automatically passes logged-in customer info (Name, Email, Shop Name) to SaleSmartly
 *    so live chat displays their real identity instead of "Guest".
 * 2. Strictly hidden and blocked on all /admin pages.
 */
export default function SalesmartlyWidget() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    const styleId = "salesmartly-hide-style";
    let hideStyle = document.getElementById(styleId);

    // 1. If on /admin, strictly hide all SaleSmartly widget elements
    if (isAdmin) {
      if (!hideStyle) {
        hideStyle = document.createElement("style");
        hideStyle.id = styleId;
        hideStyle.innerHTML = `
          [id*="salesmartly"],
          [class*="salesmartly"],
          iframe[src*="salesmartly"],
          div[id^="ss_"],
          div[id*="salesmartly"],
          #salesmartly-container {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        `;
        document.head.appendChild(hideStyle);
      }

      try {
        (window as any).ssq?.push(["hide"]);
        (window as any).salesmartly?.hide?.();
      } catch {}
      return;
    }

    // 2. Non-admin pages: remove hide style & show widget
    if (hideStyle) {
      hideStyle.remove();
    }

    try {
      (window as any).ssq?.push(["show"]);
      (window as any).salesmartly?.show?.();
    } catch {}

    // 3. Inject SaleSmartly script if not already added
    if (!document.getElementById("salesmartly-widget-script")) {
      const script = document.createElement("script");
      script.id = "salesmartly-widget-script";
      script.src =
        "https://plugin-code.salesmartly.com/js/project_822568_852939_1788610045.js";
      script.async = true;
      document.body.appendChild(script);
    }

    // 4. Automatically identify logged-in customer so real name/email appears in SaleSmartly
    const identifyCustomer = () => {
      try {
        const session = getSession();
        const user = session?.user;

        if (user && user.role !== "admin") {
          const ssq = ((window as any).ssq = (window as any).ssq || []);
          const identifierData = {
            user_id: user.id,
            user_name: user.name || user.shopName || user.email,
            name: user.name || user.shopName || user.email,
            nickname: user.name || user.shopName || user.email,
            email: user.email,
            phone: user.phone || "",
            shop_name: user.shopName || "",
            custom_fields: {
              "Shop Name": user.shopName || "N/A",
              "Email": user.email,
              "Package": user.currentPackageName || user.currentPackage || "Silver",
              "Balance": `$${Number(user.balance || 0).toFixed(2)}`
            }
          };

          ssq.push(["set", identifierData]);
          (window as any).salesmartly?.set?.(identifierData);
        }
      } catch {}
    };

    identifyCustomer();
    const timer = setTimeout(identifyCustomer, 2000);
    return () => clearTimeout(timer);
  }, [isAdmin, pathname]);

  return null;
}
