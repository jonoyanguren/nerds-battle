# Diseño del juego

## La ronda

Estadística al azar de un **catálogo** (deporte) → objetivo generado → 5 huecos →
revelado → puntuación → siguiente. El catálogo (NBA, luego fútbol…) trae nombre,
logo y fotos; el motor no sabe qué liga es.

## Generación del objetivo

El objetivo sale de sumar 5 jugadores reales del **tramo alto** (top 150) de
esa estadística, redondeado a 3 cifras significativas. El buscador ve ~3000
para poder corregir con jugadores menores.

Motivo: un objetivo arbitrario puede ser imposible (nadie suma 500.000 puntos
con 5 jugadores) o trivial. Derivarlo del propio pool garantiza que existe al
menos una combinación que lo clava y que el rango es plausible.

Efecto secundario a vigilar: los objetivos tienden a la media del pool, así que
la mayoría caen en un rango parecido. Si el juego se vuelve monótono, sesgar la
selección hacia los extremos del ranking.

## Puntuación

    error   = |suma − objetivo| / objetivo
    puntos  = max(0, round(1000 · (1 − error · 5)))

| Error | Puntos | Veredicto |
|---|---|---|
| ≤ 1% | 950+ | Nerd supremo |
| ≤ 3% | 850+ | Enciclopedia |
| ≤ 7% | 650+ | Buen ojo |
| ≤ 15% | 250+ | Aficionado |
| > 20% | 0 | Fuera de rango |

**Sin validar.** El multiplicador ×5 es un primer intento. Si casi todas las
rondas dan cero, es demasiado duro; si casi todas pasan de 800, demasiado blando.
Es lo primero que hay que tocar tras unas cuantas partidas.

## Decisiones abiertas

- **¿Se puede repetir jugador?** Ahora no. Permitirlo abriría la puerta a
  estrategias degeneradas (cinco veces el mismo jugador top).
- **¿Buscador o lista?** Ahora buscador por nombre. Una lista completa haría el
  juego más fácil para quien no se sepa los nombres, pero convierte el reto en
  aritmética. El buscador premia saber quién está en el ranking.
- **¿Mostrar la posición en el ranking?** Ahora sí (#14 del ranking). Es una
  pista fuerte: ordena a los jugadores sin dar la cifra. Probar a quitarlo.
- **¿Cuántos jugadores por pool?** ~3000 en el buscador (para poder afinar con
  gente “mala”). El objetivo se siembra solo del top 150, si no los retos
  caen al suelo.

## Cuenta e historial

No cambia la puntuación. Con Google, cada revelado se guarda (`Round`). El
Perfil muestra objetivo, suma, error y la plantilla. Sin cuenta, el HUD
sigue en `localStorage`. No hay ranking público: comparar con otros espera
a que haya playtest (M0) y, si se compara, retos emitidos por el servidor.

## Modo 2 jugadores

Mismo reto para los dos, turnos alternos, y **gana quien menos error tenga**
(`duelWinner` en el motor). Se compara el error y no los puntos porque los
puntos tienen suelo en 0: dos plantillas malas empatarían a cero aunque una
esté mucho más cerca. El empate existe y se enseña.

Se juega en **el mismo dispositivo**, pasándose el móvil. Lo que era la pega
—que el segundo no vea las elecciones del primero— se resuelve así:

- La plantilla del primero se borra de la pantalla antes de tapar nada, así
  que detrás de la cortina no queda nada suyo.
- Las cifras de los dos se piden en **una sola llamada**, cuando ya han
  jugado ambos. Si el primero revelara al terminar su turno, sus cifras
  estarían en la misma pantalla que va a usar el segundo.
- El buscador se reinicia al cambiar de manos.

Un duelo no guarda `Round` ni toca el HUD: los dos comparten navegador y
sesión, y el perfil es de una persona.

Jugar a distancia (dos móviles) sigue sin construir, y no es solo fontanería:
en cuanto el reto viaja por la red y la puntuación decide quién gana, hace
falta que el reto lo emita y lo valide el servidor.
