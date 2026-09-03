"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch, saveSession } from "../../lib";

function ImpersonateInner() {

  const params = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {

    const userId = params.get("userId");

    if (!userId) {
      setError("Missing seller id.");
      return;
    }

    (async () => {

      try {

        const r = await apiFetch("/api/admin/impersonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId })
        });

        const d = await r.json();

        if (!r.ok) {
          setError(d.error || "Unable to log in as this seller.");
          return;
        }

        saveSession("customer", d.user, d.token);

        router.replace("/dashboard");

      } catch {
        setError("Unable to log in as this seller.");
      }

    })();

  }, [params, router]);

  return (

    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0e1a",
        color: "#fff",
        fontFamily: "inherit"
      }}
    >

      {error ? (

        <div style={{ textAlign: "center" }}>
          <p>{error}</p>
          <p style={{ opacity: 0.6, fontSize: "13px", marginTop: "8px" }}>
            You can close this tab and try again from the admin panel.
          </p>
        </div>

      ) : (

        <p>Logging in as seller…</p>

      )}

    </div>

  );

}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={null}>
      <ImpersonateInner />
    </Suspense>
  );
}
