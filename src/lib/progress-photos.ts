/**
 * Fotos de progreso. Viven SOLO en el navegador (IndexedDB), nunca en el estado sincronizado,
 * así que no llegan a la nube ni a ninguna otra cuenta. Se guardan comprimidas y con fecha.
 */

export interface ProgressPhoto {
  id: string;
  /** Fecha de la foto (YYYY-MM-DD). */
  date: string;
  /** Imagen comprimida como JPEG en data URL. */
  dataUrl: string;
  /** Tamaño original y tamaño guardado, para mostrar el ahorro. */
  bytes: number;
  createdAt: string;
}

export const PHOTO_MAX_EDGE = 900;
export const PHOTO_QUALITY = 0.82;
/** Límite por foto tras comprimir: evita llenar el almacenamiento del navegador. */
export const PHOTO_MAX_BYTES = 600_000;
export const PHOTO_MAX_COUNT = 120;

/** Calcula el tamaño de salida conservando la proporción y sin agrandar la imagen. */
export function fitSize(width: number, height: number, maxEdge = PHOTO_MAX_EDGE): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Tamaño aproximado en bytes de un data URL base64. */
export function dataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return 0;
  const b64 = dataUrl.slice(comma + 1);
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - padding;
}

/** Valida un id y una fecha antes de guardar. */
export function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = new Date(`${date}T00:00:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === date;
}

/** Ordena las fotos de la más reciente a la más antigua, y por hora de creación si la fecha coincide. */
export function sortPhotos(photos: ProgressPhoto[]): ProgressPhoto[] {
  return [...photos].sort((a, b) => (b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

/** Foto más cercana a una fecha dada (para comparar lado a lado con la de hoy). */
export function nearestPhoto(photos: ProgressPhoto[], date: string): ProgressPhoto | null {
  if (photos.length === 0) return null;
  const target = new Date(`${date}T00:00:00`).getTime();
  return photos.reduce((best, p) => {
    const diff = Math.abs(new Date(`${p.date}T00:00:00`).getTime() - target);
    const bestDiff = Math.abs(new Date(`${best.date}T00:00:00`).getTime() - target);
    return diff < bestDiff ? p : best;
  });
}
