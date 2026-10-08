export interface Station {
  id: string;
  name: string;
  /** [lng, lat] */
  coords: [number, number];
}

/**
 * Hardcoded Stations near Yio Chu Kang MRT, Singapore.
 * PLACEHOLDERS — to be replaced with real Station names & coordinates.
 */
export const STATIONS: Station[] = [
  { id: 'a', name: 'Station A (placeholder)', coords: [103.7665, 1.3888] },
  { id: 'b', name: 'Station B (placeholder)', coords: [103.7750, 1.3960] },
  { id: 'c', name: 'Station C (placeholder)', coords: [103.7580, 1.3820] },
];
