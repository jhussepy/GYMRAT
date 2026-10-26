import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/** Páginas que exigen sesión. */
const isPrivateRoute = createRouteMatcher(["/panel(.*)", "/cuenta(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

const clerk = clerkMiddleware(async (auth, request) => {
  if (isPrivateRoute(request)) await auth.protect();
});

/**
 * Revisa el formato de las claves sin mostrar su valor. Devuelve el problema o null si todo está bien.
 * Un caso típico: copiar la clave truncada del panel de Clerk (con "…" o "•"), que rompe la cabecera
 * Authorization con "Headers must be ASCII".
 */
function keyProblem(): string | null {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  const sk = process.env.CLERK_SECRET_KEY ?? "";
  if (!pk) return "Falta NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.";
  if (!sk) return "Falta CLERK_SECRET_KEY.";
  const bad = [...sk].findIndex((c) => c.charCodeAt(0) > 126 || c.charCodeAt(0) < 33);
  if (bad !== -1) return `CLERK_SECRET_KEY tiene un carácter no válido en la posición ${bad + 1} (¿copiaste la clave truncada con "…" o espacios?). Cópiala completa desde Clerk → API Keys.`;
  if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(sk)) return "CLERK_SECRET_KEY no tiene el formato esperado (sk_test_… o sk_live_…).";
  if (!/^pk_(test|live)_[A-Za-z0-9+/=_-]+$/.test(pk)) return "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no tiene el formato esperado (pk_test_… o pk_live_…).";
  if (pk.slice(3, 7) !== sk.slice(3, 7)) return "Las claves son de entornos distintos (una es test y la otra live).";
  return null;
}

/**
 * Respuesta cuando no se puede verificar la sesión. Nunca deja pasar a una ruta privada, y tampoco
 * redirige al login: si el navegador ya tiene sesión, esa página lo devolvería a /panel y se formaría un bucle.
 */
function authUnavailable(request: NextRequest) {
  if (isApiRoute(request)) {
    return NextResponse.json({ error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." }, { status: 503 });
  }
  return NextResponse.rewrite(new URL("/error-autenticacion", request.url), { status: 503 });
}

/**
 * Clerk solo se ejecuta en las rutas que lo necesitan (ver `matcher`). La portada y las páginas de
 * acceso quedan fuera, así que una clave mal configurada no tumba todo el sitio.
 */
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const problem = keyProblem();
  if (problem) {
    console.error(`[middleware] Configuración de Clerk inválida: ${problem}`);
    return authUnavailable(request);
  }
  try {
    return await clerk(request, event);
  } catch (error) {
    console.error("[middleware] Clerk no pudo verificar la sesión. Revisa que CLERK_SECRET_KEY sea de la misma instancia que la clave pública.", error);
    return authUnavailable(request);
  }
}

export const config = {
  matcher: ["/panel/:path*", "/cuenta/:path*", "/api/:path*", "/trpc/:path*"],
};
