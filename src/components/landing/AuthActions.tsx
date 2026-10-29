"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { ArrowRight } from "lucide-react";

/** Clerk solo existe si hay clave pública; esa condición es fija en cada despliegue, así que no cambia entre renders. */
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface Props {
  /** "header": enlaces en línea. "menu": botones a todo el ancho para el menú móvil. */
  layout: "header" | "menu";
  onNavigate?: () => void;
}

export function AuthActions(props: Props) {
  return clerkEnabled ? <WithClerk {...props} /> : <Links {...props} signedIn={false} />;
}

function WithClerk(props: Props) {
  const { isLoaded, isSignedIn } = useAuth();
  return <Links {...props} signedIn={Boolean(isLoaded && isSignedIn)} />;
}

function Links({ layout, onNavigate, signedIn }: Props & { signedIn: boolean }) {
  if (signedIn) {
    return (
      <Link href="/panel" onClick={onNavigate} className={`lp-btn lp-btn-red ${layout === "header" ? "lp-btn-sm" : ""}`}>
        Ir a mi panel <ArrowRight size={16} aria-hidden />
      </Link>
    );
  }
  if (layout === "menu") {
    return (
      <>
        <Link href="/crear-cuenta" onClick={onNavigate} className="lp-btn lp-btn-red">
          Crear cuenta <ArrowRight size={16} aria-hidden />
        </Link>
        <Link href="/iniciar-sesion" onClick={onNavigate} className="lp-btn lp-btn-ghost">
          Iniciar sesión
        </Link>
      </>
    );
  }
  return (
    <>
      <Link href="/iniciar-sesion" className="lp-link-strong">
        Iniciar sesión
      </Link>
      <Link href="/crear-cuenta" className="lp-btn lp-btn-red lp-btn-sm">
        Crear cuenta <ArrowRight size={15} aria-hidden />
      </Link>
    </>
  );
}
