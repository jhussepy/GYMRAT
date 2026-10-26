"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Menu,
  Moon,
  CalendarDays,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { useState } from "react";

const features = [
  {
    number: "01",
    icon: CalendarDays,
    title: "MI DÍA",
    description: "Tu plan diario, claro y organizado. Entra, revisa tus objetivos y ejecuta.",
    extra: "No tareas pendientes",
    kind: "day",
  },
  {
    number: "02",
    icon: Dumbbell,
    title: "RUTINA",
    description: "Registra tus sesiones, controla las series y construye fuerza con intención.",
    extra: "CONSISTENCIA > EXCUSAS",
    kind: "routine",
  },
  {
    number: "03",
    icon: Utensils,
    title: "MENÚ",
    description: "Mantén tus comidas y objetivos nutricionales alineados con tu entrenamiento.",
    extra: "MACROS",
    kind: "menu",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "PROGRESO",
    description: "Sigue tus medidas y evolución con datos que te ayudan a tomar decisiones.",
    extra: "TU EVOLUCIÓN, VISIBLE",
    kind: "progress",
  },
];

const bars = [30, 45, 38, 61, 50, 76, 64, 91];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="gymrat-landing min-h-screen overflow-hidden bg-[#111111] text-white">
      <div className="industrial-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />
      <header className="relative z-20 border-b border-white/[0.07] bg-[#111111]/85 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[78px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 xl:px-12">
          <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="GYMRAT inicio">
            <span className="flex h-10 w-10 items-center justify-center bg-[#E63946] text-[#111111] transition-transform group-hover:-rotate-6">
              <Dumbbell size={23} strokeWidth={2.8} />
            </span>
            <span className="flex items-center gap-3">
              <span className="font-display text-[25px] leading-none tracking-[0.04em] text-[#E63946]">GYMRAT</span>
              <span className="hidden h-6 w-px bg-white/25 sm:block" />
              <span className="hidden text-[10px] font-bold tracking-[0.24em] text-white sm:block">COACH PRO</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navegación principal">
            <a className="nav-link nav-link-active" href="#inicio">Inicio</a>
            <a className="nav-link" href="#funciones">Características</a>
            <a className="nav-link" href="#como-funciona">Cómo funciona</a>
            <a className="nav-link" href="#planes">Planes</a>
            <a className="nav-link" href="#comunidad">Comunidad</a>
          </nav>

          <div className="hidden items-center gap-5 md:flex">
            <Link href="/iniciar-sesion" className="text-xs font-bold uppercase tracking-[0.08em] text-[#CCCCCC] transition hover:text-white">Iniciar sesión</Link>
            <Link href="/crear-cuenta" className="red-button px-5 py-3 text-[11px]">Probar gratis <ArrowRight size={14} /></Link>
            <span className="flex h-9 w-9 items-center justify-center border border-white/10 text-white/70" aria-hidden="true"><CircleUserRound size={17} /></span>
            <span className="text-white/55" aria-hidden="true"><Moon size={17} /></span>
          </div>

          <button className="flex h-10 w-10 items-center justify-center border border-white/15 text-white md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-white/10 bg-[#171717] px-5 py-5 md:hidden" aria-label="Menú móvil">
            <div className="flex flex-col gap-1">
              {[["Inicio", "#inicio"], ["Características", "#funciones"], ["Cómo funciona", "#como-funciona"], ["Planes", "#planes"], ["Comunidad", "#comunidad"]].map(([label, href]) => (
                <a key={label} href={href} onClick={() => setMenuOpen(false)} className="px-3 py-3 text-sm font-semibold text-white/75 hover:bg-white/5 hover:text-white">{label}</a>
              ))}
              <Link href="/iniciar-sesion" className="mt-2 border-t border-white/10 px-3 py-4 text-sm font-bold text-white/80">Iniciar sesión</Link>
              <Link href="/crear-cuenta" className="red-button justify-center px-5 py-3 text-xs">Probar gratis <ArrowRight size={15} /></Link>
            </div>
          </nav>
        )}
      </header>

      <section id="inicio" className="relative z-10 mx-auto grid min-h-[650px] max-w-[1440px] items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8 lg:px-12 lg:py-20 xl:px-16">
        <div className="relative z-10 max-w-[610px]">
          <div className="mb-7 flex items-center gap-3 text-[11px] font-extrabold tracking-[0.24em] text-[#E63946]">
            <span className="h-[2px] w-9 bg-[#E63946]" />
            TU PROGRESO, ENFOCADO
          </div>
          <h1 className="font-display text-[clamp(5.5rem,12vw,10.5rem)] leading-[0.77] tracking-[-0.035em] text-white">
            GYM<span className="text-[#E63946]">RAT</span>
          </h1>
          <div className="mt-8 max-w-[530px] border-l-2 border-[#E63946] pl-5">
            <p className="text-sm font-bold uppercase leading-7 tracking-[0.12em] text-[#CCCCCC] sm:text-base">
              El sistema de entrenamiento para los que se toman el progreso en serio.
            </p>
          </div>
          <p className="mt-5 max-w-[490px] text-sm leading-7 text-[#8F8F8F]">
            Entrenamiento, nutrición y evolución corporal en un solo lugar. Menos improvisación. Más disciplina. Datos reales para seguir avanzando.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link href="/crear-cuenta" className="red-button min-h-[54px] px-7 text-xs">Empezar ahora <ChevronRight size={17} /></Link>
            <a href="#funciones" className="group inline-flex min-h-[54px] items-center gap-3 px-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75 transition hover:text-white">
              Explorar plataforma <ArrowDownRight size={16} className="text-[#E63946] transition-transform group-hover:translate-y-1" />
            </a>
          </div>
          <p className="mt-4 text-[10px] tracking-[0.04em] text-[#666666]">Sin tarjeta de crédito <span className="mx-2 text-[#E63946]">·</span> Prueba gratuita de 7 días</p>
          <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-white/10 pt-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#A0A0A0]"><span className="h-1.5 w-1.5 rounded-full bg-[#E63946]" /> Entrena con intención</div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#A0A0A0]"><span className="h-1.5 w-1.5 rounded-full bg-[#E63946]" /> Mide tu evolución</div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[720px] lg:ml-auto">
          <div className="absolute -inset-8 bg-[#E63946]/[0.07] blur-[70px]" />
          <div className="hero-image-frame relative aspect-[4/4.2] overflow-hidden border border-white/10 bg-[#1A1A1A] sm:aspect-[5/4] lg:aspect-[0.95/1]">
            <img
              src="https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=1400&q=85"
              alt="Atleta entrenando con pesas en un gimnasio industrial"
              className="absolute inset-0 h-full w-full object-cover object-center grayscale-[35%]"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111111]/55 via-transparent to-[#111111]/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-[#111111]/15" />
            <div className="absolute inset-0 border-[10px] border-[#111111]/15" />
            <div className="absolute left-5 top-5 flex items-center gap-2 border border-white/20 bg-[#111111]/70 px-3 py-2 backdrop-blur-md sm:left-7 sm:top-7">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#E63946]" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Modo disciplina</span>
            </div>
            <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#E63946]">NO HAY ATAJOS</p>
              <p className="mt-2 max-w-md font-display text-4xl uppercase leading-[0.95] sm:text-5xl lg:text-6xl">El trabajo habla.</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/25 pt-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.17em] text-white/70">Fuerza · Constancia · Progreso</span>
                <span className="font-display text-xl text-[#E63946]">01 / 04</span>
              </div>
            </div>
            <div className="absolute right-0 top-1/3 hidden -translate-y-1/2 bg-[#E63946] px-3 py-4 text-[#111111] sm:block">
              <Activity size={20} />
            </div>
          </div>
          <div className="absolute -bottom-4 -left-3 hidden border border-white/10 bg-[#1B1B1B] px-4 py-3 shadow-2xl sm:flex sm:items-center sm:gap-3 lg:-left-8">
            <span className="flex h-9 w-9 items-center justify-center bg-[#E63946]/10 text-[#E63946]"><TrendingUp size={18} /></span>
            <span><span className="block text-[9px] font-bold uppercase tracking-[0.15em] text-[#777777]">Tu enfoque</span><span className="mt-1 block text-xs font-bold">Progreso medible</span></span>
          </div>
        </div>
      </section>

      <section id="funciones" className="relative z-10 border-y border-white/[0.08] bg-[#181818]/90">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-16">
          <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.25em] text-[#E63946]">EL SISTEMA GYMRAT</p>
              <h2 className="mt-3 font-display text-4xl uppercase leading-none sm:text-5xl">Funciones clave <span className="text-[#E63946]">/</span></h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-[#A0A0A0] md:text-right">Todo lo que necesitas para tu progreso diario, en un solo lugar.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ number, icon: Icon, title, description, extra, kind }) => (
              <article key={title} className="feature-card group relative min-h-[265px] overflow-hidden border border-white/[0.09] bg-[#202020] p-5 transition duration-300 hover:-translate-y-1 hover:border-[#E63946]/60 sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="flex h-11 w-11 items-center justify-center border border-[#E63946]/25 bg-[#E63946]/[0.08] text-[#E63946] transition group-hover:bg-[#E63946] group-hover:text-[#111111]"><Icon size={21} strokeWidth={1.8} /></span>
                  <span className="font-display text-sm tracking-[0.12em] text-white/25">{number}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl tracking-[0.04em]">{title}</h3>
                <p className="mt-2 max-w-xs text-xs leading-6 text-[#A0A0A0]">{description}</p>
                <div className="mt-5 flex min-h-7 items-center justify-between gap-3 border-t border-white/[0.08] pt-4">
                  {kind === "day" && <span className="inline-flex items-center gap-1.5 border border-emerald-500/20 bg-emerald-500/[0.07] px-2 py-1 text-[9px] font-semibold text-emerald-400"><Check size={11} /> No tareas</span>}
                  {kind === "routine" && <div className="flex h-7 items-end gap-1" aria-label="Gráfico decorativo de actividad">{bars.slice(0, 7).map((height, i) => <span key={i} className="w-2 rounded-t-sm bg-[#E63946]/70 transition group-hover:bg-[#E63946]" style={{ height: height + "%" }} />)}</div>}
                  {kind === "menu" && <span className="text-[9px] font-bold tracking-[0.2em] text-[#E63946]">MACROS</span>}
                  {kind === "progress" && <svg viewBox="0 0 116 30" className="h-8 w-28 overflow-visible" role="img" aria-label="Línea de progreso ascendente"><path d="M1 26 L20 21 L36 23 L53 13 L69 17 L87 7 L101 10 L115 2" fill="none" stroke="#E63946" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 26 L20 21 L36 23 L53 13 L69 17 L87 7 L101 10 L115 2 L115 30 L1 30Z" fill="#E63946" fillOpacity=".09" /></svg>}
                  <span className="text-[8px] font-bold uppercase tracking-[0.13em] text-white/30">{kind === "day" ? "Enfoque diario" : kind === "routine" ? "Entrena mejor" : kind === "menu" ? "Nutrición" : "Evolución"}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="relative z-10 mx-auto grid max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-12 xl:px-16">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.25em] text-[#E63946]">SIMPLE. DIRECTO. EFECTIVO.</p>
          <h2 className="mt-4 max-w-xl font-display text-4xl uppercase leading-[0.98] sm:text-5xl">Tu progreso no se deja al azar.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[["01", "Registra", "Anota tus entrenamientos y medidas."], ["02", "Analiza", "Observa tus hábitos y tendencias."], ["03", "Evoluciona", "Ajusta el plan y sigue avanzando."]].map(([n, title, description]) => (
            <div key={n} className="border-t-2 border-[#E63946] bg-[#1B1B1B] p-4">
              <span className="font-display text-3xl text-[#E63946]/70">{n}</span>
              <h3 className="mt-4 font-display text-xl uppercase">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-[#999999]">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="planes" className="relative z-10 border-y border-white/[0.08] bg-[#191919]">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
          <div><p className="text-[10px] font-extrabold tracking-[0.25em] text-[#E63946]">EMPIEZA HOY</p><h2 className="mt-3 font-display text-3xl uppercase sm:text-4xl">El siguiente nivel empieza contigo.</h2><p className="mt-3 text-sm text-[#A0A0A0]">Crea tu cuenta y prepara tu espacio de entrenamiento personal.</p></div>
          <Link href="/crear-cuenta" className="red-button min-h-[52px] shrink-0 px-7 text-xs">Probar gratis <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer id="comunidad" className="relative z-10 mx-auto flex max-w-[1440px] flex-col gap-4 px-5 py-7 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#666666] sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12 xl:px-16">
        <Link href="/" className="font-display text-xl tracking-[0.05em] text-[#E63946]">GYMRAT <span className="text-white/65">COACH PRO</span></Link>
        <p>Entrena con intención. Mide tu evolución.</p>
        <p>© {new Date().getFullYear()} GYMRAT. Todos los derechos reservados.</p>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600;700;800&display=swap');
        .gymrat-landing { font-family: 'Inter', Arial, sans-serif; }
        .gymrat-landing .font-display { font-family: 'Anton', Impact, sans-serif; font-weight: 400; }
        .industrial-grid {
          background-image: linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px), radial-gradient(ellipse at 72% 18%, rgba(230,57,70,.07), transparent 35%);
          background-size: 44px 44px, 44px 44px, auto;
          opacity: .52;
        }
        .nav-link { position: relative; color: #a0a0a0; font-size: 11px; font-weight: 700; transition: color .2s ease; }
        .nav-link:hover, .nav-link-active { color: #fff; }
        .nav-link-active::after { position: absolute; bottom: -30px; left: 0; height: 2px; width: 100%; background: #E63946; content: ''; }
        .red-button { display: inline-flex; align-items: center; justify-content: center; gap: 10px; background: #E63946; color: #fff; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; transition: transform .2s ease, background .2s ease, box-shadow .2s ease; }
        .red-button:hover { background: #f04754; box-shadow: 0 8px 28px rgba(230,57,70,.2); transform: translateY(-1px); }
        .hero-image-frame::after { position: absolute; inset: 0; border: 1px solid rgba(255,255,255,.06); content: ''; pointer-events: none; }
        @media (max-width: 640px) { .nav-link-active::after { display: none; } }
      `}</style>
    </main>
  );
}
