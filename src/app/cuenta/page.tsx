import { UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AccountPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-8 sm:px-6">
      <Link href="/panel" className="inline-flex items-center gap-2 rounded-lg text-sm text-muted transition hover:text-chalk"><ArrowLeft size={16} aria-hidden /> Volver a GYMRAT</Link>
      <header className="my-8"><p className="text-xs font-semibold tracking-[0.2em] text-flame">GYMRAT · CUENTA</p><h1 className="mt-2 text-3xl">Tu cuenta y seguridad</h1><p className="mt-3 text-sm text-muted">Gestiona tu perfil, correo y opciones de seguridad de forma segura.</p></header>
      <div className="flex justify-center"><UserProfile routing="hash" /></div>
    </main>
  );
}
