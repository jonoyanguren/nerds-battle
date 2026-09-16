# Tareas y milestones

Una cosa cada vez. Tachar al cerrar.

El enlace a colegas **puede esperar** (semanas). Se manda cuando el
juego + cuenta Google estén en Next.js, no un Vite estático.

El motor (`makeChallenge`, `scoreRound`) no se reescribe. Next.js solo
cambia de dónde salen los datos y **cuándo** se ven las cifras.

## Cómo es el backend

Next.js (App Router) + Postgres + Prisma + Auth.js (Google).
Cron semanal (Vercel cron o el script de ahora).

```
buscador  →  {name, rank, photo}    nunca value
reto      →  {id, stat, target, updatedAt}
revelar   →  {values[], total, points, verdict}
login     →  Google → users
cron      →  pisa players + updated_at + nba_id
```

## Orden

### M1 · Next.js y el juego tal cual

Portar, no rediseñar. Sigue leyendo `data.generated.json`.

- [x] App Next.js + TypeScript (Vite fuera)
- [x] Motor, datos y UI en `src/` (`App.tsx` es client)
- [x] `npm run dev` y una ronda completa igual que ahora

### M2 · Postgres + semilla

- [ ] Prisma + tablas:
      `users` (id, email, name, image, googleId)
      `players` (id, name, league, stat, value, rank, nbaId)
      `meta` (updated_at)
- [ ] Seed desde `src/data.generated.json`
- [ ] La UI lee `updated_at`

### M3 · Login con Google

Auth.js. Lo mínimo: entrar / salir. Sin página de perfil.

- [ ] Botón “Entrar con Google”
- [ ] Sesión en el servidor
- [ ] Sin cuenta se puede mirar; para guardar partida, login (cuando exista M6)

### M4 · API ciega

El bundle deja de llevar cifras.

- [x] `GET /api/players?stat=&q=` → nombre + rank + foto
- [x] `POST /api/challenge` → stat + target
- [x] `POST /api/reveal` → 5 nombres → cifras + `scoreRound`
- [x] Quitar `PLAYERS` del cliente

### M5 · Cron a Postgres

El `npm run sync` de ahora ya tira de NBA Stats.

- [x] Fuente + JSON + fotos (prototipo)
- [ ] El mismo script hace upsert en `players` + `meta.updated_at`
- [ ] Si falla, se sirven los de la semana anterior

### M6 · 2 jugadores

Mismo reto, dos rondas, el segundo no ve al primero.
Puede ser local (mismo dispositivo) o dos sesiones. Se decide al llegar.

### M7 · URL

- [x] Deploy Vercel
- [ ] Comprobar en el móvil: una ronda

## Al final — M0 · Colegas

- [ ] Mandar el enlace a 3–5 colegas
- [ ] Anotar si la curva (`error × 5`) es dura o blanda
- [ ] Ajustar `scoreRound` si hace falta
- [ ] Decidir si el `#N DEL RANKING` se queda

## Aún no

Más ligas, F1, tenis, ranking global, reto diario, mostrar cifras
antes de tiempo, ordenar el buscador por stat.

## Decisiones al llegar

| Cuándo | Qué |
|---|---|
| M4 | El cliente manda `target` al revelar; no hay tabla `challenges` (serverless). |
| M6 | ¿Mismo dispositivo o dos móviles? |
