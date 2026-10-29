import { Check } from "lucide-react";

/** Segmentos del reloj de ejemplo: [color, fracción del día]. */
const SEGMENTS: [string, number][] = [
  ["#a58bd9", 0.3],
  ["#6c7fa6", 0.3],
  ["#f5b14c", 0.07],
  ["#ff6b76", 0.1],
  ["#4a4452", 0.23],
];
const R = 62;
const C = 2 * Math.PI * R;

/** Maqueta ilustrativa de la app con datos de ejemplo. No usa datos de ninguna persona. */
export function ProductPreview() {
  let offset = 0;
  return (
    <div className="lp-preview" role="group" aria-label="Vista ilustrativa de la aplicación, con datos de ejemplo">
      <div className="lp-preview-bar" aria-hidden>
        <span />
        <span />
        <span />
        <b>Vista de ejemplo</b>
      </div>
      <div className="lp-preview-grid">
        <div className="lp-pane">
          <h3>Mi día</h3>
          <div style={{ display: "grid", placeItems: "center", marginTop: 14 }}>
            <svg viewBox="0 0 160 160" width="190" height="190" role="img" aria-label="Reloj de 24 horas con los bloques del día">
              <circle cx="80" cy="80" r={R} fill="none" stroke="#222226" strokeWidth="18" />
              {SEGMENTS.map(([color, fraction]) => {
                const length = fraction * C;
                const el = <circle key={color} cx="80" cy="80" r={R} fill="none" stroke={color} strokeWidth="18" strokeDasharray={`${Math.max(0, length - 2)} ${C}`} strokeDashoffset={-offset} transform="rotate(-90 80 80)" />;
                offset += length;
                return el;
              })}
              <text x="80" y="82" textAnchor="middle" fill="#fff" fontSize="26" fontFamily="Anton, Impact, sans-serif">
                18:42
              </text>
              <text x="80" y="100" textAnchor="middle" fill="#b4b4ba" fontSize="9">
                Entreno en 18 min
              </text>
            </svg>
          </div>
        </div>

        <div className="lp-pane">
          <h3>Rutina de hoy · Empuje</h3>
          <div style={{ marginTop: 8 }}>
            {[
              ["Press de pecho en máquina", "4 × 10-12 · 60 kg", true],
              ["Press inclinado", "4 × 10 · 22 kg", true],
              ["Press de hombros", "4 × 10-12 · en curso", false],
              ["Elevaciones laterales", "4 × 12-15", false],
            ].map(([name, detail, done]) => (
              <div className="lp-row" key={String(name)}>
                <span>
                  {name}
                  <small>{detail}</small>
                </span>
                {done ? (
                  <span className="lp-tag" aria-label="Hecho">
                    <Check size={12} style={{ display: "inline", marginRight: 4 }} aria-hidden />
                    Hecho
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: "#8e8e96" }}>Pendiente</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lp-pane">
          <h3>Hoy, contra tu meta</h3>
          {[
            ["Calorías", "1,420 / 2,000", 71],
            ["Proteína", "98 / 130 g", 75],
            ["Agua", "2.0 / 3.0 L", 66],
          ].map(([label, value, pct]) => (
            <div className="lp-meter" key={String(label)}>
              <div>
                <span>{label}</span>
                <span>{value}</span>
              </div>
              <div className="lp-bar" role="progressbar" aria-label={String(label)} aria-valuenow={Number(pct)} aria-valuemin={0} aria-valuemax={100}>
                <i style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
          <svg viewBox="0 0 240 70" preserveAspectRatio="none" width="100%" height="70" style={{ marginTop: 22 }} role="img" aria-label="Línea de peso descendente de ejemplo">
            <path d="M4 14 L44 20 L84 24 L124 34 L164 40 L204 52 L236 58" fill="none" stroke="#ff6b76" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <path d="M4 14 L44 20 L84 24 L124 34 L164 40 L204 52 L236 58 L236 70 L4 70 Z" fill="rgba(255,107,118,0.1)" />
          </svg>
          <p style={{ fontSize: 12, color: "#8e8e96" }}>Evolución de peso (ejemplo)</p>
        </div>
      </div>
    </div>
  );
}
