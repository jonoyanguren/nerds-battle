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
duelo     →  2 plantillas → cifras de las dos + ganador. Nunca guarda.
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

Mismo reto, dos rondas, el segundo no ve al primero. **Mismo dispositivo**:
se pasa el móvil. Dos sesiones se aparca — comparar a distancia pide retos
emitidos y validados por el servidor (`game-design.md`), y eso es otra tarea.

- [x] Interruptor 1 jugador / 2 jugadores
- [x] El jugador 1 ficha, se cierra su turno y la pantalla se tapa
- [x] El jugador 2 ficha el mismo reto sin ver nada del primero
- [x] `POST /api/duel`: las dos plantillas se revelan de una vez
- [x] `duelWinner` en el motor: gana quien menos error tenga
- [x] Un duelo no guarda `Round` ni toca el HUD: el perfil es de una persona

La plantilla del primero se borra de la pantalla **antes** de levantar la
cortina, así que detrás no queda nada que mirar. Y se revela de una sola
llamada: si el primero viera sus cifras, el segundo las vería también.

### M7 · URL

- [x] Deploy Vercel
- [ ] Comprobar en el móvil: una ronda

### M8 · Segundo catálogo: fútbol

Sale del cajón de «Aún no» porque el motor ya estaba listo y lo caro eran
los datos, no el código. Cinco categorías: goles y asistencias en la
Premier, partidos en Champions y en LaLiga, y goles con la selección.

- [x] `npm run sync:football` con modo informe: mide cada categoría antes
      de elegirla, en vez de escogerlas a ojo
- [x] `src/football.generated.json` desde dos fuentes CC0
- [x] `src/catalogs/futbol/` + logo + registro
- [x] Ficha completa en `docs/datos.md`: qué contiene, de dónde y qué no cubre

Lo que hay que saber: los clubes solo cubren de 2012 en adelante y esa
fuente ya no se actualiza, así que el fútbol no tiene cron. Por eso se
dejó fuera «goles en LaLiga» pese a tener buena curva: Messi saldría con
305 y no con 474, y esa sí la gente se la sabe. Todo en `docs/datos.md`.

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
| M6 | Mismo dispositivo: se pasa el móvil. Dos sesiones pediría retos emitidos por el servidor. |
