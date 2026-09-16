# Nerds Battle

Juego de estimación para gente que se sabe los números. Te dan una liga, una
estadística y un número objetivo. Rellenas 5 huecos con jugadores **sin ver sus
cifras** y al final descubres cuánto te has acercado.

> Ejemplo: NBA · Tapones en carrera · objetivo **10.000**.
> Eliges Olajuwon, Mutombo, Eaton, Duncan y Ewing → 16.093. Te has pasado.

## Estado

**Prototipo v0.1 jugable.** Un jugador, 6 estadísticas NBA, ~2000 jugadores por
estadística. Sin backend, sin cuentas, sin ranking. En Vercel:
https://nerds-battle-jonoyangurens-projects.vercel.app

```bash
npm install
npm run dev
```

Datos: `npm run sync` tira de NBA Stats (top 2000 de carrera + ids para fotos)
y pisa `src/data.generated.json`. Cron semanal en GitHub Actions (lunes 06:00 UTC)
o a mano. Si el sync falla, se quedan los datos de la semana anterior.

## Stack previsto

| Capa | Ahora | Destino |
|---|---|---|
| UI | Next.js (App Router) + React 19 | Auth.js + Postgres |
| Datos | `src/data.generated.json` (`npm run sync`) | Postgres: `players(name, league, stat, value, nba_id)` |
| Estado | `useState` + localStorage | Server actions + sesión |
| Ranking | no hay | tabla `scores` + página de clasificación |

El motor del juego (`makeChallenge`, `scoreRound`) son funciones puras sin React,
en `src/engine.ts`. Al migrar solo cambia de dónde salen los datos.

## Cómo funciona una ronda

1. Se elige una estadística al azar (nunca la misma dos veces seguidas).
2. El objetivo se genera **sumando 5 jugadores del top 150** y redondeando
   a 3 cifras significativas. El buscador tiene ~2000 para afinar.
3. El jugador coloca 5 jugadores. No se puede repetir.
4. Al revelar, se suman las cifras una a una y se puntúa:
   `puntos = 1000 · (1 − error_relativo · 5)`, con suelo en 0.
   Un 20% de desvío ya da cero.

## Datos

Totales de carrera NBA en temporada regular, top 2000 de cada categoría, vía
NBA Stats (`alltimeleadersgrids`). Las fotos son del CDN de la NBA
(`260x190/{nbaId}.png`). `npm run sync` actualiza cifras, ids y la fecha
que se ve en la UI.

Categorías: puntos, rebotes, asistencias, tapones, robos, triples.

## Roadmap

El tablero de trabajo está en [`docs/tareas.md`](docs/tareas.md).

- [x] M1 · Pasar a Next.js (mismo juego)
- [ ] M2 · Postgres + semilla
- [ ] M3 · Login con Google (Auth.js)
- [ ] M4 · API ciega
- [ ] M5 · Cron → Postgres
- [ ] M6 · 2 jugadores
- [x] M7 · Deploy
- [ ] M0 · Playtest con colegas y ajustar la curva
