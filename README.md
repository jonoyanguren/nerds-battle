# Nerds Battle

Juego de estimación para gente que se sabe los números. Te dan una liga, una
estadística y un número objetivo. Rellenas 5 huecos con jugadores **sin ver sus
cifras** y al final descubres cuánto te has acercado.

> Ejemplo: NBA · Tapones en carrera · objetivo **10.000**.
> Eliges Olajuwon, Mutombo, Eaton, Duncan y Ewing → 16.093. Te has pasado.

## Estado

**Prototipo jugable.** Uno o dos jugadores, 6 estadísticas NBA, ~3000 jugadores
por estadística. Las cifras viven en el servidor (`/api/challenge`,
`/api/players`, `/api/reveal`). En **2 jugadores** se pasa el móvil: mismo reto,
el segundo ficha sin ver al primero y gana quien menos error tenga; ese duelo no
se guarda en el perfil. Login Google opcional: pestaña **Juego / Perfil**. Con cuenta
se guardan las rondas (récord, media, mejor por stat, historial). Sin cuenta,
el HUD usa `localStorage`. Sin ranking público. En Vercel:
https://nerds-battle-jonoyangurens-projects.vercel.app

```bash
cp .env.example .env   # DATABASE_URL, PRISMA_DIRECT_TCP_URL, AUTH_*
npm install
npm run dev
```

La home llama a Auth.js, así que hace falta Postgres y `AUTH_SECRET` aunque
se juegue sin entrar. El login de Google pide `AUTH_GOOGLE_ID` y
`AUTH_GOOGLE_SECRET`.

Datos: `npm run sync` tira de NBA Stats (top 3000 de carrera + ids para fotos)
y pisa `src/data.generated.json`. Las APIs leen ese JSON en el servidor. Cada
deporte es un catálogo (`src/catalogs/`) con nombre, logo y plantilla de foto.
Cron semanal en GitHub Actions (lunes 06:00 UTC) o a mano. Si el sync falla,
se quedan los datos de la semana anterior. Postgres guarda cuentas (Auth.js)
y `Round`. El ranking público espera.

Diseño del juego: [`docs/game-design.md`](docs/game-design.md).

## Stack

| Capa | Ahora | Destino |
|---|---|---|
| UI | Next.js + React 19 + Auth.js (Google) + Perfil + duelo local | duelo a distancia |
| Catálogo | `src/data.generated.json` (`npm run sync`) | más deportes (sigue en JSON) |
| Cuentas / rondas | Prisma Postgres (`User`, `Round`) | ranking público |
| Invitado | `localStorage` (récord / media / rondas) | igual |

El motor del juego (`makeChallenge`, `scoreRound`) son funciones puras sin React,
en `src/engine.ts`. Reciben un catálogo `{ sport, stats, players }`. La NBA es
el primer deporte; otro catálogo no cambia el motor.

## Cómo funciona una ronda

1. Se elige una estadística al azar (nunca la misma dos veces seguidas).
2. El objetivo se genera **sumando 5 jugadores del top 150** y redondeando
   a 3 cifras significativas. El buscador tiene ~3000 para afinar.
3. El jugador coloca 5 jugadores. No se puede repetir.
4. Al revelar, se suman las cifras una a una y se puntúa:
   `puntos = 1000 · (1 − error_relativo · 5)`, con suelo en 0.
   Un 20% de desvío ya da cero.

## Datos

Totales de carrera NBA en temporada regular, top 3000 de cada categoría, vía
NBA Stats (`alltimeleadersgrids`). Las fotos son del CDN de la NBA
(`260x190/{nbaId}.png`). `npm run sync` actualiza cifras, ids y la fecha
que se ve en la UI.

Categorías: puntos, rebotes, asistencias, tapones, robos, triples.

## Roadmap

El tablero de trabajo está en [`docs/tareas.md`](docs/tareas.md).
La mecánica y la curva, en [`docs/game-design.md`](docs/game-design.md).

- [x] M1 · Pasar a Next.js (mismo juego)
- [x] M2 · Prisma listo (catálogos siguen en JSON)
- [x] M3 · Login con Google (Auth.js) + Perfil / rondas
- [x] M4 · API ciega
- [x] M5 · Cron → JSON
- [x] M6 · 2 jugadores (mismo dispositivo)
- [x] M7 · Deploy
- [ ] M0 · Playtest con colegas y ajustar la curva
