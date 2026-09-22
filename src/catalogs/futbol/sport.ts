import type { Sport, Stat } from "../../types";

/**
 * Meta ciega: el cliente puede verla. Las cifras viven en
 * `src/football.generated.json`, que genera `npm run sync:football`.
 *
 * Sin `photoUrl`: no hay CDN de fotos de futbolistas al que tirar, así que
 * los huecos enseñan las iniciales. La NBA sí tiene y por eso lo usa.
 */
export const FOOTBALL_SPORT: Sport = {
  id: "futbol",
  name: "Fútbol",
  scope: "Clubes y selecciones",
  logo: "/sports/futbol.svg",
  photoUrl: "",
};

/**
 * Las seis categorías, elegidas con el informe de `sync-football.mjs` delante
 * y no a ojo. Los ids son los mismos que genera el script, para que no haya
 * que traducir nada entre el archivo y el catálogo.
 *
 * Cada `note` dice desde cuándo cuenta, igual que hace la NBA con los tapones
 * y los triples. La fuente de clubes empieza en 2012, así que "Goles en
 * LaLiga" son los de esta última década: Messi sale con 305 y no con sus 474,
 * porque le faltan sus ocho primeras temporadas. Decirlo evita que parezca
 * que el juego está roto.
 */
export const FOOTBALL_STATS: Stat[] = [
  {
    id: "ES1_gol",
    label: "Goles en LaLiga",
    note: "Goles en Primera División española desde 2012.",
  },
  {
    id: "GB1_gol",
    label: "Goles en la Premier",
    note: "Goles en la Premier League inglesa desde 2012.",
  },
  {
    id: "GB1_asi",
    label: "Asistencias en la Premier",
    note: "Asistencias en la Premier League inglesa desde 2012.",
  },
  {
    id: "CL_par",
    label: "Partidos en Champions",
    note: "Partidos jugados en la Liga de Campeones desde 2012.",
  },
  {
    id: "ES1_par",
    label: "Partidos en LaLiga",
    note: "Partidos jugados en Primera División española desde 2012.",
  },
  {
    id: "SEL_gol",
    label: "Goles con su selección",
    note: "Goles en partidos internacionales oficiales, desde 1916. No cuenta lo marcado con el club.",
  },
];
