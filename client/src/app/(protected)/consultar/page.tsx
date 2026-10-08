import React from "react";
import { ConsultationView } from "@/features/consultations/presentation/components/elements/consultation-view";

export const metadata = {
  title: "Consultas Alfanuméricas - VisorSIG",
  description: "Consultas alfanuméricas sobre capas de información geográfica y catastro",
};

export default function ConsultarPage() {
  return <ConsultationView />;
}
