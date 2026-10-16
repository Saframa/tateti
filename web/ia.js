// Lógica del tateti con la IA entrenada por Q-learning.
// Port de tateti/main.py. Valores del tablero: 0 vacío, 1 IA (X), 2 humano (O).
// Resultado de verificarGanador: 1 gana la IA, 2 gana el humano, -1 empate, 0 partida en curso.
(function (root) {
  'use strict';

  var COMBINACIONES_GANADORAS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  function obtenerEstado(tablero) {
    return tablero.join('');
  }

  function verificarGanador(tablero) {
    for (var i = 0; i < COMBINACIONES_GANADORAS.length; i++) {
      var a = COMBINACIONES_GANADORAS[i][0];
      var b = COMBINACIONES_GANADORAS[i][1];
      var c = COMBINACIONES_GANADORAS[i][2];
      if (tablero[a] !== 0 && tablero[a] === tablero[b] && tablero[b] === tablero[c]) {
        return tablero[a];
      }
    }
    return tablero.indexOf(0) === -1 ? -1 : 0;
  }

  // Elige la jugada: con probabilidad epsilon al azar, si no la de mayor valor Q.
  // Igual que elegir_accion de Python: ante empate de valores gana la primera casilla vacía.
  function elegirAccion(qTable, estado, epsilon, rng) {
    var azar = rng || Math.random;
    var vacias = [];
    for (var i = 0; i < estado.length; i++) {
      if (estado.charAt(i) === '0') vacias.push(i);
    }
    if (vacias.length === 0) return null;
    if (azar() < (epsilon || 0)) {
      return vacias[Math.floor(azar() * vacias.length)];
    }
    var valores = qTable[estado] || [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var mejorVal = -Infinity;
    var mejorMov = vacias[0];
    for (var j = 0; j < vacias.length; j++) {
      if (valores[vacias[j]] > mejorVal) {
        mejorVal = valores[vacias[j]];
        mejorMov = vacias[j];
      }
    }
    return mejorMov;
  }

  var api = {
    COMBINACIONES_GANADORAS: COMBINACIONES_GANADORAS,
    obtenerEstado: obtenerEstado,
    verificarGanador: verificarGanador,
    elegirAccion: elegirAccion
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.TatetiIA = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
