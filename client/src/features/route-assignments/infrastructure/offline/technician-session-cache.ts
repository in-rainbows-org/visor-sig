import type { TechnicianSessionSnapshot } from "../../domain/entities/offline-sync.entity";

const SESSION_CACHE_KEY = "visorgis_technician_session_v1";

let cachedSnapshot: TechnicianSessionSnapshot | null | undefined = undefined;
const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // Ignorar errores de suscriptores
    }
  }
}

/**
 * Respaldo local de sesión del técnico autenticado para permitir hidratación
 * de la PWA en rutas `/mis-asignaciones` cuando el dispositivo inicia sin internet.
 */
export const technicianSessionCache = {
  get(): TechnicianSessionSnapshot | null {
    if (typeof window === "undefined") return null;
    if (cachedSnapshot !== undefined) {
      return cachedSnapshot;
    }
    try {
      const raw = window.localStorage.getItem(SESSION_CACHE_KEY);
      if (!raw) {
        cachedSnapshot = null;
        return null;
      }
      const parsed = JSON.parse(raw) as TechnicianSessionSnapshot;
      if (!parsed || typeof parsed.id !== "string" || !parsed.role) {
        cachedSnapshot = null;
        return null;
      }
      cachedSnapshot = parsed;
      return cachedSnapshot;
    } catch {
      cachedSnapshot = null;
      return null;
    }
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getServerSnapshot(): TechnicianSessionSnapshot | null {
    return null;
  },

  save(snapshot: Omit<TechnicianSessionSnapshot, "savedAt">): TechnicianSessionSnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const full: TechnicianSessionSnapshot = {
        ...snapshot,
        savedAt: new Date().toISOString(),
      };
      cachedSnapshot = full;
      window.localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(full));
      notifyListeners();
      return full;
    } catch {
      return null;
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    cachedSnapshot = null;
    try {
      window.localStorage.removeItem(SESSION_CACHE_KEY);
    } catch {
      // Ignorar si el almacenamiento está restringido
    }
    notifyListeners();
  },
};
