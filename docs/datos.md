# Los datos del juego

De dónde sale cada cifra, qué cubre y qué **no** cubre. Si añades un catálogo,
añade aquí su ficha: un jugador que vea un número raro tiene que poder venir
a este archivo y entender por qué.

## NBA

| | |
|---|---|
| Fuente | NBA Stats (`stats.nba.com/stats/alltimeleadersgrids`), oficial |
| Archivo | `src/data.generated.json` |
| Se regenera con | `npm run sync` |
| Cron | GitHub Actions, lunes 06:00 UTC |
| Cobertura | Toda la historia de la liga, temporada regular |
| Tamaño | 6 categorías × 3.000 jugadores |
| Fotos | Sí, CDN de la NBA por `nbaId` |

**Limitaciones.** Solo temporada regular: los playoffs no cuentan. Tapones y
robos empiezan en 1973-74 y los triples en 1979-80, porque antes no se
registraban — cada categoría lo dice en su `note`.

## Fútbol

Dos fuentes distintas, con coberturas distintas. Eso no es un descuido: no
existe una sola fuente abierta que cubra clubes y selecciones con historia
completa (ver «Lo que se descartó»).

| | |
|---|---|
| Fuentes | `martj42/international_results` (selecciones) y `dcaribou/transfermarkt-datasets` (clubes) |
| Archivo | `src/football.generated.json` |
| Se regenera con | `npm run sync:football -- --write` |
| Cron | **No hay.** Ver limitaciones |
| Tamaño | 6 categorías, hasta 3.000 jugadores cada una |
| Fotos | No. Los huecos enseñan las iniciales |

### Qué contiene

| Categoría | Jugadores | Líder | Periodo |
|---|---|---|---|
| Goles en LaLiga | 1.420 | Messi 305 | 2012–2026 |
| Goles en la Premier | 1.356 | Kane 213 | 2012–2026 |
| Asistencias en la Premier | 1.440 | De Bruyne 122 | 2012–2026 |
| Partidos en Champions | 3.816 → 3.000 | Lewandowski 138 | 2012–2026 |
| Partidos en LaLiga | 2.642 | Parejo 473 | 2012–2026 |
| Goles con su selección | 14.849 → 3.000 | Cristiano 124 | 1916–2026 |

Las categorías se eligieron con el informe de `sync-football.mjs`, que mide lo
que cuesta fallar por una unidad. Mezcla deliberada: tres de fama pura y dos de
partidos jugados, donde los líderes **no** son las estrellas —Parejo, Koke,
Neuer— y hay que saber de fútbol en vez de reconocer nombres.

### Limitaciones

**1. Los clubes empiezan en 2012.** Es la más importante y la que más
desconcierta. Messi sale con **305 goles en LaLiga** y no con sus 474: le
faltan sus ocho primeras temporadas. Cristiano con 199 en vez de ~311. Raúl,
Zarra o Hugo Sánchez **no aparecen**, porque se retiraron antes.

No es un error del dato: es un periodo acotado, y cada categoría lo dice en su
etiqueta. En cambio Kane, Salah, Mbappé o Haaland debutaron después de 2012, y
sus cifras sí son prácticamente completas.

**2. La fuente de clubes está congelada.** Su propio README lo dice: las
actualizaciones están paradas desde julio de 2026 y no hay fecha para
reanudarlas. Por eso el fútbol **no tiene cron**: no habría nada que
sincronizar. Los totales de carrera se mueven despacio —los de un retirado no
se mueven nunca— así que envejece mejor que una clasificación, pero envejece.

**3. Los goles de selección son solo de selección.** Messi aparece con 71, no
con los ~870 de toda su carrera. Es la cifra correcta de esa categoría, pero
choca con lo que la gente tiene en la cabeza.

**4. Solo entran los 3.000 primeros**, igual que en la NBA. En goles de
selección eso recorta la cola: de los 14.849 goleadores solo entran los de más
goles, así que se pierden los miles con uno o dos, que son los que dejan afinar
el último hueco al milímetro.

**5. Sin fotos.** No hay un CDN abierto de futbolistas equivalente al de la
NBA, así que `photoUrl` va vacío y `Face` enseña las iniciales.

**6. La fecha que se ve es la del dato, no la de la descarga.** El juego
muestra `2026-06-28`, que es hasta donde llega la fuente más rezagada de las
dos. Poner la fecha de hoy presumiría de una frescura que no tiene.

### Lo que se descartó, y por qué

De las 95 categorías que salían con datos suficientes entraron 6. Las demás
cayeron porque **castigan demasiado**: con objetivos pequeños, fallar por una
sola unidad hunde la ronda. En goles de Champions (objetivo mediano 76) fallar
por uno cuesta 66 puntos; en goles de Copa del Rey, 132. Fuera también las
copas nacionales y las fases de clasificación.

Mención aparte para `FIWC_par`, partidos en el Mundial: todo el mundo tiene
tres y el objetivo salía siempre 15. Habría entrado si las categorías se
eligen a ojo en vez de medirlas.

### Fuentes que se miraron y no sirven

- **APIs con historia completa** (Highlightly, API-Football, TheStatsAPI,
  Sportmonks): tienen el dato bueno, pero sus planes gratuitos dan ~100
  peticiones al día y responden jugador a jugador. Construir un catálogo de
  3.000 llevaría un mes. Con plan de pago sí sería viable.
- **Listas de Wikipedia** («máximos goleadores de LaLiga»): historia completa,
  pero son tablas de ~100 nombres. El juego necesita cola larga para poder
  afinar, y con 100 jugadores todos famosos el buscador deja de premiar saber.
- **openfootball**: trae resultados de partidos, pero no goleadores.

## Licencias

Las dos fuentes de fútbol y sus datos están bajo **CC0 1.0** (dominio
público). No exigen atribución, pero se cita el origen en el `source` del
archivo generado y aquí.

Matiz para el futuro: el repositorio de Transfermarkt se publica como CC0,
pero los datos originales los raspa de Transfermarkt, cuyos términos son
otra cosa. Para un prototipo no cambia nada; si esto llega a comercializarse,
habría que revisarlo.

## Añadir un catálogo

1. Un script en `scripts/` que deje un `*.generated.json` con
   `{ updatedAt, source, players: { statId: [{ name, value }] } }`.
2. `src/catalogs/<id>/sport.ts` con la meta y las categorías, cada una con su
   `note` diciendo desde cuándo cuenta.
3. `src/catalogs/<id>/load.ts` que lo lea y devuelva un `Catalog`.
4. Logo en `public/sports/`.
5. Una línea en `registry.ts` y otra en `catalogs/load.ts`.
6. **Su ficha en este archivo.**

Mide las categorías antes de elegirlas. El script de fútbol tiene un modo
informe que calcula lo que cuesta fallar por una unidad; copiarlo sale más
barato que descubrir en el playtest que una categoría es injugable.
