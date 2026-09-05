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
      document.body.classList.add("admin-mode");

      if (!hideStyle) {
        hideStyle = document.createElement("style");
        hideStyle.id = styleId;
        hideStyle.innerHTML = `
          [id*="salesmartly"],
          [class*="salesmartly"],
          iframe[src*="salesmartly"],
          iframe[id*="salesmartly"],
          div[id^="ss_"],
          div[id^="ss-"],
          div[id*="salesmartly"],
          #salesmartly-container,
          #salesmartly-widget {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
          }
        `;
        document.head.appendChild(hideStyle);
      }

      const hideElements = () => {
        try {
          (window as any).ssq?.push(["hide"]);
          (window as any).salesmartly?.hide?.();
        } catch {}
        const elements = document.querySelectorAll(
          '[id*="salesmartly"], [class*="salesmartly"], iframe[src*="salesmartly"], div[id^="ss_"], div[id^="ss-"], #salesmartly-container, #salesmartly-widget'
        );
        elements.forEach((el) => {
          (el as HTMLElement).style.setProperty("display", "none", "important");
          (el as HTMLElement).style.setProperty("visibility", "hidden", "important");
          (el as HTMLElement).style.setProperty("opacity", "0", "important");
          (el as HTMLElement).style.setProperty("pointer-events", "none", "important");
        });
      };

      hideElements();
      const hideInterval = setInterval(hideElements, 600);
      return () => clearInterval(hideInterval);
    }

    document.body.classList.remove("admin-mode");

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
