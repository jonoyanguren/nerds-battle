# Contexto para Claude — Nerds Battle

Lee esto antes de tocar nada. Si algo de aquí ya no es cierto, corrígelo en el
mismo cambio.

## Qué es

Juego de estimación con estadísticas deportivas. El jugador ve una liga, una
estadística y un número objetivo, rellena 5 huecos con jugadores sin ver sus
cifras, y al final se le revela cuánto se ha acercado.

La gracia está en la tensión entre saberse los nombres y saberse los números.
Cualquier cambio que facilite adivinar (mostrar cifras antes de tiempo, sugerir
por valor, ordenar el buscador por stat) mata el juego. No lo hagas.

## Dónde está cada cosa

- `src/types.ts` — contrato de datos y tipos del motor.
- `src/catalogs/registry.ts` — lista de deportes (id, nombre, logo, plantilla de foto). Ciego, cliente OK.
- `src/catalogs/load.ts` — carga un catálogo (stats + PLAYERS). Solo servidor.
- `src/catalogs/nba/` — primer catálogo. Meta en `sport.ts`; cifras en `src/data.generated.json`.
- `src/data.generated.json` — top ~3000 NBA + `nbaId`. Lo pisa `npm run sync`
  (`scripts/sync-nba.mjs`). Si el job falla, no se toca el JSON anterior.
- `src/engine.ts` — motor: `makeChallenge(catalog, prevStatId)` y `scoreRound`.
  Funciones puras, sin React. El catálogo es `{ sport, stats, players[statId] }`.
  No importar desde el cliente.
- `src/format.ts`, `src/photos.ts`, `src/storage.ts` — helpers ciegos (cliente).
- `src/App.tsx` — UI (client component). Habla con `/api/sports`, `/api/players`,
  `/api/challenge` y `/api/reveal`. No ve `value` hasta revelar.
- `src/app/` — Next.js App Router (`layout.tsx`, `page.tsx`, `api/`).
- `public/sports/` — logos de catálogo.
- `docs/game-design.md` — mecánica, puntuación y decisiones abiertas.
- `docs/tareas.md` — milestones y tareas (el tablero para ir haciendo).
- `README.md` — visión general y roadmap.

## Reglas de trabajo

- **El motor antes que la UI.** `makeChallenge` y `scoreRound` son funciones
  puras sin React. Cualquier regla nueva del juego va ahí, no en un componente.
- **Los datos son una dependencia, no parte del juego.** El motor consume un
  `Catalog`. La NBA es el primer catálogo, no el juego. Un deporte nuevo:
  `sport.ts` (meta + stats) + loader de cifras + logo en `public/sports/` +
  una línea en `registry.ts` y `catalogs/load.ts`.
- **Nada de dependencias nuevas sin motivo.** Ahora: Next.js + React + TS.
  Siguiente: Prisma + Auth.js. Si algo pide otra librería, plantéalo.
- **Un cambio, una pregunta respondida.** Este proyecto existe para saber si el
  juego engancha. Las features que no ayuden a contestar eso esperan.

## Estado actual y lo siguiente

Next.js desplegado en Vercel (`https://nerds-battle-jonoyangurens-projects.vercel.app`).
API ciega + catálogos: el cliente no lleva cifras. NBA es el primer deporte.
Siguiente catálogo = datos, no un refactor. Orden en `docs/tareas.md`.

## Idioma

Interfaz y documentación en español. Nombres de jugadores tal cual (con
acentos: Jokić, Dončić); el buscador ya normaliza para que "jokic" encuentre a
Jokić. Código y nombres de variables en inglés.

## Deploy Configuration (configured by /setup-deploy)
- Platform: Vercel
- Production URL: https://nerds-battle-jonoyangurens-projects.vercel.app
- Deploy workflow: auto-deploy on push to master
- Deploy status command: HTTP health check
- Merge method: merge
- Project type: web app
- Post-deploy health check: https://nerds-battle-jonoyangurens-projects.vercel.app

### Custom deploy hooks
- Pre-merge: npm run build
- Deploy trigger: automatic on push to master (GitHub → Vercel)
- Deploy status: poll production URL
- Health check: https://nerds-battle-jonoyangurens-projects.vercel.app
