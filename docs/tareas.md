# Tareas — contexto y decisiones

**El estado (qué está abierto) vive en Trello:**
https://trello.com/b/w4I3qRLN/nerds-battle
Aquí no se tacha.
Este archivo es el porqué: cimientos, restricciones y decisiones que no
hay que volver a discutir. Si Trello y este texto chocan, gana Trello en
el “qué toca”; gana este archivo en el “por qué se hizo así”.

El motor (`makeChallenge`, `scoreRound`) no se reescribe. Next.js solo
cambia de dónde salen los datos y **cuándo** se ven las cifras.

## Mapa del tablero

Listas en Trello:

| Lista | Qué va ahí |
|---|---|
| Backlog | Todas las ideas, sin orden de ejecución |
| Todo | Lo siguiente que se va a hacer |
| Doing | En curso |
| Done | Cerrado de verdad |

## Cómo es el backend

Next.js (App Router) + Postgres + Prisma + Auth.js (Google).

Dos crones semanales en GitHub Actions: NBA los lunes 06:00 UTC y F1 los
lunes 07:00 UTC. El fútbol no tiene, porque su fuente está parada.

El de la NBA **no ha funcionado nunca**, así que ese JSON solo se
actualiza a mano.

```
buscador  →  {name, rank, photo}    nunca value
reto      →  {sport, stat, target, token, updatedAt}
deportes  →  {id, name, scope, logo}
revelar   →  token + 5 nombres → cifras + scoreRound
          →  si hay sesión, guarda Round
duelo     →  2 plantillas → cifras de las dos + ganador. Nunca guarda.
yo        →  GET /api/me → récord, media, historial
login     →  Google → users
perfil    →  historial + récord (sesión)
cron      →  pisa data.generated.json
```

## Ya construido

Next.js, Prisma, Google + `/perfil`, API ciega, script de sync NBA (el
cron automático no), duelo en el mismo dispositivo, Vercel, fútbol, F1,
landing + rutas `/nba` `/futbol` `/f1`.

Login Google **entra en producción**. Las rondas **solo se guardan si hay
sesión**.

## Porqués que no hay que reabrir

### El reto lo firma el servidor (sin tabla de challenges)

`/api/reveal` y `/api/duel` no aceptan el `target` del cliente. El reto
libre lleva un token HMAC (`AUTH_SECRET`): sport + stat + objetivo.
Sin tabla: Vercel es serverless y no guarda el challenge entre peticiones.

`makeChallenge` recibe un `rng`. El diario, cuando exista, pasará
`rngFromSeed(fecha)` para que todos vean el mismo reto. El libre sigue
usando `Math.random()`.

Ranking y 1 contra 1 online ya se pueden arbitrar: el objetivo no lo
decide quien puntúa.

### Duelo: turno alterno, no por equilibrio

Se creía que fichar los cinco de golpe dejaba al rival «sin los buenos».
Medido contra los datos, eso le cuesta **entre 0 y 29 puntos de 1000**.
Con miles de jugadores por categoría, y siendo un juego de acercarse a un
objetivo, acaparar no sirve. El turno se queda porque los dos miran la
misma pantalla y van reaccionando.

Un duelo no guarda `Round`: el perfil es de una persona. Dos sesiones
(dispositivos distintos) pide que el servidor emita y valide el reto.

### Fútbol: 2012 y sin cron

Clubes solo cubren de 2012 en adelante y esa fuente ya no se actualiza.
«Goles en LaLiga» tenía buena curva y se dejó fuera: Messi saldría con
305 y no con 474, y esa sí la gente se la sabe. Se etiqueta el periodo
en vez de callarlo. Detalle en `docs/datos.md`.

### F1: las cifras famosas son las injugables

Al revés que en la NBA. Fallar por una victoria cuesta 128 puntos de
1000; por un campeonato, 455. Fuera: victorias, poles, podios,
campeonatos. Dentro: vueltas, puntos, GP, carreras terminadas, abandonos.

Playtest a vigilar: esas categorías nadie las tiene interiorizadas, y
**no hay fotos de pilotos** (iniciales). F1DB sí publica release después
de cada carrera: este catálogo **puede** tener cron. Fotos: primero
licencia, después cobertura (`docs/datos.md`).

### Landing hecha, no «validada por otro»

La portada, las rutas por deporte y `/perfil` están. El selector de
catálogo se queda dentro de la partida y mueve la URL con `replace`. Lo
que no está es que lo haya mirado alguien que no lo escribió.

### Rey de la pista: no escribir hasta tener la regla

Es el duelo local con otra condición de fin. La pregunta es de
diseño: ¿se pierde la corona por bajar de X puntos, por perder un duelo,
por fallar dos seguidas? Va en `engine.ts`, no en un componente.

### Curva: el criterio, fijado antes de ver los datos

`puntos = 1000 × (1 − error × 5)`. Ese `×5` nunca se ha validado: un
desvío del 20% ya da cero.

| Si en las rondas reales… | Veredicto | Qué hacer |
|---|---|---|
| Más del 40% son cero | **Dura** | Bajar a `×3`: el cero se va al 33% de error |
| Más del 40% pasan de 800 | **Blanda** | Subir a `×7` |
| Hay reparto, 10–20% de ceros | Está bien | No tocar |

`npm run curva` lee las rondas guardadas y avisa si hay menos de 50.
Simulación: cinco nombres famosos sin método se desvían un 23–40%, o sea
**cero en 6 ó 7 de cada 10**. Un ranking global con la curva dura
es una tabla de ceros.

### Catálogos: no es lo que le falta al juego

Añadir un deporte no pide refactor: `src/catalogs/<id>/`, logo,
`registry.ts`, `catalogs/load.ts`, ficha en `docs/datos.md`. Lo caro es
una fuente de **totales de carrera por persona**. El mundo abierto está
lleno de partidos y calendarios; las tres excepciones son los tres
catálogos que hay.

Fuentes ya miradas, para no repetir el camino:

- **Ciclismo** — `jenslemb/cyclingdata` (MIT, 11.125 etapas) no tiene ni
  un nombre de ciclista. ProCyclingStats: raspar uno mismo.
- **MotoGP** — el dataset 1949–2025 sin licencia; el CC0 solo cubre
  2025–2026 sin totales. Pedida licencia al primero.
- **ACB** — no hay volcado; solo scrapers en directo.
- **Tenis** — Sackmann borrado; espejos NonCommercial.
- **Béisbol** — Lahman por Box.com, no un `curl`.
- **NFL, NHL, críquet** — datos limpios, público que no es el nuestro.

## Errores que siguen vivos

### El cron de la NBA no ha funcionado nunca

Tres ejecuciones (14, 21 y 28 de septiembre), tres fallos en `npm run
sync`. El script a mano sí; lo automático no. No son las cabeceras ni
falta de `npm install`. Casi seguro: `stats.nba.com` bloquea IPs de
centro de datos (GitHub Actions, Vercel, cron-as-a-service).

Salidas reales: IP doméstica, otra fuente, o sync manual y quitar el
cron. Cambiar el cron de sitio no arregla un bloqueo por IP.

## Arreglados (para no reabrirlos)

- **La puntuación se podía falsificar.** `reveal` y `duel` puntuaban el
  `target` del body. Ahora el servidor abre el token que firmó al emitir
  el reto.
- Perfil es `/perfil`, no una pestaña dentro del deporte.
- Con la ronda cerrada se puede cambiar de deporte (`done` no mira
  `locking`).
- El cero del marcador usa el color del error, no verde fijo.
- Favicon: `src/app/icon.svg`.
- Login producción: el callback de Google es
  `…/api/auth/callback/google`, no el origen suelto. Guardar en la
  consola de Google. Vistas previas pueden fallar sin `AUTH_URL`.
- `npm run curva` existe y avisa si no hay base.

## Decisiones al llegar

| Cuándo | Qué |
|---|---|
| API ciega | No hay tabla `challenges` (serverless). El reto se firma con HMAC al emitir y se comprueba al revelar. |
| catálogos | La NBA es un `Sport`. El motor recibe un `Catalog`. |
| Prisma | Catálogos = JSON. Postgres = users / partidas / ranking. |
| Google | `users` la crea Auth.js. Callback con path `/api/auth/callback/google`. |
| perfil | Tabla `Round`. HUD y Perfil leen la BD si hay sesión; si no, localStorage. |
| fútbol | Clubes desde 2012 y sin cron. Se etiqueta. |
| duelo | Mismo dispositivo: se pasa el móvil. |
| tablero | Trello es el estado. Este archivo es el porqué. |
