# Tareas y milestones

Una cosa cada vez. Tachar al cerrar.

El enlace a colegas **puede esperar** (semanas). Next.js + Google ya
están; M0 es mandar la URL y anotar la curva.

El motor (`makeChallenge`, `scoreRound`) no se reescribe. Next.js solo
cambia de dónde salen los datos y **cuándo** se ven las cifras.

## Cómo es el backend

Next.js (App Router) + Postgres + Prisma + Auth.js (Google).
Cron semanal: GitHub Actions (lunes 06:00 UTC) o `npm run sync`.

```
buscador  →  {name, rank, photo}    nunca value
reto      →  {sport, stat, target, updatedAt}
deportes  →  {id, name, scope, logo}
revelar   →  {values[], total, points, verdict}
          →  si hay sesión, guarda Round
yo        →  GET /api/me → récord, media, historial
login     →  Google → users
perfil    →  historial + récord (sesión)
cron      →  pisa data.generated.json
```

## Orden

### M1 · Next.js y el juego tal cual

Portar, no rediseñar. Sigue leyendo `data.generated.json`.

- [x] App Next.js + TypeScript (Vite fuera)
- [x] Motor, datos y UI en `src/` (`App.tsx` es client)
- [x] `npm run dev` y una ronda completa igual que ahora

### M2 · Prisma listo (no el catálogo)

Postgres es para cuentas, partidas y ranking. Las cifras de la NBA siguen
en JSON: un archivo + cron semanal.

- [x] Prisma + Prisma Postgres (env, migraciones, cliente)
- [x] Catálogos en `src/data.generated.json` (no en la DB)
- [x] La UI lee `updated_at` del JSON

### M3 · Login con Google

Auth.js. Entrar / salir + pestaña Perfil. Sin ruta `/perfil`.

- [x] Botón “Entrar con Google”
- [x] Sesión en el servidor
- [x] Sin cuenta se puede jugar; el HUD va a localStorage
- [x] Con cuenta, cada revelado guarda una `Round`
- [x] Pestaña Perfil: récord, media, mejor por stat, historial
- [x] `GET /api/me` (401 si no hay sesión)

### M4 · API ciega

El bundle deja de llevar cifras.

- [x] `GET /api/players?stat=&q=` → nombre + rank + foto
- [x] `POST /api/challenge` → stat + target
- [x] `POST /api/reveal` → 5 nombres → cifras + `scoreRound`
- [x] Quitar `PLAYERS` del cliente

### M5 · Cron del catálogo

El `npm run sync` tira de NBA Stats (top 3000) y pisa el JSON.
GitHub Actions: lunes 06:00 UTC.

- [x] Fuente + JSON + fotos
- [x] Si falla, se quedan los de la semana anterior (el JSON no se toca)

### M6 · 2 jugadores

Mismo reto, dos rondas, el segundo no ve al primero.
Puede ser local (mismo dispositivo) o dos sesiones. Se decide al llegar.

### M7 · URL

- [x] Deploy Vercel
- [ ] Comprobar en el móvil: una ronda

### M8 · Segundo catálogo: fútbol

Sale del cajón de «Aún no» porque el motor ya estaba listo y lo caro eran
los datos, no el código. Seis categorías: goles y asistencias de liga,
partidos en Champions y en LaLiga, y goles con la selección.

- [x] `npm run sync:football` con modo informe: mide cada categoría antes
      de elegirla, en vez de escogerlas a ojo
- [x] `src/football.generated.json` desde dos fuentes CC0
- [x] `src/catalogs/futbol/` + logo + registro
- [x] Ficha completa en `docs/datos.md`: qué contiene, de dónde y qué no cubre

Lo que hay que saber: los clubes solo cubren de 2012 en adelante (Messi
sale con 305 goles en LaLiga, no con 474) y esa fuente ya no se actualiza,
así que el fútbol no tiene cron. Todo explicado en `docs/datos.md`.

## Al final — M0 · Colegas

- [ ] Mandar el enlace a 3–5 colegas
- [ ] Anotar si la curva (`error × 5`) es dura o blanda
- [ ] Ajustar `scoreRound` si hace falta
- [ ] Decidir si el `#N DEL RANKING` se queda

## Aún no

Más catálogos (Pokémon…), ranking global, reto diario, mostrar cifras
antes de tiempo, ordenar el buscador por stat.

Añadir un deporte no pide refactor: `src/catalogs/<id>/`, logo en
`public/sports/`, registrar en `registry.ts` y `catalogs/load.ts`.

## Decisiones al llegar

| Cuándo | Qué |
|---|---|
| M4 | El cliente manda `target` al revelar; no hay tabla `challenges` (serverless). |
| catálogos | La NBA es un `Sport` (nombre, logo, fotos). El motor recibe un `Catalog`. |
| M2 | Catálogos = JSON. Postgres = users / partidas / ranking (M3 en adelante). |
| M3 | Tabla `users` la crea Auth.js. |
| perfil | Tabla `Round`. HUD y Perfil leen la BD si hay sesión; si no, localStorage. |
| M6 | ¿Mismo dispositivo o dos móviles? |
| M8 | Fútbol: clubes desde 2012 y sin cron (la fuente está parada). Se etiqueta en vez de ocultarse. |
