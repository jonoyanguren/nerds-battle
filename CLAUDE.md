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

- `prototype/nerds-battle.html` — prototipo v0.1 completo, un solo archivo.
  Tres bloques marcados con comentarios: `1. DATOS`, `2. MOTOR`, `3. UI`.
- `docs/game-design.md` — mecánica, puntuación y decisiones abiertas.
- `README.md` — visión general y roadmap.

## Reglas de trabajo

- **El motor antes que la UI.** `makeChallenge` y `scoreRound` son funciones
  puras sin React. Cualquier regla nueva del juego va ahí, no en un componente.
- **Los datos son una dependencia, no parte del juego.** El motor solo consume
  `PLAYERS[statId] = [{name, value}]`. Cuando se migre a base de datos, esa
  forma no cambia.
- **Nada de dependencias nuevas sin motivo.** El prototipo tiene React y nada
  más. Si algo pide una librería, plantéalo antes.
- **Un cambio, una pregunta respondida.** Este proyecto existe para saber si el
  juego engancha. Las features que no ayuden a contestar eso esperan.

## Estado actual y lo siguiente

Prototipo jugable de un jugador. Lo siguiente, por orden:

1. Curva de puntuación — la fórmula actual (`error × 5`) es un primer intento
   sin validar. Ajustarla jugando.
2. Modo 2 jugadores.
3. Migración a Next.js + Postgres, solo cuando 1 y 2 confirmen que merece la pena.

## Idioma

Interfaz y documentación en español. Nombres de jugadores tal cual (con
acentos: Jokić, Dončić); el buscador ya normaliza para que "jokic" encuentre a
Jokić. Código y nombres de variables en inglés.
