"use client";

import { useCallback } from "react";
import { auditLogRepositoryImpl } from "../../infrastructure/repositories/audit-log.repository-impl";

/**
 * Registra una acción de inicio de sesión exitoso en la bitácora.
 */
export async function recordLoginAuditAction(): Promise<void> {
  try {
    await auditLogRepositoryImpl.recordAuthAction({
      action: "LOGIN",
      description: "Inicio de sesión exitoso en la plataforma",
    });
  } catch {
    // Falla silenciosa para no interrumpir el flujo de autenticación del usuario
  }
}

/**
 * Registra una acción de cierre de sesión en la bitácora.
 */
export async function recordLogoutAuditAction(): Promise<void> {
  try {
    await auditLogRepositoryImpl.recordAuthAction({
      action: "LOGOUT",
      description: "Cierre de sesión del sistema",
    });
  } catch {
    // Falla silenciosa para no interrumpir el flujo de logout del usuario
  }
}

export function useAuditAuthLog() {
  const logLogin = useCallback(async () => {
    await recordLoginAuditAction();
  }, []);

  const logLogout = useCallback(async () => {
    await recordLogoutAuditAction();
  }, []);

  return {
    logLogin,
    logLogout,
  };
}
