// Interfaz del tateti. Port de JuegoGUI de tateti/main.py.
// Requiere ia.js (TatetiIA) y qtable.js (TATETI_QTABLE, con tablas X y O) cargados antes.
// La IA usa la tabla de su marca: X si empieza, O si responde.
(function () {
  'use strict';

  var CLAVE_TURNO = 'tateti-proximo-en-empezar';
  var IA = TatetiIA;
  var TABLAS = window.TATETI_QTABLE || { X: {}, O: {} };

  var tablero = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  var proximoEnEmpezar = leerProximo();
  var marcaIA = 1;
  var marcaHumano = 2;
  var celdas = [];
  var panelFin = document.getElementById('panel-fin');
  var mensajeFin = document.getElementById('mensaje-fin');
  var estadoTexto = document.getElementById('estado');
  var botonNueva = document.getElementById('nueva-partida');

  // Guarda de quién empieza en localStorage. Si el navegador lo bloquea, el juego sigue igual.
  function leerProximo() {
    try {
      var v = parseInt(window.localStorage.getItem(CLAVE_TURNO), 10);
      return v === 2 ? 2 : 1;
    } catch (e) {
      return 1;
    }
  }

  function guardarProximo() {
    try {
      window.localStorage.setItem(CLAVE_TURNO, String(proximoEnEmpezar));
    } catch (e) { /* sin persistencia */ }
  }

  function crearTablero() {
    var contenedor = document.getElementById('tablero');
    for (var i = 0; i < 9; i++) {
      var btn = document.createElement('button');
      btn.className = 'celda';
      btn.setAttribute('aria-label', 'Casilla ' + (i + 1));
      btn.dataset.indice = String(i);
      btn.addEventListener('click', onClickCelda);
      contenedor.appendChild(btn);
      celdas.push(btn);
    }
  }

  function pintarCelda(i, valor) {
    celdas[i].textContent = valor === 1 ? 'X' : valor === 2 ? 'O' : '';
    celdas[i].disabled = valor !== 0;
  }

  function onClickCelda(e) {
    var i = parseInt(e.currentTarget.dataset.indice, 10);
    if (tablero[i] !== 0) return;
    tablero[i] = marcaHumano;
    pintarCelda(i, marcaHumano);
    if (!revisarEstado()) turnoIA();
  }

  function turnoIA() {
    var estado = IA.obtenerEstado(tablero);
    var tabla = marcaIA === 1 ? TABLAS.X : TABLAS.O;
    var accion = IA.elegirAccion(tabla, estado, 0);
    if (accion === null) return;
    tablero[accion] = marcaIA;
    pintarCelda(accion, marcaIA);
    revisarEstado();
  }

  // Devuelve true si la partida terminó.
  function revisarEstado() {
    var res = IA.verificarGanador(tablero);
    if (res === 0) {
      estadoTexto.textContent = 'Tu turno';
      return false;
    }
    // Igual que en Python: después de cada partida alterna quién empieza.
    proximoEnEmpezar = proximoEnEmpezar === 1 ? 2 : 1;
    guardarProximo();
    if (res === -1) mensajeFin.textContent = 'Empate';
    else mensajeFin.textContent = res === marcaIA ? 'Ganó la IA' : 'Ganaste';
    panelFin.hidden = false;
    botonNueva.focus();
    return true;
  }

  function iniciarPartida() {
    tablero = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < 9; i++) pintarCelda(i, 0);
    panelFin.hidden = true;
    if (proximoEnEmpezar === 1) {
      marcaIA = 1;
      marcaHumano = 2;
      estadoTexto.textContent = 'La IA empieza';
      turnoIA();
    } else {
      marcaIA = 2;
      marcaHumano = 1;
      estadoTexto.textContent = 'Empezás vos';
    }
  }

  crearTablero();
  botonNueva.addEventListener('click', iniciarPartida);
  iniciarPartida();
})();
