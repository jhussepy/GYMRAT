import type { Weekday } from "./config";

/* ───────── Horario ───────── */
export type Category = "Rutina" | "Traslado" | "Trabajo" | "Nutrición" | "Sueño" | "Gym" | "Libre";

export interface ScheduleItem {
  start: string; // HH:MM
  end: string; // HH:MM (si end < start cruza medianoche)
  activity: string;
  category: Category;
  description: string;
}

export const SCHEDULE: ScheduleItem[] = [
  { start: "02:30", end: "02:45", activity: "Despertar y aseo", category: "Rutina", description: "Agua fría en la cara y vaso grande de agua con electrolitos." },
  { start: "02:45", end: "03:30", activity: "Transporte al trabajo", category: "Traslado", description: "Audio ligero o silencio para despertar sin saturar la mente." },
  { start: "03:30", end: "04:00", activity: "Pre-trabajo y activación", category: "Nutrición", description: "Café, proteína y revisión rápida de prioridades." },
  { start: "04:00", end: "08:00", activity: "Trabajo (bloque 1)", category: "Trabajo", description: "Pico de energía matutino. Último café a las 08:00." },
  { start: "08:00", end: "09:00", activity: "Pausa y comida principal", category: "Nutrición", description: "Táper del día: proteína + carbohidrato + verdura." },
  { start: "09:00", end: "14:00", activity: "Trabajo (bloque 2)", category: "Trabajo", description: "Segundo tramo laboral. Hidratación constante (1.5 L)." },
  { start: "14:00", end: "15:15", activity: "Regreso a casa", category: "Traslado", description: "Descompresión laboral; evita pantallas brillantes." },
  { start: "15:15", end: "15:45", activity: "Comida pro-siesta", category: "Nutrición", description: "Proteína magra con carbohidrato y verduras al vapor." },
  { start: "15:45", end: "17:20", activity: "Siesta de recuperación", category: "Sueño", description: "Habitación a oscuras y móvil en modo avión (90 min)." },
  { start: "17:20", end: "19:00", activity: "Libre y pre-entreno", category: "Libre", description: "A las 18:20: plátano y un vaso grande de agua." },
  { start: "19:00", end: "21:00", activity: "Smart Fit y estudio en tablet", category: "Gym", description: "Fuerza 75 min + cardio 30 min. Descansos de 90 s con la tablet." },
  { start: "21:00", end: "21:30", activity: "Ducha y traslado", category: "Libre", description: "Regreso a casa." },
  { start: "21:30", end: "22:00", activity: "Cena y preparación", category: "Nutrición", description: "Cena proteica ligera. Mochila lista para las 02:30." },
  { start: "22:00", end: "02:30", activity: "Sueño nocturno", category: "Sueño", description: "Descanso nocturno continuo (4 h 30 min)." },
];

export const CATEGORY_COLOR: Record<Category, string> = {
  Rutina: "rgb(var(--c-rutina))",
  Traslado: "rgb(var(--c-traslado))",
  Trabajo: "rgb(var(--c-trabajo))",
  Nutrición: "rgb(var(--c-nutricion))",
  Sueño: "rgb(var(--c-sueno))",
  Gym: "rgb(var(--c-gym))",
  Libre: "rgb(var(--c-libre))",
};

/* ───────── Rutina ───────── */
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  alt: string;
  type: "strength" | "cardio";
}

const s = (id: string, name: string, sets: number, reps: string, alt: string): Exercise => ({ id, name, sets, reps, alt, type: "strength" });
const c = (id: string, name: string, reps: string, alt: string): Exercise => ({ id, name, sets: 1, reps, alt, type: "cardio" });

export const WORKOUT_FOCUS: Record<Weekday, string> = {
  Lunes: "Empuje",
  Martes: "Tirón",
  Miércoles: "Pierna",
  Jueves: "Torso",
  Viernes: "Posterior",
  Sábado: "Cardio",
};

export const WORKOUTS: Record<Weekday, Exercise[]> = {
  Lunes: [
    s("lun-1", "Press de pecho en máquina sentada", 4, "10-12", "Press con mancuernas en banca plana"),
    s("lun-2", "Press inclinado en máquina convergente", 4, "10", "Press inclinado con mancuernas"),
    s("lun-3", "Press de hombros en máquina", 4, "10-12", "Press militar con mancuernas sentado"),
    s("lun-4", "Elevaciones laterales en máquina", 4, "12-15", "Elevaciones laterales con mancuernas"),
    s("lun-5", "Extensión de tríceps en polea alta", 4, "12-15", "Press francés con mancuernas"),
  ],
  Martes: [
    s("mar-1", "Jalón al pecho en polea alta", 4, "10-12", "Dominadas asistidas en máquina"),
    s("mar-2", "Remo sentado en máquina (apoyo en pecho)", 4, "10-12", "Remo con mancuernas a una mano"),
    s("mar-3", "Remo en polea baja (agarre neutro)", 4, "12", "Remo en máquina convergente"),
    s("mar-4", "Curl de bíceps en máquina predicador", 4, "10-12", "Curl con mancuernas sentado"),
    s("mar-5", "Crunch abdominal en máquina", 4, "15", "Crunch en polea alta de rodillas"),
  ],
  Miércoles: [
    s("mie-1", "Prensa de piernas a 45°", 4, "10-12", "Prensa horizontal en máquina"),
    s("mie-2", "Sentadilla Hack en máquina", 4, "10", "Sentadilla copa con mancuerna pesada"),
    s("mie-3", "Extensión de cuádriceps sentado", 4, "12-15", "Zancadas estáticas con apoyo"),
    s("mie-4", "Curl femoral sentado", 4, "12", "Curl femoral acostado"),
    s("mie-5", "Elevación de talones sentado", 4, "15-20", "Elevación de talones en prensa"),
  ],
  Jueves: [
    s("jue-1", "Press inclinado con mancuernas", 4, "10-12", "Press de pecho en máquina"),
    s("jue-2", "Jalón al pecho (agarre estrecho)", 4, "10-12", "Remo bajo en polea"),
    s("jue-3", "Aperturas en máquina (Pec Deck)", 3, "12-15", "Cruce de poleas para pecho"),
    s("jue-4", "Face pull en polea alta", 4, "15", "Pájaros con mancuernas sentado"),
    s("jue-5", "Curl martillo + extensión de tríceps", 3, "12", "Biserie de brazos en poleas"),
  ],
  Viernes: [
    s("vie-1", "Peso muerto rumano con mancuernas", 4, "10-12", "Buenos días en máquina o polea"),
    s("vie-2", "Hip thrust (puente de glúteo)", 4, "10-12", "Hip thrust en máquina"),
    s("vie-3", "Prensa horizontal (pies altos)", 4, "12", "Sentadilla búlgara con apoyo"),
    s("vie-4", "Curl femoral acostado", 4, "12-15", "Curl femoral sentado"),
    s("vie-5", "Plancha abdominal (isométrica)", 3, "45 seg", "Elevación de piernas colgado"),
  ],
  Sábado: [
    c("sab-1", "Caminadora inclinada", "45 min", "Elíptica constante"),
    c("sab-2", "Bicicleta estática (sin impacto)", "45 min", "Caminadora sin inclinación"),
    c("sab-3", "Abdomen y estiramiento final", "15 min", "Movilidad articular completa"),
  ],
};

/* ───────── Nutrición (valores aproximados, ver README) ───────── */
export interface Macro {
  kcal: number;
  protein: number;
}

export interface Taper extends Macro {
  id: string;
  num: string;
  title: string;
  description: string;
}

/** Un táper por día laborable, de lunes a viernes. */
export const TAPERS: Record<Exclude<Weekday, "Sábado">, Taper> = {
  Lunes: { id: "t1", num: "Táper 1", title: "Pollo saltado fit", description: "180 g de pechuga con cebolla, tomate y sillao bajo en sodio + 120 g de papa amarilla + 2 huevos duros picados.", kcal: 560, protein: 70 },
  Martes: { id: "t2", num: "Táper 2", title: "Revuelto de carne magra", description: "180 g de carne molida magra guisada con zanahoria y vainitas + 100 g de arroz integral.", kcal: 430, protein: 40 },
  Miércoles: { id: "t3", num: "Táper 3", title: "Bowl caliente de pollo y quinua", description: "180 g de pollo al horno + 120 g de quinua cocida + brócoli al vapor + palta aparte.", kcal: 520, protein: 64 },
  Jueves: { id: "t4", num: "Táper 4", title: "Guiso seco de pollo o pavita", description: "200 g de pechuga guisada con culantro y espinaca + 120 g de papa cocida.", kcal: 445, protein: 66 },
  Viernes: { id: "t5", num: "Táper 5", title: "Tortilla española proteica", description: "3 huevos + 2 claras con láminas de papa, espinaca y jamón de pavita (se calienta 2 min).", kcal: 385, protein: 35 },
};

export interface Meal extends Macro {
  id: string;
  time: string;
  name: string;
  food: string;
  /** Si es true, la comida se reemplaza por el táper del día. */
  taper?: boolean;
}

export const MEALS: Meal[] = [
  { id: "pre-trabajo", time: "03:30", name: "Pre-trabajo", food: "Café negro + 1 scoop de whey en agua + 15 g de almendras.", kcal: 210, protein: 27 },
  { id: "taper", time: "08:00", name: "Pausa laboral", food: "Táper del día + último café.", kcal: 0, protein: 0, taper: true },
  { id: "pro-siesta", time: "15:15", name: "Comida pro-siesta", food: "200 g de pollo o pescado a la plancha + 120 g de arroz blanco o papa + verduras al vapor.", kcal: 525, protein: 66 },
  { id: "pre-entreno", time: "18:20", name: "Pre-entreno", food: "1 plátano mediano + 1 vaso grande de agua.", kcal: 105, protein: 1 },
  { id: "cena", time: "21:30", name: "Cena post-entreno", food: "180 g de filete de pescado o pollo + espinaca o zapallito + 80 g de camote.", kcal: 280, protein: 38 },
];

/* ───────── Compras ───────── */
export interface ShoppingItem {
  id: string;
  label: string;
  qty: string;
}

export const SHOPPING: ShoppingItem[] = [
  { id: "pollo", label: "Pechuga de pollo o pavita", qty: "3.5 kg" },
  { id: "pescado", label: "Pescado blanco (filetes)", qty: "1.3 kg + 3 latas de atún en agua" },
  { id: "carne", label: "Carne molida de res magra", qty: "400 g" },
  { id: "huevos", label: "Huevos (12 se hierven el domingo)", qty: "30 unidades" },
  { id: "papa", label: "Papa y camote", qty: "2 kg" },
  { id: "arroz", label: "Arroz blanco, arroz integral y quinua", qty: "500 g de cada uno" },
  { id: "verduras", label: "Brócoli, vainitas, espinaca, zanahoria, cebolla, tomate, culantro", qty: "para la semana" },
  { id: "frutas", label: "Plátanos y paltas", qty: "7 plátanos, 3 paltas" },
  { id: "whey", label: "Proteína whey", qty: "5 scoops (una por día laborable)" },
  { id: "almendras", label: "Almendras", qty: "100 g" },
  { id: "jamon", label: "Jamón de pavita", qty: "200 g" },
  { id: "sillao", label: "Sillao bajo en sodio y electrolitos", qty: "1 de cada uno" },
];

/* ───────── Trading ───────── */
export const TRADING_BLOCKS = [
  { when: "Lun a Sáb · 19:00 a 21:00", title: "Estudio entre series (90 a 120 s)", text: "Repasa Order Blocks, FVG y BOS en la tablet durante los descansos, sin perder el ritmo del entrenamiento." },
  { when: "Sábado · 18:00 a 20:00", title: "Backtesting y estadística", text: "Sesión de simulador y análisis cuantitativo de la semana." },
  { when: "Domingo · 17:00 a 19:00", title: "Proyección y zonas clave", text: "Prepara el mercado del lunes: rangos operativos, zonas clave y noticias." },
];

/* ───────── Consejos rápidos ───────── */
export const QUICK_TIPS = [
  { q: "Máquina ocupada", a: "En hora punta usa la alternativa de cada ejercicio (mancuernas, poleas o máquina convergente) en vez de esperar." },
  { q: "Hambre en el bloque 2", a: "Entre las 09:00 y las 14:00 toma 500 ml de agua o una infusión sin azúcar. El táper de las 08:00 te mantiene saciado." },
  { q: "Pedir un poké bowl", a: "Base de quinua o arroz con lechuga, doble proteína (salmón o pollo), palta moderada y sin salsas dulces." },
];
