"use client";

import type { ChartLayer } from "@components/charts/chart-layer-system";
import { useCallback, useState } from "react";

export function useChartLayers(initialLayers: ChartLayer[]) {
  const [layers, setLayers] = useState<ChartLayer[]>(initialLayers);
  const [focusedLayer, setFocusedLayer] = useState<string | null>(null);

  const handleLayerVisibilityChange = useCallback(
    (layerId: string, visible: boolean) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId ? { ...layer, visible } : layer,
        ),
      );
    },
    [],
  );

  const handleLayerReorder = useCallback((newLayers: ChartLayer[]) => {
    setLayers(newLayers);
  }, []);

  const handleLayerFocus = useCallback((layerId: string | null) => {
    setFocusedLayer(layerId);
  }, []);

  const getVisibleLayers = useCallback(() => {
    return layers.filter((layer) => layer.visible);
  }, [layers]);

  const getLayerById = useCallback(
    (layerId: string) => {
      return layers.find((layer) => layer.id === layerId);
    },
    [layers],
  );

  const updateLayer = useCallback(
    (layerId: string, updates: Partial<ChartLayer>) => {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === layerId ? { ...layer, ...updates } : layer,
        ),
      );
    },
    [],
  );

  const addLayer = useCallback((layer: ChartLayer) => {
    setLayers((prev) => [...prev, layer]);
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.filter((layer) => layer.id !== layerId));
  }, []);

  return {
    layers,
    focusedLayer,
    handleLayerVisibilityChange,
    handleLayerReorder,
    handleLayerFocus,
    getVisibleLayers,
    getLayerById,
    updateLayer,
    addLayer,
    removeLayer,
  };
}
