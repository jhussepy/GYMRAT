import Link from "next/link";

export const metadata = { title: "Autenticación no disponible · GYMRAT", robots: { index: false } };

export default function AuthErrorPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl">No pudimos verificar tu sesión</h1>
      <p className="mt-4 text-sm text-muted">
        El servicio de acceso no está disponible en este momento. Tu cuenta y tus datos no se han perdido. Si eres quien administra la app, revisa las claves de Clerk en las variables de entorno del despliegue.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/panel" className="min-h-[44px] rounded-sm bg-flame px-6 py-3 font-medium text-ink transition-[filter] duration-200 hover:brightness-110">
          Reintentar
        </Link>
        <Link href="/" className="min-h-[44px] rounded-sm border border-line px-6 py-3 transition-colors duration-200 hover:bg-raised">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
