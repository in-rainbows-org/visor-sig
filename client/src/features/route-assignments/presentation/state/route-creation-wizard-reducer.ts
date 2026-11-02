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

export type RouteWizardAction =
  | { type: "START_WIZARD" }
  | { type: "SELECT_TECHNICIAN"; payload: RouteTechnician }
  | { type: "SET_SCHEDULED_DATE"; payload: string }
  | { type: "SELECT_SERVICE_TYPE"; payload: RouteServiceType }
  | { type: "SET_STARTING_POINT"; payload: RouteStartingPoint }
  | { type: "ADD_STOP"; payload: FixedCodeCandidate }
  | { type: "REMOVE_STOP"; payload: { id: string } }
  | { type: "REORDER_STOPS"; payload: RouteCartStop[] }
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "SET_CALCULATED_ROUTE"; payload: CalculatedRoute }
  | { type: "FAIL_CALCULATION" }
  | { type: "START_SAVING" }
  | { type: "FAIL_SAVING"; payload: string }
  | { type: "FINISH_SAVING" }
  | { type: "GO_TO_STEP"; payload: RouteWizardStep }
  | { type: "RESET_WIZARD" };

function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const initialWizardState: RouteCreationWizardState = {
  isStarted: false,
  currentStep: RouteWizardStep.WELCOME,
  selectedTechnician: null,
  scheduledDate: getTodayDateString(),
  serviceType: null,
  startingPoint: null,
  cartStops: [],
  calculationState: "idle",
  calculatedRoute: null,
  isSaving: false,
  saveError: null,
};

/**
 * Re-indexa una lista de paradas asignando orden ascendente del 1 al N.
 */
function reindexStops(stops: RouteCartStop[]): RouteCartStop[] {
  return stops.map((stop, index) => ({
    ...stop,
    orderIndex: index + 1,
  }));
}

export function routeCreationWizardReducer(
  state: RouteCreationWizardState,
  action: RouteWizardAction
): RouteCreationWizardState {
  switch (action.type) {
    case "START_WIZARD": {
      return {
        ...state,
        isStarted: true,
        currentStep: RouteWizardStep.TECHNICIAN,
      };
    }

    case "SELECT_TECHNICIAN": {
      return {
        ...state,
        selectedTechnician: action.payload,
      };
    }

    case "SET_SCHEDULED_DATE": {
      return {
        ...state,
        scheduledDate: action.payload,
      };
    }

    case "SELECT_SERVICE_TYPE": {
      const nextServiceType = action.payload;
      const targetStatus = nextServiceType === "CUT" ? 3 : 1;

      // Depurar paradas incompatibles si ya existían en el carrito
      const sanitizedStops = state.cartStops
        .filter((stop) => {
          if (nextServiceType === "CUT") {
            return stop.status !== 3;
          }
          if (nextServiceType === "RECONNECTION") {
            return stop.status !== 1;
          }
          return true;
        })
        .map((stop) => ({
          ...stop,
          serviceType: nextServiceType,
          targetStatus,
        }));

      const stopsChanged = sanitizedStops.length !== state.cartStops.length;

      return {
        ...state,
        serviceType: nextServiceType,
        cartStops: reindexStops(sanitizedStops),
        calculationState: stopsChanged ? "idle" : state.calculationState,
        calculatedRoute: stopsChanged ? null : state.calculatedRoute,
      };
    }

    case "SET_STARTING_POINT": {
      return {
        ...state,
        startingPoint: action.payload,
        calculationState: "idle",
        calculatedRoute: null,
      };
    }

    case "ADD_STOP": {
      const candidate = action.payload;
      // Prevenir duplicados si ya existe en el carrito
      if (state.cartStops.some((s) => s.fixedCodeId === candidate.id)) {
        return state;
      }

      const targetStatus = state.serviceType === "CUT" ? 3 : 1;

      const newStop: RouteCartStop = {
        id: candidate.id,
        fixedCodeId: candidate.id,
        fixedCode: candidate.fixedCode,
        name: candidate.name,
        status: candidate.status,
        serviceType: state.serviceType ?? undefined,
        targetStatus,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        orderIndex: state.cartStops.length + 1,
      };

      return {
        ...state,
        cartStops: [...state.cartStops, newStop],
        calculationState: "idle",
        calculatedRoute: null,
      };
    }

    case "REMOVE_STOP": {
      const filtered = state.cartStops.filter((s) => s.id !== action.payload.id);
      return {
        ...state,
        cartStops: reindexStops(filtered),
        calculationState: "idle",
        calculatedRoute: null,
      };
    }

    case "REORDER_STOPS": {
      return {
        ...state,
        cartStops: reindexStops(action.payload),
        calculationState: "idle",
        calculatedRoute: null,
      };
    }

    case "START_CALCULATION": {
      return {
        ...state,
        calculationState: "calculating",
      };
    }

    case "SET_CALCULATED_ROUTE": {
      const route = action.payload;
      const orderMap = new Map<string, number>();
      route.orderedStops.forEach((s, idx) => {
        orderMap.set(s.codigoFijoId, s.orderIndex ?? (idx + 1));
      });

      const reorderedStops = [...state.cartStops]
        .map((stop) => {
          const newOrder =
            orderMap.get(stop.fixedCodeId) ?? orderMap.get(stop.id);
          return {
            ...stop,
            orderIndex: newOrder ?? stop.orderIndex,
          };
        })
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((stop, idx) => ({
          ...stop,
          orderIndex: idx + 1,
        }));

      return {
        ...state,
        calculationState: "calculated",
        calculatedRoute: route,
        cartStops: reorderedStops,
      };
    }

    case "FAIL_CALCULATION": {
      return {
        ...state,
        calculationState: "idle",
      };
    }

    case "FINISH_CALCULATION": {
      return {
        ...state,
        calculationState: "calculated",
      };
    }

    case "START_SAVING": {
      return {
        ...state,
        isSaving: true,
        saveError: null,
      };
    }

    case "FAIL_SAVING": {
      return {
        ...state,
        isSaving: false,
        saveError: action.payload,
      };
    }

    case "FINISH_SAVING": {
      return {
        ...state,
        isSaving: false,
        saveError: null,
      };
    }

    case "GO_TO_STEP": {
      return {
        ...state,
        currentStep: action.payload,
      };
    }

    case "RESET_WIZARD": {
      return initialWizardState;
    }

    default:
      return state;
  }
}
