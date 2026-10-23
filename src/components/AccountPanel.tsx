"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Activity, ArrowLeft, CheckCircle2, Cloud, LogOut, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";
import { getCurrentSession, signInWithPassword, signOut, signUpWithPassword, type AuthSession } from "@/lib/supabase-auth";

type Mode = "login" | "signup";

export function AccountPanel() {
  const [mode, setMode] = useState<Mode>("login");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getCurrentSession()
      .then((current) => { if (active) setSession(current); })
      .catch(() => { if (active) setSession(null); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      if (mode === "login") {
        const next = await signInWithPassword(email.trim(), password);
        setSession(next);
        setPassword("");
        setMessage("Sesión iniciada. La sincronización de tus datos se incorporará en la siguiente parte de esta etapa.");
      } else {
        const result = await signUpWithPassword(email.trim(), password);
        setSession(result.session);
        setPassword("");
        setMessage(result.confirmationRequired
          ? "Cuenta creada. Revisa tu correo y confirma la dirección antes de iniciar sesión."
          : "Cuenta creada e iniciada correctamente.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo completar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  }

  async function logout() {
    setSubmitting(true);
    setError("");
    try {
      await signOut();
      setSession(null);
      setMessage("Has cerrado sesión.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cerrar sesión.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/" className="inline-flex items-center gap-2 rounded-lg text-sm text-muted transition hover:text-chalk">
        <ArrowLeft size={16} aria-hidden /> Volver a GYMRAT
      </Link>

      <section className="mt-8 overflow-hidden rounded-3xl border border-line/70 bg-panel shadow-xl">
        <div className="border-b border-line/70 bg-gradient-to-br from-flame/10 via-panel to-raised/40 p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-flame text-ink">
            <Activity size={24} aria-hidden />
          </div>
          <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-flame">GYMRAT · CUENTA</p>
          <h1 className="mt-2 text-3xl">Tus datos, bajo tu cuenta</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            Inicia sesión o crea una cuenta para preparar el acceso seguro a tu espacio personal.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          {busy ? (
            <p className="text-sm text-muted">Comprobando sesión…</p>
          ) : session ? (
            <div>
              <div className="flex items-start gap-3 rounded-2xl border border-line/70 bg-ink/30 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flame/10 text-flame"><UserRound size={20} aria-hidden /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Sesión activa</p>
                  <p className="mt-1 break-all text-sm text-muted">{session.user.email ?? "Correo no disponible"}</p>
                  <p className="mt-2 break-all text-xs text-muted">ID de usuario: {session.user.id}</p>
                </div>
                <CheckCircle2 className="shrink-0 text-flame" size={20} aria-hidden />
              </div>
              <button type="button" onClick={logout} disabled={submitting} className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold transition hover:bg-raised disabled:opacity-60">
                <LogOut size={16} aria-hidden /> {submitting ? "Procesando…" : "Cerrar sesión"}
              </button>
              <p className="mt-4 text-sm text-muted">La cuenta ya puede autenticarse. La sincronización automática del progreso aún no está activada.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink/50 p-1" role="tablist" aria-label="Tipo de acceso">
                <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setMessage(""); setError(""); }} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${mode === "login" ? "bg-raised text-chalk shadow" : "text-muted hover:text-chalk"}`}>Iniciar sesión</button>
                <button type="button" role="tab" aria-selected={mode === "signup"} onClick={() => { setMode("signup"); setMessage(""); setError(""); }} className={`min-h-10 rounded-lg px-3 text-sm font-semibold transition ${mode === "signup" ? "bg-raised text-chalk shadow" : "text-muted hover:text-chalk"}`}>Crear cuenta</button>
              </div>

              <form onSubmit={submit} className="mt-6 space-y-4">
                <label className="block text-sm font-medium">
                  Correo electrónico
                  <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-line bg-ink/60 px-3 text-chalk outline-none transition focus:border-flame" placeholder="tu@correo.com" />
                </label>
                <label className="block text-sm font-medium">
                  Contraseña
                  <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1.5 min-h-12 w-full rounded-xl border border-line bg-ink/60 px-3 text-chalk outline-none transition focus:border-flame" placeholder="Mínimo 6 caracteres" />
                </label>
                <button type="submit" disabled={submitting} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-flame px-4 font-semibold text-ink transition hover:brightness-110 disabled:opacity-60">
                  {submitting ? "Procesando…" : mode === "login" ? "Entrar a mi cuenta" : "Crear mi cuenta"}
                </button>
              </form>
            </>
          )}

          {message && <p role="status" className="mt-5 rounded-xl border border-flame/30 bg-flame/5 p-3 text-sm leading-6">{message}</p>}
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose/30 bg-rose/5 p-3 text-sm leading-6 text-rose">{error}</p>}

          <div className="mt-6 space-y-3 border-t border-line/70 pt-5">
            <p className="flex items-start gap-2 text-xs leading-5 text-muted"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-flame" aria-hidden /> La aplicación usa la clave pública del proyecto. Nunca necesita una clave service_role en el navegador.</p>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted"><Cloud size={16} className="mt-0.5 shrink-0 text-flame" aria-hidden /> Por ahora, iniciar sesión no mueve ni elimina los datos que ya guardaste en este dispositivo.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
