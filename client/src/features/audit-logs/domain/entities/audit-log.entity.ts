export type ActionType =
  | "LOGIN"
  | "LOGOUT"
  | "SEARCH"
  | "CREATE"
  | "UPDATE"
  | "DELETE";

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  userEmail?: string | null;
  action: ActionType;
  description: string;
  createdDate: string; // ISO 8601 formatted date string
}

export interface PaginatedAuditLogs {
  items: AuditLogItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
