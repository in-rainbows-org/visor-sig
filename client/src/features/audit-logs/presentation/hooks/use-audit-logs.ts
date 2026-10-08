"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AuditLogItem,
  PaginatedAuditLogs,
} from "../../domain/entities/audit-log.entity";
import { auditLogRepositoryImpl } from "../../infrastructure/repositories/audit-log.repository-impl";

export function useAuditLogs() {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;
  const [auditLogs, setAuditLogs] = useState<PaginatedAuditLogs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await auditLogRepositoryImpl.getAuditLogs({
        page,
        pageSize,
      });

      if (result.ok) {
        setAuditLogs(result.data);
      } else {
        setError(result.errors?.[0] ?? "No se pudieron cargar los registros de auditoría.");
      }
    } catch {
      setError("Error de red al intentar obtener los registros.");
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchAuditLogs(currentPage);
  }, [fetchAuditLogs, currentPage]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const refetch = useCallback(() => {
    return fetchAuditLogs(currentPage);
  }, [fetchAuditLogs, currentPage]);

  return {
    items: auditLogs?.items ?? [],
    totalCount: auditLogs?.total ?? 0,
    currentPage: auditLogs?.page ?? currentPage,
    pageSize: auditLogs?.pageSize ?? pageSize,
    totalPages: auditLogs?.totalPages ?? 0,
    isLoading,
    error,
    handlePageChange,
    refetch,
  };
}
