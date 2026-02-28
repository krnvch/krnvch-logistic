export const queryKeys = {
  shipments: ["shipments"] as const,
  shipment: (id: string) => ["shipment", id] as const,
  orders: (shipmentId: string) => ["orders", shipmentId] as const,
  placements: (shipmentId: string) => ["placements", shipmentId] as const,
  shipmentsProgress: (ids: string[]) => ["shipments-progress", ...ids] as const,
};
