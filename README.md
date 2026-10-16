# Tateti contra una IA

Juego de tres en línea contra una IA entrenada con Q-learning. Hay dos versiones:

- `python/`: la app de escritorio original, con interfaz en Tkinter.
- `web/`: la versión en JavaScript que corre en el navegador, sin dependencias.

## Versión web

Abrí `web/index.html` en el navegador. Quien empieza juega con la X y quien responde con la O. Quién empieza alterna en cada partida.

La IA tiene una tabla para cada rol: una para cuando empieza (X) y otra para cuando responde (O). Se entrenó por autojuego y se evaluó contra un rival perfecto (minimax): en 5000 partidas por rol, no perdió ninguna. Contra un rival al azar ganó el 99 % como X y el 91 % como O.

Para volver a entrenarla:

```bash
cd web
node entrenar.js 1000000
```

Esto regenera `qtable.js`, la tabla que usa la interfaz, e imprime la evaluación.

## Versión de escritorio

```bash
cd python
python main.py
```

Si no encuentra `ia_data.json`, entrena la IA en la primera ejecución (1 000 000 de partidas) y guarda el resultado. Esta versión usa una sola tabla para los dos roles, así que juega mejor cuando empieza ella.

Para generar el ejecutable con PyInstaller:

```bash
pyinstaller python/tateti.spec
```

## Licencia

MIT. Ver [LICENSE](LICENSE).
