import type { FixedCodeCandidate } from "../../domain/entities/fixed-code-candidate.entity";
import {
  RouteCalculationState,
  RouteCartStop,
  RouteCreationWizardState,
  RouteStartingPoint,
  RouteTechnician,
  RouteWizardStep,
} from "../../domain/entities/route-wizard.entity";

export type RouteWizardAction =
  | { type: "START_WIZARD" }
  | { type: "SELECT_TECHNICIAN"; payload: RouteTechnician }
  | { type: "SET_STARTING_POINT"; payload: RouteStartingPoint }
  | { type: "ADD_STOP"; payload: FixedCodeCandidate }
  | { type: "REMOVE_STOP"; payload: { id: string } }
  | { type: "REORDER_STOPS"; payload: RouteCartStop[] }
  | { type: "START_CALCULATION" }
  | { type: "FINISH_CALCULATION" }
  | { type: "GO_TO_STEP"; payload: RouteWizardStep }
  | { type: "RESET_WIZARD" };

export const initialWizardState: RouteCreationWizardState = {
  isStarted: false,
  currentStep: RouteWizardStep.WELCOME,
  selectedTechnician: null,
  startingPoint: null,
  cartStops: [],
  calculationState: "idle",
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

    case "SET_STARTING_POINT": {
      return {
        ...state,
        startingPoint: action.payload,
      };
    }

    case "ADD_STOP": {
      const candidate = action.payload;
      // Prevenir duplicados si ya existe en el carrito
      if (state.cartStops.some((s) => s.fixedCodeId === candidate.id)) {
        return state;
      }

      const newStop: RouteCartStop = {
        id: candidate.id,
        fixedCodeId: candidate.id,
        fixedCode: candidate.fixedCode,
        name: candidate.name,
        status: candidate.status,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        orderIndex: state.cartStops.length + 1,
      };

      return {
        ...state,
        cartStops: [...state.cartStops, newStop],
        calculationState: "idle", // Si se añade una parada, se debe recalcular
      };
    }

    case "REMOVE_STOP": {
      const filtered = state.cartStops.filter((s) => s.id !== action.payload.id);
      return {
        ...state,
        cartStops: reindexStops(filtered),
        calculationState: "idle", // Se debe recalcular tras eliminar
      };
    }

    case "REORDER_STOPS": {
      return {
        ...state,
        cartStops: reindexStops(action.payload),
        calculationState: "idle",
      };
    }

    case "START_CALCULATION": {
      return {
        ...state,
        calculationState: "calculating",
      };
    }

    case "FINISH_CALCULATION": {
      return {
        ...state,
        calculationState: "calculated",
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
