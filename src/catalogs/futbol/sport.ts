import type { Sport, Stat } from "../../types";

/**
 * Meta ciega: el cliente puede verla. Las cifras viven en
 * `src/football.generated.json`, que genera `npm run sync:football`.
 *
 * Fotos: CDN de Transfermarkt. El `photoId` es el archivo con timestamp
 * (`10-1448468291.jpg`); el id suelto da 404. Quien no cruce en el sync
 * se queda sin `photoId` y Face enseña las iniciales.
 */
export const FOOTBALL_SPORT: Sport = {
  id: "futbol",
  name: "Fútbol",
  scope: "Clubes y selecciones",
  logo: "/sports/futbol.svg",
  photoUrl: "https://img.a.transfermarkt.technology/portrait/header/{id}",
};

/**
 * Las cinco categorías, elegidas con el informe de `sync-football.mjs`
 * delante y no a ojo. Los ids son los mismos que genera el script, para que
 * no haya que traducir nada entre el archivo y el catálogo.
 *
 * Cada `note` dice desde cuándo cuenta, igual que hace la NBA con los tapones
 * y los triples. La fuente de clubes empieza en 2012.
 *
 * NO hay goles en LaLiga, y la ausencia es deliberada: es la única categoría
 * donde ese corte contradice una cifra que la gente se sabe. Messi saldría
 * con 305 goles en vez de 474, y quien ve eso no piensa «periodo acotado»,
 * piensa «esto está roto». Las que quedan o están casi completas —Kane y
 * Salah jugaron toda su carrera después de 2012, y las asistencias oficiales
 * no existen antes de 2006— o no tienen una cifra histórica que las
 * contradiga, como los partidos jugados.
 */
export const FOOTBALL_STATS: Stat[] = [
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
