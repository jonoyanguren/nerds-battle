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
- [x] Fichan uno a uno sobre el mismo pool (un nombre no se puede repetir)
- [x] `POST /api/duel`: las dos plantillas se revelan de una vez
- [x] `duelWinner` en el motor: gana quien menos error tenga
- [x] Un duelo no guarda `Round` ni toca el HUD: el perfil es de una persona

Si uno fichara los cinco de golpe se quedaría a los buenos. Por eso el
turno cambia tras cada ficha. Las cifras salen en una sola llamada.

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

### M9 · Tercer catálogo: Fórmula 1

Sale del cajón de «Aún no» por lo mismo que el fútbol: el motor ya estaba
listo y lo caro eran los datos.

- [x] `npm run sync:f1` con modo informe, que mide cada categoría antes de
      elegirla
- [x] `src/f1.generated.json` desde [F1DB](https://github.com/f1db/f1db)
- [x] `src/catalogs/f1/` + logo + registro
- [x] Ficha completa en `docs/datos.md`

Lo que hay que saber, y es lo interesante: **en la F1 las cifras famosas
son justo las injugables.** Al revés que en la NBA, donde lo que la gente
se sabe son decenas de miles de puntos, aquí los números conocidos son
pequeños. Fallar por una victoria cuesta 128 puntos de 1000, y por un
campeonato 455. Así que victorias, poles, podios y campeonatos están fuera,
y dentro quedan las de volumen: vueltas, puntos, GP disputados, carreras
terminadas y abandonos. Las cifras están en `docs/datos.md`.

Dos cosas a vigilar en el playtest:

- **Puede resultar menos divertido de lo que parece.** Las categorías que
  aguantan son las que nadie tiene interiorizadas. «Vueltas completadas» se
  puede deducir (≈ GP × 60), pero no se sabe. Si el catálogo se siente
  como adivinar al azar, es esto.
- **No hay fotos de pilotos**, así que los cinco huecos salen con
  iniciales. En un juego que va de reconocer caras, eso es una pérdida.

A favor: F1DB publica release después de cada carrera, así que **este
catálogo sí puede tener cron**, al revés que el fútbol.

## Al final — M0 · Colegas

- [ ] Mandar el enlace a 3–5 colegas
- [ ] Anotar si la curva (`error × 5`) es dura o blanda
- [ ] Ajustar `scoreRound` si hace falta
- [ ] Decidir si el `#N DEL RANKING` se queda

## Aún no

- **Banco de imágenes para los pilotos de F1.** Es la pega más gorda del
  catálogo nuevo: el juego va de reconocer caras y la F1 sale con
  iniciales. Las pistas y el criterio están en `docs/datos.md`, en la ficha
  de Fórmula 1. Primero la licencia, después la cobertura.
- Más catálogos (Pokémon…), ranking global, reto diario, mostrar cifras
  antes de tiempo, ordenar el buscador por stat.

Añadir un deporte no pide refactor: `src/catalogs/<id>/`, logo en
`public/sports/`, registrar en `registry.ts` y `catalogs/load.ts`.

### Fuentes ya miradas: no volver a empezar de cero

Buscando catálogos nuevos se revisaron estas. Está aquí para que nadie
repita el camino.

- **Ciclismo** — [`jenslemb/cyclingdata`](https://github.com/jenslemb/cyclingdata)
  parecía perfecto: 11.125 etapas de 1903 a 2024, once carreras con Vuelta,
  Tour, Giro, Itzulia y Volta a Catalunya, licencia MIT. Se descargó, se
  escribió un lector del formato `.rda` y se abrió. **No contiene ni un
  solo nombre de ciclista.** Sus 18 columnas describen la *etapa*
  —distancia, desnivel, terreno, cómo se ganó— y lo más parecido a un
  corredor es `avg_speed_winner`, que es una velocidad, no una persona.
  Comprobados también `josselingirault/procyclingstats.com-webscraper`
  (solo ficha del corredor; «fetch result data» sigue sin tachar en su
  propio TODO) y `BD4vid777/Cycling_API`. **No hay ninguna fuente publicada
  con totales de carrera por ciclista**: todos los caminos acaban en raspar
  ProCyclingStats uno mismo.
- **MotoGP** — `k06aditya/MotoGP-Historical-Dataset` tiene 1949–2025 y **le
  falta el archivo de licencia**, o sea todos los derechos reservados por
  defecto. `vishwapramuditha/moto-db` sí es CC0, pero solo cubre 2025–2026
  y sus pilotos son nombre, país y dorsal, sin un solo total. Los CC0 de
  Kaggle piden autenticación y no valen para un cron. Pedida licencia al
  primero; si la añade, se desbloquea entero.
- **ACB** — no existe dataset publicado, solo herramientas que raspan
  acb.com en directo. Peor caso que el fútbol: allí al menos alguien
  publicó el volcado con licencia y asumió él ese paso.
- **Tenis** — los cuatro repositorios de Jeff Sackmann están borrados.
  Quedan espejos de terceros con licencia **NonCommercial**.
- **Béisbol** — Lahman sigue vivo pero se cayó de GitHub; ahora lo
  distribuye SABR por Box.com, y un cron contra Box no es un `curl`.
- **NFL, NHL, críquet** — datos buenos y licencias limpias, pero el público
  no es el nuestro. Si los nombres no te suenan, no hay juego.

**El patrón, que ya va tres veces.** El mundo de los datos deportivos
abiertos está lleno de partidos, etapas y calendarios, y casi vacío de
**totales de carrera por persona**, que es lo único que este juego come.
Las tres excepciones son justo los tres catálogos que hay: la NBA porque la
liga los publica, el fútbol porque alguien hizo el volcado, y la F1 porque
F1DB lleva años agregándolo. No es mala suerte: sumar una carrera entera es
trabajo, y casi nadie lo regala.

**Y la consecuencia para el tablero:** un catálogo nuevo no es barato, así
que meter el cuarto no es lo que le falta al juego. Lo que falta es saber
si engancha, y eso lo contesta M0.

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
