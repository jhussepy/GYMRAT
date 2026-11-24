import type { ProgressPhoto } from "./progress-photos";

const DB_NAME = "gymrat-photos";
const STORE = "photos";
const VERSION = 1;

/** Abre (o crea) la base de datos local de fotos. Devuelve null si el navegador no tiene IndexedDB. */
export function openPhotoDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    try {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("date", "date", { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function run<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listPhotos(db: IDBDatabase): Promise<ProgressPhoto[]> {
  return run(db, "readonly", (s) => s.getAll() as IDBRequest<ProgressPhoto[]>);
}

export async function putPhoto(db: IDBDatabase, photo: ProgressPhoto): Promise<void> {
  await run(db, "readwrite", (s) => s.put(photo));
}

export async function deletePhoto(db: IDBDatabase, id: string): Promise<void> {
  await run(db, "readwrite", (s) => s.delete(id));
}

/** Borra todas las fotos de este navegador. */
export async function clearPhotos(db: IDBDatabase): Promise<void> {
  await run(db, "readwrite", (s) => s.clear());
}
