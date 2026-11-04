"use client";

import Link from "next/link";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { ShieldCheck, Trash2, UserX } from "lucide-react";
import { clearStoredUserData, useStore } from "@/lib/store";
import { Card, SectionTitle } from "./ui";

/** Clerk solo existe si hay clave pública; esa condición es fija en cada despliegue. */
const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

interface ConfirmProps {
  title: string;
  description: string;
  openLabel: string;
  word: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  icon: "trash" | "user";
}

/** Acción destructiva con confirmación: hay que escribir una palabra para habilitar el botón. */
function ConfirmAction({ title, description, openLabel, word, confirmLabel, onConfirm, icon }: ConfirmProps) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const Icon = icon === "trash" ? Trash2 : UserX;
  const matches = typed.trim().toUpperCase() === word;
  const inputId = `confirm-${word.toLowerCase()}`;

  const run = async () => {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la acción. Inténtalo de nuevo.");
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-rose/30 p-4">
      <h3 className="text-lg">{title}</h3>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {!open ? (
        <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose/40 px-4 text-sm text-rose transition-colors duration-200 hover:bg-rose/10">
          <Icon size={16} aria-hidden /> {openLabel}
        </button>
      ) : (
        <div className="mt-3 space-y-3">
          <label htmlFor={inputId} className="block text-sm font-medium">
            Para confirmar, escribe <strong className="tracking-wider">{word}</strong>
          </label>
          <input id={inputId} className="field-input sm:max-w-[240px]" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="characters" disabled={busy} />
          {error && (
            <p role="alert" className="rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void run()} disabled={!matches || busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose px-5 text-sm font-semibold text-ink transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Procesando…" : confirmLabel}
            </button>
            <button type="button" onClick={() => { setOpen(false); setTyped(""); setError(""); }} disabled={busy} className="min-h-11 rounded-xl px-4 text-sm text-muted transition-colors duration-200 hover:text-chalk">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteAccount() {
  const { signOut } = useClerk();
  const { userId } = useStore();
  const run = async () => {
    const response = await fetch("/api/account", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: "ELIMINAR" }) });
    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(result?.error || "No se pudo eliminar la cuenta. Inténtalo de nuevo.");
    }
    clearStoredUserData(userId);
    try {
      await signOut({ redirectUrl: "/?cuenta=eliminada" });
    } catch {
      window.location.assign("/?cuenta=eliminada");
    }
  };
  return (
    <ConfirmAction
      icon="user"
      title="Eliminar mi cuenta"
      description="Borra tus datos y también tu cuenta de acceso (correo e inicio de sesión). No se puede deshacer. Descarga una copia antes si quieres conservarla."
      openLabel="Eliminar mi cuenta…"
      word="ELIMINAR"
      confirmLabel="Eliminar cuenta definitivamente"
      onConfirm={run}
    />
  );
}

export function PrivacyCard() {
  const { eraseAllData } = useStore();
  const [done, setDone] = useState("");
  return (
    <Card>
      <SectionTitle title="Privacidad y datos" hint="Tú decides qué pasa con tu información. Puedes descargarla, borrarla o eliminar tu cuenta cuando quieras." />
      <p className="flex items-start gap-2 text-sm text-muted">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" aria-hidden />
        <span>
          Guardamos tu perfil, entrenamientos, comidas, medidas y sueño solo para calcular tus metas y mostrarte tu progreso. No los vendemos ni los usamos para publicidad. Lee la{" "}
          <Link href="/privacidad" className="text-chalk underline underline-offset-2">Política de privacidad</Link> y los{" "}
          <Link href="/terminos" className="text-chalk underline underline-offset-2">Términos de uso</Link>.
        </span>
      </p>
      <p className="mt-3 text-sm text-muted">Para llevarte una copia, usa «Descargar copia (JSON)» en la tarjeta de copia de seguridad.</p>

      {done && (
        <p role="status" className="mt-4 rounded-xl border border-ok/30 bg-ok/10 p-3 text-sm text-chalk">
          {done}
        </p>
      )}

      <div className="mt-5 space-y-4">
        <ConfirmAction
          icon="trash"
          title="Borrar mis datos"
          description="Elimina todo lo que guardamos de ti, en la nube y en este dispositivo: perfil, entrenamientos, comidas, medidas y sueño. Tu cuenta sigue activa y tendrás que completar el registro otra vez."
          openLabel="Borrar mis datos…"
          word="BORRAR"
          confirmLabel="Borrar mis datos definitivamente"
          onConfirm={async () => {
            await eraseAllData();
            setDone("Tus datos se borraron de la nube y de este dispositivo.");
          }}
        />
        {clerkEnabled && <DeleteAccount />}
      </div>
    </Card>
  );
}
