"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { PHOTO_MAX_BYTES, PHOTO_MAX_COUNT, PHOTO_QUALITY, dataUrlBytes, fitSize, nearestPhoto, sortPhotos, type ProgressPhoto } from "@/lib/progress-photos";
import { clearPhotos, deletePhoto, listPhotos, openPhotoDb, putPhoto } from "@/lib/photo-store";
import { newId } from "@/lib/water";
import { todayISO } from "@/lib/time";
import { Card, SectionTitle } from "./ui";

/** Comprime una imagen en el navegador (sin subirla a ningún sitio) y devuelve un JPEG en data URL. */
async function compress(file: File): Promise<{ dataUrl: string; bytes: number }> {
  const bitmap = await createImageBitmap(file);
  const { width, height } = fitSize(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tu navegador no permite procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const dataUrl = canvas.toDataURL("image/jpeg", PHOTO_QUALITY);
  return { dataUrl, bytes: dataUrlBytes(dataUrl) };
}

export function ProgressPhotosCard() {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [supported, setSupported] = useState(true);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    void openPhotoDb().then(async (conn) => {
      if (!alive) return;
      if (!conn) return setSupported(false);
      setDb(conn);
      setPhotos(await listPhotos(conn));
    });
    return () => {
      alive = false;
    };
  }, []);

  const sorted = sortPhotos(photos);
  const latest = sorted[0] ?? null;
  const compare = compareId ? photos.find((p) => p.id === compareId) ?? null : nearestPhoto(photos.filter((p) => p.id !== latest?.id), latest?.date ?? todayISO()) ?? null;

  const add = async (file: File | undefined) => {
    if (!file || !db) return;
    if (!file.type.startsWith("image/")) return setMessage("Elige una imagen (JPG, PNG o similar).");
    if (photos.length >= PHOTO_MAX_COUNT) return setMessage(`Tienes ${PHOTO_MAX_COUNT} fotos guardadas. Borra alguna para añadir más.`);
    setBusy(true);
    setMessage("");
    try {
      const { dataUrl, bytes } = await compress(file);
      if (bytes > PHOTO_MAX_BYTES) return setMessage("La foto sigue siendo muy pesada. Prueba con otra o con menos resolución.");
      const photo: ProgressPhoto = { id: newId(), date: todayISO(), dataUrl, bytes, createdAt: new Date().toISOString() };
      await putPhoto(db, photo);
      setPhotos(await listPhotos(db));
      setMessage("Foto guardada solo en este dispositivo.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "No se pudo guardar la foto.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = async (id: string) => {
    if (!db) return;
    await deletePhoto(db, id);
    setPhotos(await listPhotos(db));
    if (compareId === id) setCompareId(null);
  };

  const removeAll = async () => {
    if (!db) return;
    if (!window.confirm("Se borrarán todas tus fotos de este dispositivo. ¿Continuar?")) return;
    await clearPhotos(db);
    setPhotos([]);
    setCompareId(null);
    setMessage("Todas las fotos se borraron de este dispositivo.");
  };

  return (
    <Card>
      <SectionTitle title="Fotos de progreso" hint="Se guardan solo en este dispositivo: no se suben a la nube ni las ve nadie más. Puedes borrarlas todas cuando quieras." />

      {!supported ? (
        <p className="rounded-xl border border-line/70 p-3 text-sm text-muted">Tu navegador no permite guardar fotos en este dispositivo. Prueba con otro navegador.</p>
      ) : (
        <>
          <label className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-flame px-5 text-sm font-semibold text-ink transition-[filter] duration-200 hover:brightness-110 ${busy ? "pointer-events-none opacity-60" : ""}`}>
            <Camera size={16} aria-hidden /> {busy ? "Guardando…" : "Añadir foto de hoy"}
            <input ref={input} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => void add(e.target.files?.[0])} disabled={busy} />
          </label>
          {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}

          {photos.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Aún no tienes fotos. Añade una hoy y compárala dentro de unas semanas.</p>
          ) : (
            <>
              {latest && compare && compare.id !== latest.id && (
                <div className="mt-5">
                  <p className="mb-2 text-sm font-medium">Antes y después</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Figure photo={compare} label="Antes" />
                    <Figure photo={latest} label="Ahora" />
                  </div>
                </div>
              )}

              <p className="mb-2 mt-6 text-sm font-medium">Tus fotos ({photos.length})</p>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {sorted.map((p) => (
                  <li key={p.id} className="relative">
                    <button type="button" onClick={() => setCompareId(p.id)} aria-label={`Comparar la foto del ${p.date}`} className={`block w-full overflow-hidden rounded-xl border ${compare?.id === p.id ? "border-flame" : "border-line/70"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.dataUrl} alt={`Foto del ${p.date}`} className="aspect-[3/4] w-full object-cover" />
                    </button>
                    <span className="mt-1 block text-center text-xs text-muted">{p.date}</span>
                    <button type="button" onClick={() => void remove(p.id)} aria-label={`Borrar la foto del ${p.date}`} className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg bg-ink/80 text-rose">
                      <Trash2 size={15} aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              <button type="button" onClick={() => void removeAll()} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-rose/40 px-4 text-sm text-rose hover:bg-rose/10">
                <Trash2 size={15} aria-hidden /> Borrar todas las fotos de este dispositivo
              </button>
            </>
          )}
        </>
      )}
    </Card>
  );
}

function Figure({ photo, label }: { photo: ProgressPhoto; label: string }) {
  return (
    <figure>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.dataUrl} alt={`${label}: foto del ${photo.date}`} className="aspect-[3/4] w-full rounded-xl border border-line/70 object-cover" />
      <figcaption className="mt-1 text-center text-xs text-muted">
        {label} · {photo.date}
      </figcaption>
    </figure>
  );
}
