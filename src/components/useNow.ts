"use client";

import { useEffect, useState } from "react";

/** Hora actual, refrescada cada segundo. Devuelve null en el servidor para evitar errores de hidratación. */
export function useNow(intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
