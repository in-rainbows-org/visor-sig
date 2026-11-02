"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { FixedCodeCandidate } from "../../domain/entities/fixed-code-candidate.entity";
import {
  CalculatedRoute,
  RouteCalculationState,
  RouteCartStop,
  RouteCreationWizardState,
  RouteServiceType,
  RouteStartingPoint,
  RouteTechnician,
  RouteWizardStep,
} from "../../domain/entities/route-wizard.entity";
import {
  initialWizardState,
  routeCreationWizardReducer,
} from "./route-creation-wizard-reducer";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";

export type RouteCreationWizardContextType = {
  state: RouteCreationWizardState;
  isStarted: boolean;
  currentStep: RouteWizardStep;
  selectedTechnician: RouteTechnician | null;
  scheduledDate: string | null;
  serviceType: RouteServiceType | null;
  startingPoint: RouteStartingPoint | null;
  cartStops: RouteCartStop[];
  calculationState: RouteCalculationState;
  calculatedRoute: CalculatedRoute | null;
  isSaving: boolean;
  saveError: string | null;
  isSearchVisible: boolean;
  canAdvance: boolean;

  startWizard: () => void;
  selectTechnician: (technician: RouteTechnician) => void;
  setScheduledDate: (date: string) => void;
  selectServiceType: (serviceType: RouteServiceType) => void;
  setStartingPoint: (point: RouteStartingPoint) => void;
  addStop: (candidate: FixedCodeCandidate) => void;
  removeStop: (id: string) => void;
  reorderStops: (stops: RouteCartStop[]) => void;
  calculateRoutes: () => Promise<void>;
  saveAssignment: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  cancel: () => void;
  resetWizard: () => void;
  goToStep: (step: RouteWizardStep) => void;
};

const RouteCreationWizardContext = createContext<RouteCreationWizardContextType | null>(null);

export function RouteCreationWizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(routeCreationWizardReducer, initialWizardState);
  const router = useRouter();

  const startWizard = useCallback(() => {
    dispatch({ type: "START_WIZARD" });
  }, []);

  const selectTechnician = useCallback((technician: RouteTechnician) => {
    dispatch({ type: "SELECT_TECHNICIAN", payload: technician });
  }, []);

  const setScheduledDate = useCallback((date: string) => {
    dispatch({ type: "SET_SCHEDULED_DATE", payload: date });
  }, []);

  const selectServiceType = useCallback((serviceType: RouteServiceType) => {
    dispatch({ type: "SELECT_SERVICE_TYPE", payload: serviceType });
  }, []);

  const setStartingPoint = useCallback((point: RouteStartingPoint) => {
    dispatch({ type: "SET_STARTING_POINT", payload: point });
  }, []);

  const addStop = useCallback((candidate: FixedCodeCandidate) => {
    dispatch({ type: "ADD_STOP", payload: candidate });
  }, []);

  const removeStop = useCallback((id: string) => {
    dispatch({ type: "REMOVE_STOP", payload: { id } });
  }, []);

  const reorderStops = useCallback((stops: RouteCartStop[]) => {
    dispatch({ type: "REORDER_STOPS", payload: stops });
  }, []);

  const calculateRoutes = useCallback(async () => {
    if (!state.startingPoint) {
      appToast.warning("Debes definir un punto de partida antes de calcular la ruta");
      return;
    }
    if (state.cartStops.length === 0) {
      appToast.warning("Debes agregar al menos una parada para calcular la ruta");
      return;
    }

    dispatch({ type: "START_CALCULATION" });
    try {
      const res = await routeAssignmentRepository.calculateRoute({
        startLatitude: state.startingPoint.latitude,
        startLongitude: state.startingPoint.longitude,
        optimizeWaypointOrder: true,
        waypoints: state.cartStops.map((stop) => ({
          codigoFijoId: stop.fixedCodeId,
          latitude: stop.latitude,
          longitude: stop.longitude,
        })),
      });

      if (res.ok) {
        dispatch({ type: "SET_CALCULATED_ROUTE", payload: res.data });
        appToast.success(
          "Ruta optimizada con éxito",
          `${res.data.totalDistanceKm} km calculados en ${res.data.orderedStops.length} paradas`
        );
      } else {
        dispatch({ type: "FAIL_CALCULATION" });
        appToast.error(
          "Error al calcular la ruta",
          res.errors?.[0] || "No se pudo obtener el cálculo de ruta vial."
        );
      }
    } catch {
      dispatch({ type: "FAIL_CALCULATION" });
      appToast.error("Error de conexión al calcular ruta con el servidor.");
    }
  }, [state.startingPoint, state.cartStops]);

  const saveAssignment = useCallback(async () => {
    if (state.cartStops.length === 0) {
      appToast.warning("Debes agregar al menos una parada a la asignación");
      return;
    }
    if (!state.selectedTechnician) {
      appToast.warning("Debes seleccionar un técnico responsable");
      return;
    }
    if (!state.scheduledDate) {
      appToast.warning("Debes seleccionar una fecha de asignación");
      return;
    }
    if (!state.serviceType) {
      appToast.warning("Debes seleccionar el tipo de servicio");
      return;
    }
    if (!state.startingPoint) {
      appToast.warning("Debes definir un punto de partida en el mapa");
      return;
    }

    dispatch({ type: "START_SAVING" });
    try {
      const targetDefaultStatus = state.serviceType === "CUT" ? 3 : 1;
      const res = await routeAssignmentRepository.createAssignment({
        technicianId: state.selectedTechnician.id,
        assignmentType: state.serviceType,
        scheduledDate: state.scheduledDate,
        startLatitude: state.startingPoint.latitude,
        startLongitude: state.startingPoint.longitude,
        totalDistanceKm: state.calculatedRoute?.totalDistanceKm ?? 0,
        stops: state.cartStops.map((s) => ({
          codigoFijoId: s.fixedCodeId,
          orderIndex: s.orderIndex,
          targetStatus: s.targetStatus ?? targetDefaultStatus,
          currentStatus: s.status,
          routeGeometry: s.routeGeometry ?? null,
        })),
      });

      if (res.ok) {
        dispatch({ type: "FINISH_SAVING" });
        dispatch({ type: "RESET_WIZARD" });
        appToast.success("Nueva asignación creada con éxito");
        router.push("/asignacion-rutas");
      } else {
        dispatch({
          type: "FAIL_SAVING",
          payload: res.errors?.[0] || "No se pudo crear la asignación",
        });
        appToast.error(
          "Error al guardar asignación",
          res.errors?.[0] || "Hubo un problema al persistir la asignación."
        );
      }
    } catch {
      dispatch({
        type: "FAIL_SAVING",
        payload: "Error de red al guardar la asignación",
      });
      appToast.error("Error de conexión con el servidor.");
    }
  }, [
    state.cartStops,
    state.selectedTechnician,
    state.scheduledDate,
    state.serviceType,
    state.startingPoint,
    state.calculatedRoute,
    router,
  ]);

  const canAdvance = useMemo(() => {
    switch (state.currentStep) {
      case RouteWizardStep.WELCOME:
        return true;
      case RouteWizardStep.TECHNICIAN:
        return state.selectedTechnician !== null;
      case RouteWizardStep.SCHEDULE_DATE:
        return Boolean(state.scheduledDate && state.scheduledDate.trim().length > 0);
      case RouteWizardStep.SERVICE_TYPE:
        return state.serviceType !== null;
      case RouteWizardStep.STARTING_POINT:
        return state.startingPoint !== null;
      case RouteWizardStep.STOPS_CART:
        return state.cartStops.length > 0 && state.calculationState === "calculated";
      case RouteWizardStep.SUMMARY:
        return true;
      default:
        return false;
    }
  }, [
    state.currentStep,
    state.selectedTechnician,
    state.scheduledDate,
    state.serviceType,
    state.startingPoint,
    state.cartStops.length,
    state.calculationState,
  ]);

  const nextStep = useCallback(() => {
    if (!canAdvance) return;
    if (state.currentStep === RouteWizardStep.WELCOME) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.TECHNICIAN });
    } else if (state.currentStep === RouteWizardStep.TECHNICIAN) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.SCHEDULE_DATE });
    } else if (state.currentStep === RouteWizardStep.SCHEDULE_DATE) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.SERVICE_TYPE });
    } else if (state.currentStep === RouteWizardStep.SERVICE_TYPE) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.STARTING_POINT });
    } else if (state.currentStep === RouteWizardStep.STARTING_POINT) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.STOPS_CART });
    } else if (state.currentStep === RouteWizardStep.STOPS_CART) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.SUMMARY });
    }
  }, [canAdvance, state.currentStep]);

  const prevStep = useCallback(() => {
    if (state.currentStep === RouteWizardStep.SUMMARY) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.STOPS_CART });
    } else if (state.currentStep === RouteWizardStep.STOPS_CART) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.STARTING_POINT });
    } else if (state.currentStep === RouteWizardStep.STARTING_POINT) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.SERVICE_TYPE });
    } else if (state.currentStep === RouteWizardStep.SERVICE_TYPE) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.SCHEDULE_DATE });
    } else if (state.currentStep === RouteWizardStep.SCHEDULE_DATE) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.TECHNICIAN });
    } else if (state.currentStep === RouteWizardStep.TECHNICIAN) {
      dispatch({ type: "GO_TO_STEP", payload: RouteWizardStep.WELCOME });
    }
  }, [state.currentStep]);

  const cancel = useCallback(() => {
    router.push("/asignacion-rutas");
  }, [router]);

  const resetWizard = useCallback(() => {
    dispatch({ type: "RESET_WIZARD" });
  }, []);

  const goToStep = useCallback((step: RouteWizardStep) => {
    dispatch({ type: "GO_TO_STEP", payload: step });
  }, []);

  const isSearchVisible = state.currentStep === RouteWizardStep.STOPS_CART;

  const value = useMemo(
    () => ({
      state,
      isStarted: state.isStarted,
      currentStep: state.currentStep,
      selectedTechnician: state.selectedTechnician,
      scheduledDate: state.scheduledDate,
      serviceType: state.serviceType,
      startingPoint: state.startingPoint,
      cartStops: state.cartStops,
      calculationState: state.calculationState,
      calculatedRoute: state.calculatedRoute,
      isSaving: state.isSaving,
      saveError: state.saveError,
      isSearchVisible,
      canAdvance,
      startWizard,
      selectTechnician,
      setScheduledDate,
      selectServiceType,
      setStartingPoint,
      addStop,
      removeStop,
      reorderStops,
      calculateRoutes,
      saveAssignment,
      nextStep,
      prevStep,
      cancel,
      resetWizard,
      goToStep,
    }),
    [
      state,
      isSearchVisible,
      canAdvance,
      startWizard,
      selectTechnician,
      setScheduledDate,
      selectServiceType,
      setStartingPoint,
      addStop,
      removeStop,
      reorderStops,
      calculateRoutes,
      saveAssignment,
      nextStep,
      prevStep,
      cancel,
      resetWizard,
      goToStep,
    ]
  );

  return (
    <RouteCreationWizardContext.Provider value={value}>
      {children}
    </RouteCreationWizardContext.Provider>
  );
}

export function useRouteCreationWizard(): RouteCreationWizardContextType {
  const context = useContext(RouteCreationWizardContext);
  if (!context) {
    throw new Error(
      "useRouteCreationWizard debe utilizarse dentro de un RouteCreationWizardProvider"
    );
  }
  return context;
}
