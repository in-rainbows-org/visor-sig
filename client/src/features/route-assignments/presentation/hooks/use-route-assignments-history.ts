"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type {
  PaginatedRouteAssignments,
  RouteAssignmentSummary,
} from "../../domain/entities/route-assignment.entity";
import type { RouteTechnicianOption } from "../../domain/entities/route-technician.entity";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";
import { techniciansCache } from "../../infrastructure/cache/technicians-cache";

const EMPTY_ITEMS: RouteAssignmentSummary[] = [];

export function useRouteAssignmentsHistory() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Extraer estado de URL query params
  const currentPage = useMemo(() => {
    const p = parseInt(searchParams.get("page") || "1", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const s = parseInt(searchParams.get("page_size") || "10", 10);
    return isNaN(s) || s < 1 ? 10 : s;
  }, [searchParams]);

  const technicianId = useMemo(
    () => searchParams.get("technician_id") || undefined,
    [searchParams]
  );
  const scheduledDateFrom = useMemo(
    () => searchParams.get("start_date") || undefined,
    [searchParams]
  );
  const scheduledDateTo = useMemo(
    () => searchParams.get("end_date") || undefined,
    [searchParams]
  );

  // 2. Estados locales de datos y carga
  const [data, setData] = useState<PaginatedRouteAssignments | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [technicians, setTechnicians] = useState<RouteTechnicianOption[]>(
    () => techniciansCache.getCachedTechnicians() || []
  );
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState<boolean>(
    () => !techniciansCache.getCachedTechnicians()
  );

  // 3. Cargar listado de técnicos usando caché compartida
  useEffect(() => {
    let isMounted = true;
    async function loadTechnicians() {
      if (!techniciansCache.getCachedTechnicians()) {
        setIsLoadingTechnicians(true);
      }
      try {
        const res = await techniciansCache.getTechnicians();
        if (res.ok && isMounted) {
          setTechnicians(res.data);
        }
      } catch {
        // En caso de fallo de red al cargar técnicos, mantener lista vacía
      } finally {
        if (isMounted) {
          setIsLoadingTechnicians(false);
        }
      }
    }
    loadTechnicians();
    return () => {
      isMounted = false;
    };
  }, []);

  // 4. Fetch principal de asignaciones paginadas
  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await routeAssignmentRepository.getAssignments({
        page: currentPage,
        pageSize,
        technicianId,
        scheduledDateFrom,
        scheduledDateTo,
      });

      if (res.ok) {
        setData(res.data);
      } else {
        setError(res.errors?.[0] || "No se pudieron cargar las asignaciones de rutas.");
      }
    } catch {
      setError("Error de red al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, technicianId, scheduledDateFrom, scheduledDateTo]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // 5. Mutación de URL query params para navegación y filtros
  const updateUrlParams = useCallback(
    (paramsToUpdate: Record<string, string | null | undefined>) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(paramsToUpdate).forEach(([key, val]) => {
        if (!val || val.trim() === "" || val === "ALL") {
          current.delete(key);
        } else {
          current.set(key, val);
        }
      });

      const query = current.toString();
      const targetUrl = query ? `${pathname}?${query}` : pathname;
      router.replace(targetUrl, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrlParams({ page: String(page) });
    },
    [updateUrlParams]
  );

  const applyFilters = useCallback(
    (newFilters: {
      technicianId?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      updateUrlParams({
        page: "1", // Al cambiar filtros siempre reiniciamos a la primera página
        technician_id: newFilters.technicianId,
        start_date: newFilters.startDate,
        end_date: newFilters.endDate,
      });
    },
    [updateUrlParams]
  );

  const resetFilters = useCallback(() => {
    updateUrlParams({
      page: "1",
      technician_id: null,
      start_date: null,
      end_date: null,
    });
  }, [updateUrlParams]);

  const hasActiveFilters = Boolean(
    technicianId || scheduledDateFrom || scheduledDateTo
  );

  return {
    items: data?.items ?? EMPTY_ITEMS,
    totalCount: data?.total ?? 0,
    currentPage: data?.page ?? currentPage,
    pageSize: data?.pageSize ?? pageSize,
    totalPages: data?.totalPages ?? 0,
    isLoading,
    error,
    technicians,
    isLoadingTechnicians,
    hasActiveFilters,
    activeFilters: {
      technicianId,
      startDate: scheduledDateFrom,
      endDate: scheduledDateTo,
    },
    applyFilters,
    resetFilters,
    handlePageChange,
    refetch: fetchAssignments,
  };
}
