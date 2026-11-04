"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** Confirma, tras eliminar la cuenta, que todo se borró (llegamos con ?cuenta=eliminada). */
export function DeletedNotice() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("cuenta") === "eliminada") setShow(true);
  }, []);
  if (!show) return null;
  return (
    <div role="status" style={{ position: "relative", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "12px 48px 12px 20px", background: "#14532d", color: "#fff", fontSize: 15, textAlign: "center" }}>
      Tu cuenta y tus datos se eliminaron correctamente. Gracias por haber usado GYMRAT.
      <button type="button" onClick={() => setShow(false)} aria-label="Cerrar aviso" style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", width: 44, height: 44, display: "grid", placeItems: "center", background: "transparent", border: 0, color: "#fff", cursor: "pointer" }}>
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}
