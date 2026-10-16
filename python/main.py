import random
import json
import os
import tkinter as tk
from tkinter import messagebox

COMBINACIONES_GANADORAS = ((0,1,2), (3,4,5), (6,7,8), (0,3,6), (1,4,7), (2,5,8), (0,4,8), (2,4,6))

class Tateti:
    def __init__(self):
        self.tablero = [0] * 9
        self.q_table = {}
        self.proximo_en_empezar = 1 # 1 para IA, 2 para Humano

    def obtener_estado(self):
        return "".join(map(str, self.tablero))      

    def inicializar_estado_si_no_existe(self, estado):
        if estado not in self.q_table:
            self.q_table[estado] = [0.0] * 9

    def elegir_accion(self, estado, epsilon=0.1):
        vacias = [i for i, char in enumerate(estado) if char == '0']
        if not vacias: return None
        if random.random() < epsilon:
            return random.choice(vacias)
        else:
            self.inicializar_estado_si_no_existe(estado)
            valores_q = self.q_table[estado]
            mejor_val = -float('inf')
            mejor_mov = vacias[0]
            for i in vacias:
                if valores_q[i] > mejor_val:
                    mejor_val = valores_q[i]
                    mejor_mov = i
            return mejor_mov
        
    def guardar_q_table(self, nombre_archivo="sabiduria_ia.json"):
        with open(nombre_archivo, 'w') as f:
            json.dump(self.q_table, f)
        print("Sabiduría guardada en el disco.")

    def cargar_q_table(self, nombre_archivo="sabiduria_ia.json"):
        if os.path.exists(nombre_archivo):
            with open(nombre_archivo, 'r') as f:
                self.q_table = json.load(f)
            return True
        return False

    def guardar(self):
        # Guardamos la tabla Y quién debe empezar la próxima vez
        datos = {
            "q_table": self.q_table,
            "proximo_en_empezar": self.proximo_en_empezar
        }
        with open("ia_data.json", "w") as f:
            json.dump(datos, f)

    def cargar(self):
        if os.path.exists("ia_data.json"):
            with open("ia_data.json", "r") as f:
                datos = json.load(f)
                self.q_table = datos.get("q_table", {})
                self.proximo_en_empezar = datos.get("proximo_en_empezar", 1)
            return True
        return False

def verificar_ganador(tablero):
    for a, b, c in COMBINACIONES_GANADORAS:
        if tablero[a] == tablero[b] == tablero[c] != 0: return tablero[a]
    return -1 if 0 not in tablero else 0

def entrenar(agente, repeticiones=1000000):
    alpha, gamma, epsilon = 0.5, 0.9, 0.3
    print(f"Entrenando {repeticiones} partidas...")
    for i in range(repeticiones):
        agente.tablero = [0] * 9
        estado_actual = agente.obtener_estado()
        fin = False
        es_rival_azar = random.random() < 0.3
        while not fin:
            agente.inicializar_estado_si_no_existe(estado_actual)
            accion = agente.elegir_accion(estado_actual, epsilon)
            agente.tablero[accion] = 1
            nuevo_estado = agente.obtener_estado()
            resultado = verificar_ganador(agente.tablero)
            recompensa = 0
            if resultado == 1: recompensa, fin = 1, True
            elif resultado == -1: recompensa, fin = 0.5, True
            else:
                vacias = [idx for idx, char in enumerate(nuevo_estado) if char == '0']
                accion_rival = random.choice(vacias) if es_rival_azar else agente.elegir_accion(nuevo_estado, epsilon)
                agente.tablero[accion_rival] = 2
                nuevo_estado = agente.obtener_estado()
                res_rival = verificar_ganador(agente.tablero)
                if res_rival == 2: recompensa, fin = -1, True
                elif res_rival == -1: recompensa, fin = 0.5, True
            agente.inicializar_estado_si_no_existe(nuevo_estado)
            q_act = agente.q_table[estado_actual][accion]
            max_f = max(agente.q_table[nuevo_estado])
            agente.q_table[estado_actual][accion] = q_act + alpha * (recompensa + gamma * max_f - q_act)
            estado_actual = nuevo_estado
        if epsilon > 0.01: epsilon *= 0.999999
    agente.guardar()

class JuegoGUI:
    def __init__(self, agente):
        self.agente = agente
        self.ventana = tk.Tk()
        self.ventana.title("IA Tateti - Turnos Memorizados")
        self.botones = []
        self.crear_tablero()
        self.iniciar_partida() # Nueva función para manejar el arranque
        self.ventana.mainloop()

    def crear_tablero(self):
        for i in range(9):
            btn = tk.Button(self.ventana, text="", font=('Arial', 20), width=5, height=2,
                             command=lambda i=i: self.movimiento_humano(i))
            btn.grid(row=i//3, column=i%3)
            self.botones.append(btn)

    def iniciar_partida(self):
        self.agente.tablero = [0] * 9
        for btn in self.botones: 
            btn.config(text="", state="normal")
        
        # Verificamos quién debe empezar según los datos guardados
        if self.agente.proximo_en_empezar == 1:
            self.turno_ia()
        # Si es 2 (humano), no hacemos nada y esperamos el clic.

    def turno_ia(self):
        estado = self.agente.obtener_estado()
        accion = self.agente.elegir_accion(estado, epsilon=0)
        if accion is not None:
            self.agente.tablero[accion] = 1
            self.botones[accion].config(text="X", state="disabled")
            self.revisar_estado()

    def movimiento_humano(self, i):
        if self.agente.tablero[i] == 0:
            self.agente.tablero[i] = 2
            self.botones[i].config(text="O", state="disabled")
            if not self.revisar_estado():
                self.turno_ia()

    def revisar_estado(self):
        res = verificar_ganador(self.agente.tablero)
        if res != 0:
            # Antes de mostrar el mensaje, alternamos y GUARDAMOS el próximo turno
            self.agente.proximo_en_empezar = 2 if self.agente.proximo_en_empezar == 1 else 1
            self.agente.guardar()
            
            msg = "¡Ganó la IA!" if res == 1 else "¡Ganaste!" if res == 2 else "Empate"
            messagebox.showinfo("Fin del juego", msg)
            self.iniciar_partida()
            return True
        return False

if __name__ == "__main__":
    ia = Tateti()
    if not ia.cargar():
        entrenar(ia, repeticiones=1000000)
    JuegoGUI(ia)