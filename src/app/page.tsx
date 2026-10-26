"use client";

import Link from "next/link";
import { Activity, ArrowRight, BarChart3, CheckCircle2, Dumbbell, HeartPulse, ShieldCheck, TrendingUp, Utensils, Waves } from "lucide-react";

const features = [
  { icon: Dumbbell, title: "Entrenamiento con intención", description: "Organiza tus rutinas, registra tus series y sigue construyendo fuerza sesión a sesión." },
  { icon: HeartPulse, title: "Progreso corporal", description: "Registra peso y medidas para entender tu evolución más allá de un solo número." },
  { icon: Utensils, title: "Nutrición y hábitos", description: "Ten a mano tus comidas, hidratación y objetivos diarios en un solo espacio." },
  { icon: BarChart3, title: "Datos que cuentan tu historia", description: "Consulta tus registros y reconoce las tendencias que te ayudan a mejorar." },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-3" aria-label="GYMRAT, página principal">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-flame text-ink shadow-lg shadow-flame/20"><Dumbbell size={23} strokeWidth={2.5} /></span>
          <span><span className="block text-xl font-semibold tracking-[0.18em]">GYMRAT</span><span className="block text-[10px] tracking-[0.2em] text-muted">ENTRENA · REGISTRA · EVOLUCIONA</span></span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Navegación principal">
          <Link href="/iniciar-sesion" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:text-chalk sm:px-4">Iniciar sesión</Link>
          <Link href="/crear-cuenta" className="inline-flex items-center gap-2 rounded-xl bg-flame px-4 py-2.5 text-sm font-bold text-ink transition hover:brightness-110">Crear cuenta <ArrowRight size={16} /></Link>
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-12 sm:px-8 sm:pb-28 sm:pt-20 lg:grid-cols-[1.08fr_0.92fr] lg:px-12 lg:pt-24">
        <div className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-flame/10 blur-3xl" />
        <div className="relative z-[1]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-flame/25 bg-flame/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-flame"><Waves size={14} /> TU PROGRESO, CON DIRECCIÓN</div>
          <h1 className="max-w-3xl text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">CONSTRUYE UNA VERSIÓN <span className="text-flame">MÁS FUERTE</span> DE TI.</h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">GYMRAT reúne tus entrenamientos, medidas corporales, nutrición y hábitos para que puedas seguir tu evolución con claridad y constancia.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/crear-cuenta" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-flame px-6 font-bold text-ink transition hover:-translate-y-0.5 hover:brightness-110">Empieza gratis <ArrowRight size={18} /></Link>
            <Link href="/iniciar-sesion" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-panel/70 px-6 font-semibold transition hover:border-flame/50 hover:bg-raised">Ya tengo una cuenta</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-flame" /> Tu evolución, paso a paso</span>
            <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-flame" /> Espacio personal por cuenta</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 rounded-[2rem] bg-flame/10 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-line/80 bg-panel/90 p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between border-b border-line/70 pb-5">
              <div><p className="text-xs font-semibold tracking-[0.2em] text-flame">TU ESPACIO PERSONAL</p><h2 className="mt-2 text-2xl">El progreso se construye</h2></div>
              <span className="rounded-xl bg-flame/10 p-3 text-flame"><Activity size={22} /></span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-line/70 bg-ink/40 p-4"><p className="text-xs text-muted">Entrenamientos</p><p className="mt-2 text-2xl font-semibold">Constancia</p><p className="mt-1 text-xs text-muted">Registra cada sesión</p></div>
              <div className="rounded-2xl border border-line/70 bg-ink/40 p-4"><p className="text-xs text-muted">Medidas</p><p className="mt-2 text-2xl font-semibold">Evolución</p><p className="mt-1 text-xs text-muted">Observa tus tendencias</p></div>
            </div>
            <div className="mt-3 rounded-2xl border border-line/70 bg-ink/40 p-4">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">Tu camino, tus datos</span><TrendingUp size={18} className="text-flame" /></div>
              <div className="mt-4 flex h-20 items-end gap-2" aria-hidden="true">{[30, 42, 36, 57, 49, 72, 64, 88, 78, 100].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-flame/80" style={{ height: height + "%" }} />)}</div>
              <p className="mt-3 text-xs leading-5 text-muted">Una vista ilustrativa: tus estadísticas reales aparecen al registrar tus propios datos.</p>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-line/60 px-4 py-3"><ShieldCheck size={19} className="shrink-0 text-flame" /><p className="text-xs leading-5 text-muted">Cada persona debe acceder con su cuenta para consultar su espacio privado.</p></div>
          </div>
        </div>
      </section>

      <section id="funciones" className="border-y border-line/60 bg-panel/45">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.22em] text-flame">TODO CONECTADO A TU OBJETIVO</p><h2 className="mt-3 text-3xl sm:text-4xl">Menos improvisación. Más conciencia de tu progreso.</h2><p className="mt-4 leading-7 text-muted">Herramientas para registrar lo que haces, entender tus hábitos y mantener el foco en el largo plazo.</p></div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => <article key={title} className="rounded-2xl border border-line/70 bg-panel p-5 transition hover:-translate-y-1 hover:border-flame/40"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-flame/10 text-flame"><Icon size={22} /></span><h3 className="mt-5 text-lg">{title}</h3><p className="mt-3 text-sm leading-6 text-muted">{description}</p></article>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-12">
        <p className="text-xs font-bold tracking-[0.22em] text-flame">TU SIGUIENTE PASO EMPIEZA AQUÍ</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl sm:text-4xl">No necesitas hacerlo perfecto. Necesitas poder seguir avanzando.</h2>
        <p className="mx-auto mt-4 max-w-xl leading-7 text-muted">Crea tu cuenta para entrar en tu espacio personal de GYMRAT.</p>
        <Link href="/crear-cuenta" className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-flame px-6 font-bold text-ink transition hover:brightness-110">Crear mi cuenta <ArrowRight size={18} /></Link>
      </section>

      <footer className="border-t border-line/60 px-5 py-6 text-center text-xs text-muted">© {new Date().getFullYear()} GYMRAT · Entrena con intención. Mide tu evolución.</footer>
    </main>
  );
}
