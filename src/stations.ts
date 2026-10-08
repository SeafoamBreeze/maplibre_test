export interface Station {
  id: string;
  name: string;
  /** [lng, lat] */
  coords: [number, number];
}

/**
 * Hardcoded Stations in the Yio Chu Kang / Lentor area, Singapore.
 */
export const STATIONS: Station[] = [
  { id: 'a', name: 'Yio Chu Kang MRT', coords: [103.84495065307375, 1.3821109508497351] },
  { id: 'b', name: 'NCS', coords: [103.84425327876374, 1.3881173433648717] },
  { id: 'c', name: 'Lentor MRT', coords: [103.83691568084244, 1.3848830537685093] },
];
