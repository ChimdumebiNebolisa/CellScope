/**
 * Optional browser-local persistence via IndexedDB.
 * Saves datasets and analysis results so users can reload work without accounts.
 * The app works fully without this; persistence is a convenience only.
 */

import type { BatteryReading } from "@/types/contract";
import type { AnalysisResponse } from "@/types/contract";

const DB_NAME = "cellscope-db";
const STORE_NAME = "sessions";
const DB_VERSION = 1;

export interface StoredSession {
  id: string;
  name: string;
  savedAt: string; // ISO 8601
  readings: BatteryReading[];
  result: AnalysisResponse | null;
}

export interface SessionMeta {
  id: string;
  name: string;
  savedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

/**
 * Save the current dataset and optional analysis result to local storage.
 * Returns the new session id.
 */
export async function saveSession(
  name: string,
  readings: BatteryReading[],
  result: AnalysisResponse | null
): Promise<string> {
  const db = await openDb();
  const id = crypto.randomUUID();
  const session: StoredSession = {
    id,
    name: name.trim() || `Session ${new Date().toLocaleString()}`,
    savedAt: new Date().toISOString(),
    readings,
    result,
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(session);
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      resolve(id);
    };
  });
}

/**
 * List all saved sessions (metadata only).
 */
export async function listSessions(): Promise<SessionMeta[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      const sessions = (request.result as StoredSession[]).map((s) => ({
        id: s.id,
        name: s.name,
        savedAt: s.savedAt,
      }));
      sessions.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      resolve(sessions);
    };
  });
}

/**
 * Load a session by id. Returns null if not found.
 */
export async function getSession(id: string): Promise<StoredSession | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      resolve((request.result as StoredSession) ?? null);
    };
  });
}

/**
 * Delete a saved session.
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
    request.onsuccess = () => {
      db.close();
      resolve();
    };
  });
}
