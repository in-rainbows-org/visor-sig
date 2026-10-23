"use client";

import React from "react";
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
  User as UserIcon,
  Ban,
  Unlock,
  Loader2,
  Calendar,
  Mail,
} from "lucide-react";
import { APP_ROLES, type AppRole } from "@/lib/auth-roles";
import type { User } from "../../../domain/entities/user.entity";
import { cn } from "@/lib/utils";

export interface UserCardProps {
  user: User;
  isActionLoading: boolean;
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

export function UserCard({
  user,
  isActionLoading,
  onRoleChange,
  onRequestBan,
  onUnban,
}: UserCardProps) {
  const isSelf = user.isCurrentUser;

  return (
    <div
      className={cn(
        "rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border-0 shadow-none space-y-3.5 select-none hover:bg-white/95 transition-all",
        isSelf && "bg-blue-50/30 hover:bg-blue-50/40"
      )}
    >
      {/* Header: Avatar, Name, Email, Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center overflow-hidden shrink-0 font-bold text-sm border-0 shadow-none">
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
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900 truncate">
                {user.name}
              </h3>
              {isSelf && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border-0 shadow-none">
                  (Tú)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-sans truncate mt-0.5">
              <Mail className="size-3 text-slate-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="shrink-0">
          {user.banned ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border-0 shadow-none">
              <span className="size-1.5 rounded-full bg-rose-600 animate-pulse" />
              Bloqueado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border-0 shadow-none">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Activo
            </span>
          )}
        </div>
      </div>

      {user.banned && (
        <div className="p-3 rounded-2xl bg-rose-50/80 border-0 text-xs text-rose-800 space-y-0.5 font-sans">
          <p className="font-semibold">
            Duración: {formatBanExpiry(user.banExpires)}
          </p>
          {user.banReason && (
            <p className="text-rose-700/90 italic">
              &quot;{user.banReason}&quot;
            </p>
          )}
        </div>
      )}

      {/* Meta info: Fecha de Registro dentro de contenedor gris suave */}
      <div className="rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 border-0 text-xs text-slate-600 font-sans flex items-center justify-between">
        <span className="text-slate-500">Registrado:</span>
        <div className="flex items-center gap-1 text-slate-800 font-medium">
          <Calendar className="size-3 text-slate-400" />
          <span>{formatDate(user.createdAt)}</span>
        </div>
      </div>

      {/* Acciones: Selector de Rol y Botón de Bloqueo/Desbloqueo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
        {/* Selector de Rol */}
        <div>
          <Select
            value={user.role}
            onValueChange={(val) => onRoleChange(user.id, val as AppRole)}
            disabled={isSelf || isActionLoading}
          >
            <SelectTrigger
              className={cn(
                "h-9 w-full text-xs rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 shadow-none px-3 transition-colors",
                user.role === APP_ROLES.ADMIN
                  ? "text-blue-700 font-semibold"
                  : "text-slate-700",
                isSelf && "cursor-not-allowed opacity-80"
              )}
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

        {/* Botón de Acción */}
        <div>
          {isSelf ? (
            <div className="h-9 rounded-full bg-slate-50 border-0 flex items-center justify-center text-xs text-slate-400 italic">
              Sin acciones
            </div>
          ) : user.banned ? (
            <Button
              variant="outline"
              onClick={() => onUnban(user.id)}
              disabled={isActionLoading}
              className="h-9 w-full rounded-full text-xs gap-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-0 shadow-none font-semibold cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Unlock className="size-3.5" />
              )}
              <span>Desbloquear</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => onRequestBan(user)}
              disabled={isActionLoading}
              className="h-9 w-full rounded-full text-xs gap-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border-0 shadow-none font-semibold cursor-pointer"
            >
              {isActionLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Ban className="size-3.5" />
              )}
              <span>Bloquear</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
