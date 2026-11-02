import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LegacyNuevaAsignacionPage() {
  redirect("/asignacion-rutas/nueva-asignacion");
}

