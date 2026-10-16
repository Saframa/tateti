// Entrena la IA del tateti por autojuego (Q-learning) y genera qtable.js.
// Uso: node entrenar.js [partidas]
// Genera dos tablas: X (la IA juega con 1, empieza) y O (la IA juega con 2, responde).
// Se evalúa contra un rival perfecto (minimax) y contra un rival al azar.
'use strict';
const fs = require('fs');
const path = require('path');
const IA = require('./ia.js');

const PARTIDAS = parseInt(process.argv[2] || '1000000', 10);
const ALPHA = 0.5;
const GAMMA = 0.9;
const EPS_INICIAL = 0.3;
const EPS_MINIMO = 0.01;
const EPS_DECAY = 0.999995;
const PROB_RIVAL_AZAR = 0.3;

// Q[1] = tabla de la IA cuando juega X (1); Q[2] = cuando juega O (2)
const Q = { 1: {}, 2: {} };

function valores(marca, estado) {
  if (!Q[marca][estado]) Q[marca][estado] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  return Q[marca][estado];
}

function vacias(estado) {
  const out = [];
  for (let i = 0; i < 9; i++) if (estado[i] === '0') out.push(i);
  return out;
}

function elegir(marca, estado, eps) {
  const v = vacias(estado);
  if (Math.random() < eps) return v[Math.floor(Math.random() * v.length)];
  const q = valores(marca, estado);
  let mejor = v[0];
  let mejorVal = -Infinity;
  for (const i of v) {
    if (q[i] > mejorVal) { mejorVal = q[i]; mejor = i; }
  }
  return mejor;
}

function recompensa(resultado, marca) {
  if (resultado === marca) return 1;
  if (resultado === -1) return 0.5;
  return -1;
}

function entrenar(partidas) {
  let eps = EPS_INICIAL;
  for (let ep = 0; ep < partidas; ep++) {
    const t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let turno = Math.random() < 0.5 ? 1 : 2;
    // Con cierta probabilidad, uno de los dos bandos juega al azar (diversidad)
    const bandoAzar = Math.random() < PROB_RIVAL_AZAR ? (Math.random() < 0.5 ? 1 : 2) : 0;
    const pendiente = { 1: null, 2: null };

    for (;;) {
      const m = turno;
      const estado = t.join('');
      // Actualiza la jugada anterior de este bando con lo que ve ahora
      if (pendiente[m]) {
        const p = pendiente[m];
        const q = valores(m, p.s);
        const siguiente = Math.max(...valores(m, estado));
        q[p.a] += ALPHA * (GAMMA * siguiente - q[p.a]);
      }

      const a = bandoAzar === m
        ? vacias(estado)[Math.floor(Math.random() * vacias(estado).length)]
        : elegir(m, estado, eps);

      t[a] = m;
      const res = IA.verificarGanador(t);
      if (res !== 0) {
        const qm = valores(m, estado);
        qm[a] += ALPHA * (recompensa(res, m) - qm[a]);
        const otro = 3 - m;
        if (pendiente[otro]) {
          const p = pendiente[otro];
          const qo = valores(otro, p.s);
          qo[p.a] += ALPHA * (recompensa(res, otro) - qo[p.a]);
        }
        break;
      }
      pendiente[m] = { s: estado, a };
      turno = 3 - m;
    }
    if (eps > EPS_MINIMO) eps *= EPS_DECAY;
  }
}

// Minimax: valor para el jugador que mueve (1 gana, 0 empata, -1 pierde)
function minimax(t, m) {
  const r = IA.verificarGanador(t);
  if (r !== 0) return r === -1 ? 0 : (r === m ? 1 : -1);
  let mejor = -Infinity;
  for (let i = 0; i < 9; i++) {
    if (t[i] !== 0) continue;
    t[i] = m;
    const v = -minimax(t, 3 - m);
    t[i] = 0;
    if (v > mejor) mejor = v;
  }
  return mejor;
}

function jugarContra(marcaIA, rival, iaEmpieza, partidas) {
  const r = { gano: 0, perdio: 0, empate: 0 };
  for (let g = 0; g < partidas; g++) {
    const t = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let turno = iaEmpieza ? marcaIA : 3 - marcaIA;
    let res = 0;
    for (;;) {
      let a;
      if (turno === marcaIA) {
        a = elegir(marcaIA, t.join(''), 0);
      } else if (rival === 'perfecto') {
        a = mejorJugadaPerfecta(t, turno);
      } else {
        const v = vacias(t.join(''));
        a = v[Math.floor(Math.random() * v.length)];
      }
      t[a] = turno;
      res = IA.verificarGanador(t);
      if (res !== 0) break;
      turno = 3 - turno;
    }
    if (res === marcaIA) r.gano++;
    else if (res === -1) r.empate++;
    else r.perdio++;
  }
  return r;
}

function mejorJugadaPerfecta(t, m) {
  let mejor = -2, jugada = -1;
  for (let i = 0; i < 9; i++) {
    if (t[i] !== 0) continue;
    t[i] = m;
    const v = -minimax(t, 3 - m);
    t[i] = 0;
    if (v > mejor) { mejor = v; jugada = i; }
  }
  return jugada;
}

console.log('Entrenando ' + PARTIDAS + ' partidas por autojuego...');
const inicio = Date.now();
entrenar(PARTIDAS);
console.log('Listo en ' + ((Date.now() - inicio) / 1000).toFixed(1) + ' s');
console.log('Estados X: ' + Object.keys(Q[1]).length + ', estados O: ' + Object.keys(Q[2]).length);

const EVAL = 5000;
const resumen = {
  'IA empieza (X) vs perfecto': jugarContra(1, 'perfecto', true, EVAL),
  'IA responde (O) vs perfecto': jugarContra(2, 'perfecto', false, EVAL),
  'IA empieza (X) vs azar': jugarContra(1, 'azar', true, EVAL),
  'IA responde (O) vs azar': jugarContra(2, 'azar', false, EVAL)
};
console.log('Evaluación (' + EVAL + ' partidas cada una):');
for (const k of Object.keys(resumen)) console.log('  ' + k + ': ' + JSON.stringify(resumen[k]));

const salida = path.join(__dirname, 'qtable.js');
fs.writeFileSync(salida, 'window.TATETI_QTABLE = ' + JSON.stringify({ X: Q[1], O: Q[2] }) + ';\n');
console.log('Escrito ' + salida);
