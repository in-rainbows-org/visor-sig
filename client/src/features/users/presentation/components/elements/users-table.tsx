"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ShieldAlert,
  User as UserIcon,
  Ban,
  Unlock,
  Loader2,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import type { User } from "../../../domain/entities/user.entity";
import { cn } from "@/lib/utils";

export interface UsersTableProps {
  users: User[];
  actionLoadingId: string | null;
  onRoleChange: (userId: string, newRole: AppRole) => Promise<boolean>;
  onRequestBan: (user: User) => void;
  onUnban: (userId: string) => Promise<boolean>;
}

function formatDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "Fecha desconocida";
  }
}

function formatBanExpiry(date: Date | null): string {
  if (!date) return "Permanente";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "Temporal";
  }
}

function getUserInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function UsersTable({
  users,
  actionLoadingId,
  onRoleChange,
  onRequestBan,
  onUnban,
}: UsersTableProps) {
  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none overflow-hidden select-none">
      <Table containerClassName="overflow-x-auto">
        <TableHeader>
          <TableRow className="border-b border-slate-100/80 bg-slate-50/40 hover:bg-slate-50/40">
            <TableHead className="py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Usuario
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Correo Electrónico
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Rol
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Estado
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fecha de Registro
            </TableHead>
            <TableHead className="py-4 pl-4 pr-6 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {users.map((user) => {
            const isSelf = user.isCurrentUser;
            const isRowLoading = actionLoadingId === user.id;

            return (
              <TableRow
                key={user.id}
                className={cn(
                  "border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors last:border-b-0",
                  isSelf && "bg-blue-50/30 hover:bg-blue-50/40"
                )}
              >
                {/* 1. Usuario (Avatar + Nombre + Tag Tú) */}
                <TableCell className="py-3.5 pl-6 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center overflow-hidden shrink-0 font-semibold text-xs border-0 shadow-none">
                      {user.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.image}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getUserInitials(user.name)
                      )}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {user.name}
                        </span>
                        {isSelf && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border-0 shadow-none">
                            (Tú)
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 font-mono truncate lg:hidden">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Correo Electrónico */}
                <TableCell className="py-3.5 px-4">
                  <span className="text-xs font-sans text-slate-600 select-all">
                    {user.email}
                  </span>
                </TableCell>

                {/* 3. Rol (Select interactivo plano y redondeado) */}
                <TableCell className="py-3.5 px-4">
                  <div className="w-36">
                    <Select
                      value={user.role}
                      onValueChange={(val) => onRoleChange(user.id, val as AppRole)}
                      disabled={isSelf || isRowLoading}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-8 text-xs rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 shadow-none px-3 transition-colors",
                          user.role === APP_ROLES.ADMIN
                            ? "text-blue-700 font-semibold"
                            : "text-slate-700",
                          isSelf && "cursor-not-allowed opacity-80 bg-slate-50"
                        )}
                        title={
                          isSelf
                            ? "No puedes cambiar tu propio rol de administrador"
                            : "Cambiar rol del usuario"
                        }
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="font-sans border-0 shadow-2xl shadow-slate-900/10 bg-white rounded-2xl p-1.5 text-xs z-[2000]">
                        <SelectItem value={APP_ROLES.ADMIN} className="text-xs rounded-xl py-2 px-3">
                          <div className="flex items-center gap-2">
                            <Shield className="size-3.5 text-blue-600" />
                            <span>Administrador</span>
                          </div>
                        </SelectItem>
                        <SelectItem value={APP_ROLES.CONSULTANT} className="text-xs rounded-xl py-2 px-3">
                          <div className="flex items-center gap-2">
                            <UserIcon className="size-3.5 text-slate-500" />
                            <span>Consultor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>

                {/* 4. Estado de la cuenta */}
                <TableCell className="py-3.5 px-4">
                  {user.banned ? (
                    <div className="inline-flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border-0 shadow-none">
                        <span className="size-1.5 rounded-full bg-rose-600 animate-pulse" />
                        Bloqueado
                      </span>
                      {user.banExpires ? (
                        <span className="text-[10px] text-slate-500 font-sans pl-1">
                          Hasta: {formatBanExpiry(user.banExpires)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-sans pl-1">
                          Permanente
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border-0 shadow-none">
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      Activo
                    </span>
                  )}
                </TableCell>

                {/* 5. Fecha de Registro */}
                <TableCell className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Calendar className="size-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </TableCell>

                {/* 6. Acciones */}
                <TableCell className="py-3.5 pl-4 pr-6 text-right">
                  {isSelf ? (
                    <span
                      className="text-xs text-slate-400 font-sans italic cursor-not-allowed select-none"
                      title="No es posible suspender la propia cuenta de administrador"
                    >
                      Sin acciones
                    </span>
                  ) : user.banned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUnban(user.id)}
                      disabled={isRowLoading}
                      className="h-8 rounded-full text-xs font-semibold gap-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-0 shadow-none px-3.5 cursor-pointer"
                    >
                      {isRowLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Unlock className="size-3.5" />
                      )}
                      <span>Desbloquear</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestBan(user)}
                      disabled={isRowLoading}
                      className="h-8 rounded-full text-xs font-semibold gap-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border-0 shadow-none px-3.5 cursor-pointer"
                    >
                      {isRowLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Ban className="size-3.5" />
                      )}
                      <span>Bloquear</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
