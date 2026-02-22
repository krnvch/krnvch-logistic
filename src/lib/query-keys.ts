export const queryKeys = {
  shipment: ["shipment"] as const,
  orders: (shipmentId: string) => ["orders", shipmentId] as const,
  placements: (shipmentId: string) => ["placements", shipmentId] as const,
};
