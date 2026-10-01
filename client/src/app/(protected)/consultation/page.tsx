import React from "react";
import { ConsultationContainer } from "@/features/consultation/presentation/components/consultation-container";

export const metadata = {
  title: "Consultas y Filtros - VisorSIG",
  description: "Consultas alfanuméricas sobre capas de información geográfica y catastro",
};

export default function ConsultationPage() {
  return <ConsultationContainer />;
}
