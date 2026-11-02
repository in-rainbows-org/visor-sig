import type { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import type { FixedCodeCandidate } from "@/features/route-assignments/domain/entities/fixed-code-candidate.entity";

/**
 * Estado general de componentes móviles y tablets (< 1024px)
 */
export interface RouteCreationMobileState {
  /** Determina si el Bottom Sheet del asistente guiado está desplegado */
  isWizardSheetOpen: boolean;

  /** Determina si el Bottom Sheet modal de resultados de búsqueda está desplegado */
  isSearchResultsSheetOpen: boolean;

  /** Controla el estado colapsado/expandido del banner superior de búsqueda en el Paso 3 */
  isSearchHeaderCollapsed: boolean;
}

/**
 * Props para el botón activador flotante inferior móvil
 */
export interface RouteCreationMobileTriggerProps {
  /** Paso activo actual en el wizard */
  currentStep: RouteWizardStep;
  /** Cantidad de paradas actualmente en el carrito */
  cartStopsCount: number;
  /** Indica si el bottom sheet ya está abierto */
  isOpen: boolean;
  /** Callback para abrir el bottom sheet del asistente */
  onOpen: () => void;
  /** Clases CSS adicionales opcionales */
  className?: string;
}

/**
 * Props para el Bottom Sheet del asistente guiado en móviles
 */
export interface RouteCreationMobileWizardProps {
  /** Estado de apertura del sheet */
  isOpen: boolean;
  /** Handler de cambio de apertura (abrir/cerrar) */
  onOpenChange: (open: boolean) => void;
  /** Clases CSS adicionales opcionales */
  className?: string;
}

/**
 * Props para la cabecera superior móvil de búsqueda
 */
export interface RouteCreationMobileHeaderProps {
  /** Valor de texto de búsqueda por código fijo */
  query: string;
  /** Callback al cambiar el valor del input */
  onQueryChange: (query: string) => void;
  /** Callback al enviar formulario de búsqueda */
  onSearch: (e?: React.FormEvent) => void;
  /** Limpiar valor de búsqueda */
  onClear: () => void;
  /** Estado de carga de búsqueda */
  isSearching: boolean;
  /** Total de candidatos devueltos */
  candidatesCount: number;
  /** Clases CSS adicionales opcionales */
  className?: string;
}

/**
 * Props para el Bottom Sheet modal de resultados de búsqueda móvil
 */
export interface RouteCreationMobileResultsProps {
  /** Estado de apertura del sheet */
  isOpen: boolean;
  /** Handler de cambio de apertura */
  onOpenChange: (open: boolean) => void;
  /** Candidatos encontrados */
  candidates: FixedCodeCandidate[];
  /** Estado de carga de búsqueda */
  isSearching: boolean;
  /** Callback para enfocar candidato en el mapa */
  onSelectCandidate: (candidate: FixedCodeCandidate) => void;
  /** Callback para agregar candidato al carrito */
  onAddCandidate: (candidate: FixedCodeCandidate) => void;
  /** IDs de candidatos ya agregados al carrito */
  addedCandidateIds: (string | number)[];
  /** Clases CSS adicionales opcionales */
  className?: string;
}
