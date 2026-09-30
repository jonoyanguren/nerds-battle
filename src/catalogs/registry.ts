import { NBA_SPORT } from "./nba/sport";
import { FOOTBALL_SPORT } from "./futbol/sport";
import { F1_SPORT } from "./f1/sport";
import type { Sport, SportCategory } from "../types";

/** Solo meta. Importable desde el cliente: no tira del JSON de cifras. */
export const SPORTS: Sport[] = [NBA_SPORT, FOOTBALL_SPORT, F1_SPORT];

export const DEFAULT_SPORT_ID = NBA_SPORT.id;

export function getSport(id: string): Sport | undefined {
  return SPORTS.find(s => s.id === id);
}

/** El orden en que salen las familias, y cómo se llaman en pantalla. Vive
 *  aquí y no en el componente: añadir un catálogo no debería obligar a
 *  tocar la UI, solo a declarar su `category`. */
const ORDEN: SportCategory[] = ["equipo", "motor", "individual"];

const NOMBRE: Record<SportCategory, string> = {
  equipo: "De equipo",
  motor: "Motor",
  individual: "Individual",
};

export type SportGroup = { category: SportCategory; label: string; sports: Sport[] };

/** Agrupado y sin familias vacías: con dos catálogos esto es una sola fila
 *  y no se nota, que es justo lo que tiene que pasar. */
export function sportGroups(): SportGroup[] {
  return ORDEN
    .map(category => ({
      category,
      label: NOMBRE[category],
      sports: SPORTS.filter(s => s.category === category),
    }))
    .filter(g => g.sports.length > 0);
}
