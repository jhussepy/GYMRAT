import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/panel" className="inline-flex items-center gap-2 rounded-lg text-sm text-muted transition hover:text-chalk">
        <ArrowLeft size={16} aria-hidden /> Volver a GYMRAT
      </Link>

      <header className="my-8">
        <p className="text-xs font-semibold tracking-[0.2em] text-flame">GYMRAT · CUENTA</p>
        <h1 className="mt-2 text-3xl">Tu cuenta y seguridad</h1>
        <p className="mt-3 text-sm text-muted">Gestiona tu perfil, correo y opciones de seguridad de forma segura.</p>
      </header>

      {clerkConfigured ? (
        <div className="flex justify-center">
          <UserProfile routing="hash" />
        </div>
      ) : (
        <section role="status" className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 shrink-0 text-flame" size={22} aria-hidden />
            <div>
              <h2 className="text-lg font-semibold">La gestión de cuenta aún no está configurada</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Para habilitar esta sección, configura la variable NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY en el entorno de despliegue
                y vuelve a desplegar la aplicación. El resto de GYMRAT puede compilarse sin esas credenciales.
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
