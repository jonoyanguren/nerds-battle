import type { Sport, Stat } from "../../types";

/**
 * Meta ciega: el cliente puede verla. Las cifras viven en
 * `src/f1.generated.json`, que genera `npm run sync:f1`.
 *
 * Sin fotos: F1DB no trae retratos y no hay CDN abierto de pilotos, así que
 * `photoUrl` va vacío y `Face` enseña las iniciales con su tono estable.
 * No es un olvido; si algún día aparece una fuente de retratos con licencia
 * clara, esto es lo único que hay que tocar.
 */
export const F1_SPORT: Sport = {
  id: "f1",
  name: "Fórmula 1",
  scope: "Toda la historia",
  logo: "/sports/f1.svg",
  photoUrl: "",
  category: "motor",
};

/**
 * Las cinco categorías salen del informe de `sync-f1.mjs --report`, no de
 * lo que apetecía poner.
 *
 * Y aquí hay una lección que conviene no perder: **en la F1 las cifras
 * famosas son justo las injugables.** Al revés que en la NBA, donde lo que
 * la gente se sabe (los puntos de LeBron) son decenas de miles, aquí los
 * números que todo el mundo conoce son pequeños, y con objetivos pequeños
 * fallar por uno se lleva media puntuación:
 *
 *   podios          coste/1  52 pts
 *   poles           coste/1 116 pts
 *   victorias       coste/1 128 pts
 *   campeonatos     coste/1 455 pts   (objetivo mediano: 11)
 *
 * Con «victorias» dentro, equivocarte en un Gran Premio —de 39 que pide el
 * objetivo— te costaría 128 de 1000. Eso no es un reto difícil, es una
 * lotería. Por eso están fuera aunque duela.
 */
export const F1_STATS: Stat[] = [
  {
    id: "vueltas",
    label: "Vueltas completadas",
    note: "Vueltas dadas en Grandes Premios desde 1950. No cuentan entrenamientos ni clasificación.",
  },
  {
    id: "puntos",
    label: "Puntos en toda su carrera",
    note: "Puntos sumados en Grandes Premios desde 1950. El sistema de puntuación ha cambiado varias veces: desde 2010 se reparten muchos más, así que los pilotos modernos acumulan antes.",
  },
  {
    id: "gp",
    label: "Grandes Premios disputados",
    note: "Carreras en las que llegó a tomar la salida, desde 1950. No cuenta inscribirse y no salir.",
  },
  {
    id: "terminadas",
    label: "Carreras terminadas",
    note: "Grandes Premios que acabó con posición final, desde 1950.",
  },
  {
    id: "abandonos",
    label: "Abandonos",
    note: "Grandes Premios en los que se retiró, por avería o accidente. Desde 1950.",
  },
];
