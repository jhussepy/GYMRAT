import { describe, expect, it } from "vitest";
import { dataUrlBytes, fitSize, isValidDate, nearestPhoto, sortPhotos, type ProgressPhoto } from "@/lib/progress-photos";

const photo = (id: string, date: string, createdAt = "2026-11-01T10:00:00.000Z"): ProgressPhoto => ({ id, date, dataUrl: "data:image/jpeg;base64,AAAA", bytes: 3, createdAt });

describe("tamaño de la foto comprimida", () => {
  it("una imagen grande se reduce al lado máximo y conserva la proporción", () => {
    expect(fitSize(3000, 2000)).toEqual({ width: 900, height: 600 });
  });
  it("una imagen pequeña no se agranda", () => {
    expect(fitSize(400, 300)).toEqual({ width: 400, height: 300 });
  });
  it("una imagen vertical también respeta el lado máximo", () => {
    expect(fitSize(1500, 4000)).toEqual({ width: 338, height: 900 });
  });
  it("sin dimensiones válidas devuelve cero", () => {
    expect(fitSize(0, 100)).toEqual({ width: 0, height: 0 });
  });
});

describe("bytes de un data URL", () => {
  it("calcula el tamaño real del contenido base64", () => {
    // "hola" en base64 es "aG9sYQ==" → 4 bytes
    expect(dataUrlBytes("data:text/plain;base64,aG9sYQ==")).toBe(4);
  });
  it("sin coma o vacío devuelve cero", () => {
    expect(dataUrlBytes("sin-coma")).toBe(0);
  });
});

describe("fechas válidas", () => {
  it("acepta fechas reales", () => {
    expect(isValidDate("2026-11-02")).toBe(true);
    expect(isValidDate("2028-02-29")).toBe(true);
  });
  it("rechaza fechas que no existen o con otro formato", () => {
    expect(isValidDate("2026-02-30")).toBe(false);
    expect(isValidDate("02/11/2026")).toBe(false);
    expect(isValidDate("")).toBe(false);
  });
});

describe("orden y comparación", () => {
  it("ordena de la más reciente a la más antigua", () => {
    const sorted = sortPhotos([photo("a", "2026-10-01"), photo("b", "2026-11-01"), photo("c", "2026-10-15")]);
    expect(sorted.map((p) => p.id)).toEqual(["b", "c", "a"]);
  });
  it("con la misma fecha, la última tomada va primero", () => {
    const sorted = sortPhotos([photo("a", "2026-11-01", "2026-11-01T08:00:00.000Z"), photo("b", "2026-11-01", "2026-11-01T18:00:00.000Z")]);
    expect(sorted[0].id).toBe("b");
  });
  it("busca la foto más cercana a una fecha", () => {
    const list = [photo("a", "2026-09-01"), photo("b", "2026-10-20"), photo("c", "2026-11-01")];
    expect(nearestPhoto(list, "2026-10-25")?.id).toBe("b");
  });
  it("sin fotos no hay comparación", () => {
    expect(nearestPhoto([], "2026-10-25")).toBeNull();
  });
});
