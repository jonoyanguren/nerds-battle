# Nerds Battle

Juego de estimación para gente que se sabe los números. Te dan una liga, una
estadística y un número objetivo. Rellenas 5 huecos con jugadores **sin ver sus
cifras** y al final descubres cuánto te has acercado.

> Ejemplo: NBA · Tapones en carrera · objetivo **10.000**.
> Eliges Olajuwon, Mutombo, Eaton, Duncan y Ewing → 16.093. Te has pasado.

## Estado

**Prototipo v0.1 jugable.** Un jugador, 6 estadísticas NBA, 100 jugadores por
estadística, datos hardcodeados. Sin backend, sin cuentas, sin ranking.

Abre `prototype/nerds-battle.html` en el navegador. No necesita build.

## Stack previsto

| Capa | Ahora | Destino |
|---|---|---|
| UI | React 18 por CDN, un archivo | Next.js (App Router) + TypeScript |
| Datos | constante `RAW` en el HTML | Postgres: `players(name, league, stat, value)` |
| Estado | `useState` + localStorage | Server actions + sesión |
| Ranking | no hay | tabla `scores` + página de clasificación |

El motor del juego (`makeChallenge`, `scoreRound`) son funciones puras sin React,
aisladas a propósito. Al migrar solo cambia de dónde salen los datos.

## Cómo funciona una ronda

1. Se elige una estadística al azar (nunca la misma dos veces seguidas).
2. El objetivo se genera **sumando 5 jugadores reales del ranking** y redondeando
   a 3 cifras significativas. Así todo reto tiene solución cercana.
3. El jugador coloca 5 jugadores. No se puede repetir.
4. Al revelar, se suman las cifras una a una y se puntúa:
   `puntos = 1000 · (1 − error_relativo · 5)`, con suelo en 0.
   Un 20% de desvío ya da cero.

## Datos

Totales de carrera NBA en temporada regular, top 100 de cada categoría, vía
[Basketball-Reference](https://www.basketball-reference.com/leaders/).
Congelados a septiembre de 2026 — los jugadores en activo se quedan desfasados.

Categorías: puntos, rebotes, asistencias, tapones, robos, triples.

## Roadmap

- [ ] Ajustar la curva de puntuación jugando de verdad (es lo que más chirría)
- [ ] Modo 2 jugadores: mismo reto, dos rondas, comparación
- [ ] Reto diario tipo Wordle + resultado compartible
- [ ] Migrar datos a Postgres y añadir más ligas (fútbol, F1, tenis)
- [ ] Ranking global
