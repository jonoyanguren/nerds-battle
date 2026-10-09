# Tareas y milestones

Una cosa cada vez. Tachar al cerrar.

El login de Google **ya entra en producción**. Lo que falta es que quien
juegue entre con cuenta: las rondas **solo se guardan si hay sesión**. Han
jugado dos personas; si lo hicieron sin Google, no hay rastro que analizar.

**Lo siguiente es M0:** la curva de puntuación sigue sin validar. Con tres
catálogos dentro y un ranking global en la lista, cada cosa nueva hereda
ese problema en vez de resolverlo.

El motor (`makeChallenge`, `scoreRound`) no se reescribe. Next.js solo
cambia de dónde salen los datos y **cuándo** se ven las cifras.

## Cómo es el backend

Next.js (App Router) + Postgres + Prisma + Auth.js (Google).

Dos crones semanales en GitHub Actions: NBA los lunes 06:00 UTC y F1 los
lunes 07:00 UTC. El fútbol no tiene, porque su fuente está parada.

⚠ El de la NBA **no ha funcionado nunca**, así que ese JSON solo se
actualiza a mano. Ver «Errores vistos», nº 2.

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
- [x] Login en producción: el callback de Google iba sin path y no estaba
      guardado. Ver «Errores vistos», arreglados.

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
- [ ] 🔴 **Que el cron llegue a funcionar una vez.** Nunca lo ha hecho:
      tres ejecuciones, tres fallos. Lo probado es el script a mano; lo
      automático no. En «Errores vistos», nº 2.

### M6 · 2 jugadores

Mismo reto, dos rondas, el segundo no ve al primero. **Mismo dispositivo**:
se pasa el móvil. Dos sesiones se aparca — comparar a distancia pide retos
emitidos y validados por el servidor (`game-design.md`), y eso es otra tarea.

- [x] Interruptor 1 jugador / 2 jugadores
- [x] Fichan uno a uno sobre el mismo pool (un nombre no se puede repetir)
- [x] `POST /api/duel`: las dos plantillas se revelan de una vez
- [x] `duelWinner` en el motor: gana quien menos error tenga
- [x] Un duelo no guarda `Round` ni toca el HUD: el perfil es de una persona

El turno cambia tras cada ficha y las cifras salen en una sola llamada.

Ojo con el porqué, que la razón que se apuntó aquí **no se sostiene**: se
creía que uno podía «quedarse a los buenos» fichando los cinco de golpe,
pero medido contra los datos reales eso le cuesta al rival **entre 0 y 29
puntos de 1000**. Con miles de jugadores por categoría, y siendo un juego
de acercarse a un objetivo y no de maximizar, acaparar no sirve de nada.

El turno alterno se queda por cómo se juega —los dos miran la misma
pantalla y van reaccionando—, no por equilibrio.

### M7 · URL

- [x] Deploy Vercel
- [x] Comprobar en el móvil: una ronda (1 y 2 jugadores, en fútbol)

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

## Lo siguiente: de pantalla única a sitio

Hasta ahora esto es **una sola pantalla**. El selector agrupado de M9 ordena
los catálogos, pero sigue siendo una fila de botones dentro de la misma
página: no son pantallas distintas, y eso es lo que se pidió.

Lo que viene cambia eso y añade formas de jugar. **Antes de leer el orden,
lo importante:**

### ⚠ Las tres cosas nuevas comparten un mismo cimiento, y no está puesto

Hoy `POST /api/challenge` genera el objetivo y **se lo da al cliente**, y
`POST /api/reveal` puntúa contra el `target` **que el cliente le manda de
vuelta** (`scoreRound(total, target)`, con `target` sacado del body).

Está comprobado en vivo: con las mismas cinco fichas, cambiando solo el
campo `target` de la petición se pasa de 0 puntos a 1000 y «Nerd supremo».

Mientras siga así:

- un **ranking global** no vale nada, porque cualquiera publica 1000;
- un **1 contra 1 online** no se puede arbitrar, porque cada lado decide su
  propia nota.

El modo de 2 jugadores de M6 se salva porque es local: los dos comparten
pantalla y hacen de testigos. En cuanto el reto viaja por la red, no.

Así que **M11 va antes que M12 y M14**, no por gusto sino porque sin él las
dos nacen rotas.

### M10 · Landing y navegación

Independiente de todo lo demás: no necesita servidor ni tocar el motor. Es
lo más barato y lo que más cambia la sensación de «esto es un sitio».

Escrito y auditado, **pendiente de que lo valide alguien que no sea quien
lo escribió**. Nada se tacha hasta entonces.

- [ ] Página de entrada que diga en una frase de qué va esto
- [ ] Botones para entrar a jugar, **uno por deporte**, agrupados por familia
- [ ] Rutas de verdad (`/nba`, `/futbol`, `/f1`); un id que no existe da 404
- [ ] El selector de M9 **se queda** dentro de la partida, para cambiar de
      deporte sin volver atrás, y mueve la URL con `replace`: si recargas,
      sigues donde estabas
- [ ] **Perfil sigue sin ruta propia.** Es una pestaña dentro de la
      partida, así que desde la portada hay que entrar a un deporte para
      verlo. Con el juego ya repartido en pantallas, eso chirría

### Lo que se comprobó, y lo que salió

Auditoría automatizada sobre el servidor, no «compila»: 10 de 12 pasan.

Pasan: el botón de la portada lleva a `/f1`; se fichan cinco y la ronda
revela y puntúa; cambiar de deporte mueve la URL; recargar mantiene el
deporte; Perfil abre; el modo 2 jugadores entra con sus dos tableros; el
logo vuelve a la portada; una ruta inventada da 404 de verdad; ningún
recurso de la página falla.

Fallaban dos que no causaba la landing (deporte bloqueado al cerrar y
favicon). Los dos están en «Arreglados».

### M11 · El reto lo emite y lo valida el servidor

El cimiento. Sin esto no hay ranking ni online.

- [ ] `/api/reveal` deja de aceptar `target` del cliente
- [ ] El reto diario se deriva de **la fecha**, con `makeChallenge`
      sembrado: el servidor puede recalcular el mismo reto sin guardarlo
      y comprobar contra su propio objetivo
- [ ] Para los retos libres, el servidor firma el reto al emitirlo y
      comprueba la firma al revelar
- [ ] La semilla va en `engine.ts`, que es donde viven las reglas

Ojo: `makeChallenge` usa `Math.random()`. Para el diario hace falta un
generador con semilla, si no cada jugador vería un reto distinto.

### M12 · Daily con puntuación global

Un reto al día, el mismo para todo el mundo. **Depende de M11.**

- [ ] Un reto por día y deporte, igual para todos
- [ ] Una sola tirada: si ya jugaste hoy, se ve tu resultado
- [ ] Tabla con las puntuaciones del día
- [ ] Decidir si el ranking es global o solo entre conocidos

**Y depende también de M0.** Un ranking global con la curva mal calibrada
es una tabla de ceros: si se confirma que `×5` es duro, lo primero que ve
un recién llegado es a todo el mundo a cero.

### M13 · Rey de la pista

Modo de racha: aguantas mientras no falles. En 1 jugador y en 2 jugadores
sobre el mismo móvil **no necesita nada nuevo** — es M6 con otra regla de
fin de partida, así que puede ir en paralelo a M11.

- [ ] Definir la regla: ¿cuándo se pierde la corona? ¿Por bajar de X
      puntos, por perder un duelo, por fallar dos seguidas?
- [ ] Racha en 1 jugador
- [ ] Racha en 2 jugadores, mismo dispositivo
- [ ] La regla va en `engine.ts`, no en un componente

Esto está sin definir a propósito: la regla de cuándo se pierde la corona
es una decisión de diseño, no de programación, y la tenéis que tomar
vosotros antes de que yo escriba nada.

### M14 · 1 contra 1 online

Dos personas, dos dispositivos, el mismo reto. **Depende de M11.**

- [ ] Emparejar a dos jugadores con el mismo reto
- [ ] Ninguno ve las cifras del otro hasta que han jugado los dos
- [ ] El ganador lo decide el servidor con `duelWinner`
- [ ] Qué pasa si uno abandona a medias

## Al final — M0 · Colegas

- [x] Mandar el enlace a 3–5 colegas — han entrado 2
- [ ] **Decirles que entren con Google**: sin sesión la ronda no se guarda
      y el playtest no deja rastro que analizar
- [ ] Con ~50 rondas, `npm run curva` y decidir si es dura o blanda
- [ ] Ajustar `scoreRound` si hace falta
- [ ] Decidir si el `#N DEL RANKING` se queda

### El criterio, fijado antes de ver los datos

`puntos = 1000 × (1 − error × 5)`. Ese `×5` nunca se ha validado: con él, un
desvío del 20% ya da cero.

| Si en las rondas reales… | Veredicto | Qué hacer |
|---|---|---|
| Más del 40% son cero | **Dura** | Bajar a `×3`: el cero se va al 33% de error |
| Más del 40% pasan de 800 | **Blanda** | Subir a `×7` |
| Hay reparto, 10–20% de ceros | Está bien | No tocar |

Se escribe aquí antes de mirar los datos a propósito. Mirándolos primero es
muy fácil encontrarle una razón a lo que ya tenías.

`npm run curva` lee las rondas guardadas, imprime el reparto, el desglose
por deporte y una tabla de qué habría pasado con otros multiplicadores.
Avisa solo si hay menos de 50 rondas.

Aviso de la simulación: quien ficha cinco nombres famosos sin método se
desvía un 23–40%, o sea **cero en 6 ó 7 de cada 10 rondas**. Si eso se
confirma, la curva es dura.

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

## Errores vistos

Todo lo que está roto o mal, con su arreglo. Lo de abajo **sigue vivo**.
El login (antes nº 1) está en «Arreglados».

Orden por lo que duele, no por lo que cuesta.

---

### 🔴 2 · El cron de la NBA no ha funcionado nunca

**Qué pasa.** Tres ejecuciones registradas (14, 21 y 28 de septiembre), tres
fallos. Cero éxitos. Falla en el paso `npm run sync`.

**Por qué importa.** Las cifras de la NBA solo se actualizan cuando alguien
lanza el sync a mano. M5 estaba tachado entero como si lo automático
funcionara.

**Qué se descarta ya.** No son las cabeceras: el script ya manda `Referer`,
`x-nba-stats-origin`, `x-nba-stats-token` y un `User-Agent` de navegador, que
es lo que pide NBA Stats. Y no es falta de `npm install`: el script solo usa
módulos nativos de Node.

**Lo que queda.** Casi seguro que `stats.nba.com` bloquea las IPs de centro
de datos, y los runners de GitHub lo son.

**Arreglo.** Primero confirmarlo, que es gratis:

```
gh workflow run sync-nba.yml
gh run list --workflow=sync-nba.yml --limit 1
gh run view --log-failed
```

Si es el bloqueo por IP, **cambiar de sitio el cron no lo arregla** —Vercel y
los servicios de cron también salen de centros de datos—. Las salidas reales
son tres: ejecutarlo desde una IP doméstica (un equipo de casa, una
Raspberry), buscar otra fuente de datos, o aceptar que el sync es manual y
quitar el cron en vez de dejarlo fallando en silencio.

---

### 🟠 3 · La puntuación se puede falsificar

**Qué pasa.** `POST /api/reveal` puntúa con `scoreRound(total, target)` y el
`target` sale del cuerpo de la petición, o sea, **lo pone el cliente**.
Comprobado en vivo: con las mismas cinco fichas, cambiando solo ese campo se
pasa de 0 puntos a 1000 y «Nerd supremo».

**Por qué importa.** Hoy casi nada, porque solo te engañas a ti mismo. En
cuanto haya ranking global (M12) o 1 contra 1 online (M14), cualquiera
publica 1000.

**Arreglo.** Es M11 entero: que el reto lo emita y lo valide el servidor.

---

### 🟡 7 · Perfil no tiene ruta propia

**Qué pasa.** Perfil es una pestaña dentro de la partida, así que desde la
portada hay que entrar a un deporte para ver tu historial.

**Por qué importa ahora.** Era coherente cuando todo era una pantalla. Con el
juego repartido en rutas, chirría.

**Arreglo.** Una ruta `/perfil`. Decisión de M3 que conviene revisar.

---

### ✅ Arreglados

- **Con la ronda cerrada no se podía cambiar de deporte.** `locking` dejaba
  las pestañas deshabilitadas hasta «Siguiente». En `done` ya no se mira.
- **Un cero salía en verde.** El score usaba `var(--good)` fijo; ahora el
  color sale del error, igual que en el historial.
- **No había favicon.** `src/app/icon.svg` (N naranja). Next lo recoge solo.
- **Login en producción (`redirect_uri_mismatch`).** En el cliente OAuth, la
  URI de producción estaba como origen (`…vercel.app`) y no como callback
  (`…/api/auth/callback/google`). Además no se había guardado. La app ya
  mandaba la URI buena; Google no la tenía. Arreglado el 9-10-2026. Las
  vistas previas de Vercel pueden volver a fallar si no está `AUTH_URL`:
  no bloquea producción.
- **`npm run curva` no existía.** El `package.json` declaraba el script y
  `scripts/curva.mjs` no estaba en master: el comando reventaba con *module
  not found*. Arreglado, y además ahora avisa con una frase clara cuando no
  alcanza la base en vez de escupir un volcado de Node.

## Decisiones al llegar

| Cuándo | Qué |
|---|---|
| M4 | El cliente manda `target` al revelar; no hay tabla `challenges` (serverless). |
| catálogos | La NBA es un `Sport` (nombre, logo, fotos). El motor recibe un `Catalog`. |
| M2 | Catálogos = JSON. Postgres = users / partidas / ranking (M3 en adelante). |
| M3 | Tabla `users` la crea Auth.js. El callback de Google tiene que llevar `/api/auth/callback/google`, no el origen suelto. |
| perfil | Tabla `Round`. HUD y Perfil leen la BD si hay sesión; si no, localStorage. |
| M8 | Fútbol: clubes desde 2012 y sin cron (la fuente está parada). Se etiqueta en vez de ocultarse. |
| M6 | Mismo dispositivo: se pasa el móvil. Dos sesiones pediría retos emitidos por el servidor. |
