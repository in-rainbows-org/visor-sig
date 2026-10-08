import React, { Suspense } from "react";
import MapaLoading from "./loading";
import { MapViewProvider } from "@/features/map/presentation/state/map-view-store";
import { MapView } from "@/features/map/presentation/components/views/map-view";

export default function MapaPage() {
  return (
    <Suspense fallback={<MapaLoading />}>
      <MapViewProvider>
        <MapView />
      </MapViewProvider>
    </Suspense>
  );
}
