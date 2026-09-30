"use client";

import React, { useState } from "react";
import type { Layer } from "../../domain/entities/layer.entity";
import { LayerCard } from "./layer-card";
import { LayerEmptyState } from "./layer-empty-state";

export type LayerGridProps = {
  layers: Layer[];
  onSelectLayer?: (layer: Layer) => void;
};

export function LayerGrid({
  layers,
  onSelectLayer,
}: LayerGridProps) {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  const handleSelect = (layer: Layer) => {
    setSelectedLayerId(layer.id);
    onSelectLayer?.(layer);
  };

  if (layers.length === 0) {
    return <LayerEmptyState onCreateClick={() => {}} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {layers.map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            onSelect={handleSelect}
            isSelected={selectedLayerId === layer.id}
          />
        ))}
      </div>
    </div>
  );
}

export default LayerGrid;
