import type { Sport, Stat } from "../../types";

/** Meta ciega: el cliente puede verla. Las cifras viven en data.generated.json. */
export const NBA_SPORT: Sport = {
  id: "nba",
  name: "NBA",
  scope: "Carrera",
  logo: "/sports/nba.svg",
  photoUrl: "https://cdn.nba.com/headshots/nba/latest/260x190/{id}.png",
};

export const NBA_STATS: Stat[] = [
  { id: "pts", label: "Puntos", note: "Puntos totales anotados en temporada regular." },
  { id: "trb", label: "Rebotes", note: "Rebotes totales, ofensivos y defensivos." },
  { id: "ast", label: "Asistencias", note: "Asistencias totales en temporada regular." },
  { id: "blk", label: "Tapones", note: "Tapones registrados desde que la NBA los contabiliza (1973-74)." },
  { id: "stl", label: "Robos", note: "Balones robados desde que la NBA los contabiliza (1973-74)." },
  { id: "fg3", label: "Triples", note: "Triples anotados desde que existe la línea (1979-80)." },
];
