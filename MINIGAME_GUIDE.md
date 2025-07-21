# 🎮 Constructor de Obstáculos - Minijuego

## 🎯 **Descripción General**

El **Constructor de Obstáculos** es un minijuego que aprovecha todas las funcionalidades del sistema 3D para crear una experiencia de construcción y competencia colaborativa.

## 🚀 **Cómo Iniciar el Juego**

### **Método 1: Tecla F12**
```
Presiona F12 para iniciar/detener el minijuego
```

### **Método 2: Comando de Chat**
```
Escribe en el chat: "iniciar juego"
```

## 🏗️ **Fases del Juego**

### **Fase 1: Construcción (3 minutos)**
- **Objetivo**: Crear obstáculos usando comandos naturales
- **Comandos disponibles**:
  ```
  "mesa roja gigante"
  "silla azul pequeña"
  "hamburguesa dorada"
  "couch verde"
  "desk moderno"
  "table circular"
  ```

### **Fase 2: Carrera (2 minutos)**
- **Objetivo**: Completar la pista de obstáculos
- **Comandos disponibles**:
  ```
  "completar" - Marca que terminaste la pista
  "puntaje 100" - Establece tu puntuación
  ```

### **Fase 3: Votación (1 minuto)**
- **Objetivo**: Votar por la mejor pista
- **Comandos disponibles**:
  ```
  "votar 5" - Votar con 5 estrellas (excelente)
  "votar 4" - Votar con 4 estrellas (muy buena)
  "votar 3" - Votar con 3 estrellas (buena)
  "votar 2" - Votar con 2 estrellas (regular)
  "votar 1" - Votar con 1 estrella (mala)
  ```

## 🎮 **Controles del Juego**

### **Interfaz del Juego**
- **Ubicación**: Esquina superior derecha
- **Información mostrada**:
  - Fase actual del juego
  - Temporizador
  - Número de obstáculos
  - Número de jugadores

### **Botones de Control**
- **🎮 Iniciar Juego**: Comienza una nueva partida
- **⏹️ Parar Juego**: Termina la partida actual
- **🧹 Limpiar**: Elimina todos los obstáculos

## 🏆 **Sistema de Puntuación**

### **Puntos por Obstáculos**
- **1-5 obstáculos**: 10 puntos cada uno
- **6-10 obstáculos**: 15 puntos cada uno
- **11-15 obstáculos**: 20 puntos cada uno
- **16-20 obstáculos**: 25 puntos cada uno

### **Puntos por Tiempo**
- **Completar en <30s**: +100 puntos
- **Completar en <60s**: +50 puntos
- **Completar en <90s**: +25 puntos
- **Completar en <120s**: +10 puntos

### **Puntos por Votación**
- **Calificación promedio ≥4.5**: +50 puntos
- **Calificación promedio ≥4.0**: +30 puntos
- **Calificación promedio ≥3.5**: +20 puntos
- **Calificación promedio ≥3.0**: +10 puntos

## 🎯 **Estrategias de Juego**

### **Fase de Construcción**
1. **Planifica tu pista**: Piensa en el recorrido antes de construir
2. **Usa variedad**: Combina diferentes tipos de objetos
3. **Considera el tamaño**: Objetos grandes son más difíciles de evitar
4. **Crea patrones**: Forma laberintos o secuencias desafiantes

### **Fase de Carrera**
1. **Memoriza la ruta**: Recuerda dónde están los obstáculos
2. **Usa el arrastre**: Puedes mover objetos si es necesario
3. **Mantén la calma**: No te apresures, planifica tus movimientos
4. **Comunica**: Coordina con otros jugadores

### **Fase de Votación**
1. **Sé objetivo**: Evalúa la creatividad y dificultad
2. **Considera la jugabilidad**: ¿Es divertida la pista?
3. **Valora la originalidad**: ¿Hay ideas creativas?

## 🎨 **Comandos Creativos**

### **Objetos de Oficina**
```
"desk moderno rojo"
"chair ergonómica azul"
"table circular grande"
"cabinet vintage"
"lamp moderna"
```

### **Objetos de Comida**
```
"hamburguesa gigante"
"pizza dorada"
"soda azul pequeña"
"taco verde"
"hot dog rojo"
```

### **Muebles**
```
"couch grande verde"
"sofa moderno azul"
"mesa redonda"
"estante alto"
"cama doble"
```

### **Decoración**
```
"plant grande"
"lamp floor"
"rug circular"
"art wall"
"trophy dorado"
```

## 🏁 **Resultados Finales**

### **Criterios de Evaluación**
- **Número de obstáculos**: Más obstáculos = más puntos
- **Variedad**: Diferentes tipos de objetos
- **Creatividad**: Diseños originales
- **Dificultad**: Pistas desafiantes pero jugables
- **Tiempo de completado**: Velocidad de los jugadores

### **Premios**
- **🏆 Excelente (4.5+ estrellas)**: "¡Pista maestra!"
- **🥇 Muy Buena (4.0+ estrellas)**: "¡Gran diseño!"
- **🥈 Buena (3.5+ estrellas)**: "¡Bien hecho!"
- **🥉 Regular (3.0+ estrellas)**: "¡Hay potencial!"

## 🎮 **Modo Multijugador**

### **Construcción Colaborativa**
- Todos los jugadores pueden crear obstáculos
- Los objetos se sincronizan en tiempo real
- Límite de 20 obstáculos por partida

### **Carrera Competitiva**
- Todos compiten en la misma pista
- Tiempos individuales se registran
- Ranking de jugadores por velocidad

### **Votación Democrática**
- Todos pueden votar por la pista
- Calificación promedio determina el resultado
- Resultados se muestran a todos

## 🔧 **Configuración Avanzada**

### **Tiempos Ajustables**
```javascript
// En ObstacleCourseGame.js
this.config = {
    buildTime: 180,    // 3 minutos para construir
    raceTime: 120,     // 2 minutos para completar
    voteTime: 60,      // 1 minuto para votar
    maxObstacles: 20,  // Máximo de obstáculos
    minObstacles: 5    // Mínimo de obstáculos
};
```

### **Puntuación Personalizada**
```javascript
// Modificar los valores de puntuación
const obstaclePoints = {
    '1-5': 10,
    '6-10': 15,
    '11-15': 20,
    '16-20': 25
};
```

## 🎉 **Consejos para Ganar**

### **Construcción Efectiva**
1. **Crea un tema**: Oficina, restaurante, hogar
2. **Usa colores**: Hace la pista más visual
3. **Varía tamaños**: Objetos grandes y pequeños
4. **Forma patrones**: Laberintos, zigzags, círculos

### **Carrera Inteligente**
1. **Practica la ruta**: Recorre la pista antes de la carrera
2. **Encuentra atajos**: Busca rutas alternativas
3. **Coordina movimientos**: Evita colisiones con otros
4. **Mantén el ritmo**: No te detengas innecesariamente

### **Votación Justa**
1. **Evalúa objetivamente**: No votes por amistad
2. **Considera la dificultad**: Pistas muy fáciles o muy difíciles
3. **Valora la creatividad**: Diseños originales merecen más puntos
4. **Piensa en la jugabilidad**: ¿Es divertida para todos?

## 🚀 **Próximas Características**

### **Planeadas**
- [ ] Múltiples mapas temáticos
- [ ] Power-ups durante la carrera
- [ ] Modo torneo
- [ ] Estadísticas persistentes
- [ ] Logros y badges

### **Solicitadas**
- [ ] Modo tiempo infinito
- [ ] Obstáculos móviles
- [ ] Efectos especiales
- [ ] Música de fondo
- [ ] Modo espectador

---

**¡Disfruta construyendo y compitiendo en el Constructor de Obstáculos!** 🎮🏗️🏃‍♂️ 