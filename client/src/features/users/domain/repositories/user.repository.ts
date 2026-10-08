import type { ApiResult, ApiActionResult } from "@/features/shared/domain/types/api-results";
import type { User, BanUserRequest, UpdateRoleRequest } from "../entities/user.entity";

export interface UserRepository {
  /**
   * Obtiene la lista de usuarios del sistema, marcando con isCurrentUser
   * al usuario correspondiente a la sesión activa.
   */
  getUsers(currentUserId?: string): Promise<ApiResult<User[]>>;

  /**
   * Modifica el rol de un usuario del sistema (ADMIN / CONSULTANT).
   */
  updateRole(request: UpdateRoleRequest): Promise<ApiActionResult>;

  /**
   * Bloquea temporal o permanentemente a un usuario con motivo y revoca sus sesiones.
   */
  banUser(request: BanUserRequest): Promise<ApiActionResult>;

  /**
   * Desbloquea a un usuario suspendido permitiendo nuevamente el inicio de sesión.
   */
  unbanUser(userId: string): Promise<ApiActionResult>;
}
