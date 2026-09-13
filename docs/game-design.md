# Diseño del juego

## La ronda

Estadística al azar (nunca repite la anterior) → objetivo generado → 5 huecos →
revelado → puntuación → siguiente.

## Generación del objetivo

El objetivo sale de sumar 5 jugadores reales elegidos al azar del ranking de esa
estadística, redondeado a 3 cifras significativas.

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
- **¿Cuántos jugadores por pool?** 100. Con menos, todos reconocibles pero poca
  rejugabilidad; con más, demasiados nombres oscuros.

## Modo 2 jugadores (sin construir)

Mismo reto para los dos. Turnos alternos o simultáneos a ciegas. Gana quien menos
error tenga. Pendiente: si juegan en el mismo dispositivo, el segundo no puede
ver las elecciones del primero.
