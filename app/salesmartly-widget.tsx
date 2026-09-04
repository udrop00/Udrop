"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Salesmartly customer chat widget.
 *
 * Loaded on all customer/seller-facing pages, but intentionally
 * NOT loaded on admin pages — admins manage the platform and
 * don't need the floating customer chat bubble in their way.
 */
export default function SalesmartlyWidget() {

  const pathname = usePathname();

  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {

    if (isAdmin) return;

    if (document.getElementById("salesmartly-widget-script")) return;

    const script = document.createElement("script");
    script.id = "salesmartly-widget-script";
    script.src =
      "https://plugin-code.salesmartly.com/js/project_811865_851858_1788498316.js";
    document.body.appendChild(script);

  }, [isAdmin]);

  return null;

}
