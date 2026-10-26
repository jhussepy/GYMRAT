import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

/** Páginas que exigen sesión. */
const isPrivateRoute = createRouteMatcher(["/panel(.*)", "/cuenta(.*)"]);
const isApiRoute = createRouteMatcher(["/api(.*)", "/trpc(.*)"]);

const clerk = clerkMiddleware(async (auth, request) => {
  if (isPrivateRoute(request)) await auth.protect();
});

const clerkConfigured = () => Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

/** Respuesta segura cuando no se puede verificar la sesión: nunca deja pasar a una ruta privada. */
function authUnavailable(request: NextRequest) {
  if (isApiRoute(request)) {
    return NextResponse.json({ error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." }, { status: 503 });
  }
  return NextResponse.redirect(new URL("/iniciar-sesion", request.url));
}

/**
 * Clerk solo se ejecuta en las rutas que lo necesitan (ver `matcher`). La portada y las páginas de
 * acceso quedan fuera, así que una clave mal configurada ya no tumba todo el sitio con un error 500.
 * Si Clerk falla en una ruta protegida, se cierra el acceso (fail closed) en lugar de lanzar la excepción.
 */
export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (!clerkConfigured()) {
    console.error("[middleware] Faltan NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY o CLERK_SECRET_KEY en las variables de entorno.");
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
