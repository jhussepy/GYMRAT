import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Dumbbell, TrendingUp, Utensils } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProductPreview } from "@/components/landing/ProductPreview";
import { HERO_BLUR } from "@/components/landing/hero-blur";
import "./landing.css";

const STATS = [
  { value: "4", label: "pasos para armar tu plan personal" },
  { value: "2–6", label: "días de rutina, según tu semana" },
  { value: "24", unit: "h", label: "de tu día en un solo reloj" },
  { value: "JSON", label: "tus datos, descargables cuando quieras" },
];

const FEATURES = [
  { n: "01", icon: CalendarDays, title: "Mi día", text: "Tu jornada completa en un reloj de 24 horas, con tus propios horarios.", bullets: ["Sueño, trabajo, comidas y entreno", "Agua del día y límite de cafeína"] },
  { n: "02", icon: Dumbbell, title: "Rutina", text: "Una rutina de 2 a 6 días que se arma según los días que elijas.", bullets: ["Series con kg y repeticiones", "Cronómetro de descanso con aviso"] },
  { n: "03", icon: Utensils, title: "Menú", text: "Lo que comes, medido contra tus metas de calorías y proteína.", bullets: ["Calorías y proteína por comida", "Catálogo para registrar en segundos"] },
  { n: "04", icon: TrendingUp, title: "Progreso", text: "Tu evolución a la vista, sin adivinar si vas bien.", bullets: ["Calendario con rachas de constancia", "Peso, composición corporal y sueño"] },
];

const STEPS = [
  { n: "01", title: "Crea tu cuenta", text: "Con tu correo, en menos de un minuto." },
  { n: "02", title: "Cuéntanos de ti", text: "Cuatro pasos: tu cuerpo, tu objetivo, tu día y tus metas. Calculamos tus calorías, tu proteína y tu agua." },
  { n: "03", title: "Entrena y registra", text: "Sigue tu rutina, anota tus series y mira cómo cambia tu progreso semana a semana." },
];

const FAQ = [
  { q: "¿Tiene costo?", a: "Hoy puedes crear tu cuenta y usar GYMRAT sin tarjeta de crédito." },
  { q: "¿Dónde se guardan mis datos?", a: "En tu cuenta: se guardan en tu navegador y se sincronizan con la base de datos de GYMRAT para que los veas desde cualquier dispositivo. Cada cuenta ve solo lo suyo y puedes descargar una copia en JSON cuando quieras." },
  { q: "¿Sirve si estoy empezando?", a: "Sí. Eliges entre 2 y 6 días por semana y la rutina se adapta a eso. Si tienes una condición médica, consúltalo antes con un profesional de la salud." },
  { q: "¿Necesito ir a un gimnasio?", a: "La rutina base usa máquinas y mancuernas, y cada ejercicio trae una alternativa por si el equipo está ocupado. El resto de la app (comidas, progreso, constancia) te sirve entrenes donde entrenes." },
  { q: "¿Quién puede usarlo?", a: "GYMRAT calcula metas de calorías solo para mayores de 18 años. Las cifras son estimaciones y no reemplazan el consejo de un profesional de la salud." },
];

export default function HomePage() {
  return (
    <div className="gymrat-landing">
      <a href="#contenido" className="sr-only focus:not-sr-only" style={{ position: "absolute", zIndex: 60, left: 8, top: 8, background: "#fff", color: "#000", padding: "10px 14px" }}>
        Saltar al contenido
      </a>
      <LandingHeader />

      <main id="contenido">
        <section id="inicio" aria-labelledby="titulo-principal">
          <div className="lp-banner">
            <Image
              src="/images/gymrat-hero.jpg"
              alt="GYMRAT, la fuerza viene de Dios: un atleta de rodillas frente a una barra cargada, en un gimnasio de ladrillo con luz entrando por el techo"
              width={1554}
              height={890}
              priority
              sizes="(min-width: 1440px) 1440px, 100vw"
              placeholder="blur"
              blurDataURL={HERO_BLUR}
            />
          </div>

          <div className="lp-wrap lp-intro">
            <div className="lp-rise">
              <p className="lp-eyebrow">Tu progreso, enfocado</p>
              <h1 id="titulo-principal" className="lp-title">
                <span className="sr-only">GYMRAT. </span>
                El sistema de entrenamiento para los que se toman el progreso <em>en serio</em>.
              </h1>
            </div>
            <div className="lp-rise lp-rise-2">
              <p className="lp-lead">Entrenamiento, nutrición y evolución corporal en un solo lugar. Menos improvisación, más disciplina, y datos reales para seguir avanzando.</p>
              <div className="lp-cta-row">
                <Link href="/crear-cuenta" className="lp-btn lp-btn-red">
                  Empezar ahora <ArrowRight size={17} aria-hidden />
                </Link>
                <a href="#funciones" className="lp-btn lp-btn-ghost">
                  Ver qué incluye
                </a>
              </div>
              <p className="lp-micro">
                Sin tarjeta de crédito<i>·</i>Listo en unos 2 minutos
              </p>
            </div>
          </div>
        </section>

        <div className="lp-stats">
          {STATS.map((s) => (
            <div className="lp-stat" key={s.label}>
              <strong>
                {s.value}
                {s.unit && <span>{s.unit}</span>}
              </strong>
              <p>{s.label}</p>
            </div>
          ))}
        </div>

        <section id="funciones" className="lp-section" aria-labelledby="titulo-funciones">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <p className="lp-eyebrow">El sistema GYMRAT</p>
                <h2 id="titulo-funciones" className="lp-h2">
                  Cuatro pilares, <em>un solo lugar</em>
                </h2>
              </div>
              <p className="lp-sub">Todo lo que necesitas para tu día a día, conectado: lo que entrenas, lo que comes y cómo cambia tu cuerpo.</p>
            </div>
            <div className="lp-cards">
              {FEATURES.map(({ n, icon: Icon, title, text, bullets }) => (
                <article className="lp-card" key={title}>
                  <div className="lp-card-top">
                    <span className="lp-card-icon">
                      <Icon size={22} strokeWidth={1.8} aria-hidden />
                    </span>
                    <span className="lp-card-num" aria-hidden>
                      {n}
                    </span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <ul>
                    {bullets.map((b) => (
                      <li key={b}>
                        <Check size={15} aria-hidden />
                        {b}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" style={{ paddingTop: 0 }} aria-labelledby="titulo-dentro">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <p className="lp-eyebrow">Por dentro</p>
                <h2 id="titulo-dentro" className="lp-h2">
                  Así se ve <em>tu día</em>
                </h2>
              </div>
              <p className="lp-sub">Reloj del día, rutina con tus series y tus metas del día en una sola mirada. Maqueta con datos de ejemplo.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="como-funciona" className="lp-section" style={{ paddingTop: 0 }} aria-labelledby="titulo-pasos">
          <div className="lp-wrap">
            <div className="lp-section-head">
              <div>
                <p className="lp-eyebrow">Simple. Directo. Efectivo.</p>
                <h2 id="titulo-pasos" className="lp-h2">
                  Tu progreso no se deja <em>al azar</em>
                </h2>
              </div>
              <p className="lp-sub">En unos minutos pasas de crear tu cuenta a tener tu plan, tus metas y tu rutina listos.</p>
            </div>
            <ol className="lp-steps" style={{ listStyle: "none", padding: 0 }}>
              {STEPS.map((s) => (
                <li className="lp-step" key={s.n}>
                  <span aria-hidden>{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="lp-band" aria-label="Lema de GYMRAT">
          <div className="lp-wrap">
            <h2>
              La fuerza viene <em>de Dios</em>.
            </h2>
            <p>Disciplina cada día y gratitud siempre. Tú pones el trabajo; GYMRAT te ayuda a verlo crecer.</p>
          </div>
        </section>

        <section id="preguntas" className="lp-section" aria-labelledby="titulo-preguntas">
          <div className="lp-wrap">
            <div className="lp-section-head" style={{ gridTemplateColumns: "1fr" }}>
              <div>
                <p className="lp-eyebrow">Preguntas</p>
                <h2 id="titulo-preguntas" className="lp-h2">
                  Lo que <em>más preguntan</em>
                </h2>
              </div>
            </div>
            <div className="lp-faq">
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-wrap" aria-labelledby="titulo-final">
          <div className="lp-final">
            <div>
              <h2 id="titulo-final">Empieza hoy. Cada registro cuenta.</h2>
              <p>Crea tu cuenta, cuéntanos de ti y deja que tu plan se arme solo.</p>
            </div>
            <div className="lp-cta-row" style={{ marginTop: 0 }}>
              <Link href="/crear-cuenta" className="lp-btn lp-btn-red">
                Crear mi cuenta <ArrowRight size={17} aria-hidden />
              </Link>
              <Link href="/iniciar-sesion" className="lp-btn lp-btn-ghost">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-grid">
          <div>
            <p className="lp-brand-name">
              GYM<b>RAT</b>
            </p>
            <p style={{ marginTop: 10, color: "#b4b4ba", maxWidth: "34ch" }}>Entrena con intención. Mide tu evolución. La fuerza viene de Dios.</p>
          </div>
          <nav aria-label="Secciones">
            <p className="lp-foot-title">Explorar</p>
            <ul>
              <li><a href="#funciones">Características</a></li>
              <li><a href="#como-funciona">Cómo funciona</a></li>
              <li><a href="#preguntas">Preguntas</a></li>
            </ul>
          </nav>
          <nav aria-label="Cuenta">
            <p className="lp-foot-title">Tu cuenta</p>
            <ul>
              <li><Link href="/crear-cuenta">Crear cuenta</Link></li>
              <li><Link href="/iniciar-sesion">Iniciar sesión</Link></li>
            </ul>
          </nav>
        </div>
        <div className="lp-wrap lp-footer-note">
          GYMRAT ofrece estimaciones orientativas y no sustituye el consejo de un profesional de la salud. © GYMRAT. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
