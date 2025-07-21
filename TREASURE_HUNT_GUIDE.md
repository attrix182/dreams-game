# 🎯 Cazador de Tesoros - Minijuego

## 🎯 **Descripción General**

El **Cazador de Tesoros** es un minijuego emocionante donde se generan 10 objetos aleatorios en el mundo 3D y el primer jugador en recolectarlos todos gana. ¡Es una carrera contra el tiempo y otros jugadores!

## 🚀 **Cómo Iniciar el Juego**

### **Método 1: Tecla F10**
```
Presiona F10 para iniciar/detener el minijuego
```

### **Método 2: Comando de Chat**
```
Escribe en el chat: "iniciar caza"
```

## 🎮 **Cómo Jugar**

### **Objetivo**
- **Encontrar y recolectar 10 tesoros** escondidos en el mundo
- **Ser el primer jugador** en recolectar todos los tesoros
- **Completar la misión antes** de que se acabe el tiempo (5 minutos)

### **Mecánica de Recolección**
- **Acércate a los objetos** para recolectarlos automáticamente
- **Distancia de recolección**: 2 metros
- **Los tesoros desaparecen** después de ser recolectados
- **Solo puedes recolectar cada tesoro una vez**

## 🎁 **Tipos de Tesoros**

### **Objetos de Oficina**
- `desk`, `chair`, `table`, `cabinet`
- `lamp`, `computer`, `monitor`
- `keyboard`, `mouse`

### **Muebles**
- `couch`, `sofa`, `bed`, `shelf`
- `bookshelf`, `nightstand`, `coffee table`

### **Comida**
- `hamburger`, `pizza`, `soda`, `taco`
- `hot dog`, `fries`, `ice cream`, `cake`

### **Decoración**
- `plant`, `rug`, `trophy`, `art`
- `clock`, `vase`, `candle`

### **Varios**
- `box`, `basket`, `bin`, `container`
- `tool`, `book`, `magazine`

## 🎮 **Controles del Juego**

### **Interfaz del Juego**
- **Ubicación**: Esquina superior derecha
- **Información mostrada**:
  - Fase actual del juego
  - Temporizador
  - Progreso global de recolección
  - Número de jugadores

### **Botones de Control**
- **🎯 Iniciar Caza**: Comienza una nueva partida
- **⏹️ Parar Juego**: Termina la partida actual
- **🧹 Limpiar**: Elimina todos los tesoros

### **Comandos de Chat**
```
"estado" - Ver tu progreso personal
"ayuda" - Mostrar ayuda del juego
```

## 🏆 **Sistema de Victoria**

### **Condiciones de Victoria**
1. **Recolectar todos los tesoros** antes del tiempo límite
2. **Ser el primer jugador** en completar la misión

### **Condiciones de Derrota**
1. **Se acaba el tiempo** (5 minutos) sin completar
2. **Otro jugador recolecta** todos los tesoros primero

### **Empate por Tiempo**
- Si se acaba el tiempo, gana quien **recolectó más tesoros**
- Si hay empate, se declara **empate**

## 📊 **Estadísticas del Juego**

### **Información Personal**
- **Tesoros recolectados**: X/10
- **Tiempo transcurrido**: X:XX
- **Posición en ranking**: Xº lugar

### **Información Global**
- **Progreso total**: X/10 tesoros recolectados
- **Jugadores activos**: X
- **Tiempo restante**: X:XX

## 🎯 **Estrategias de Juego**

### **Búsqueda Eficiente**
1. **Explora sistemáticamente**: Divide el área en sectores
2. **Usa el radar visual**: Los tesoros son objetos 3D visibles
3. **Memoriza ubicaciones**: Recuerda dónde has visto tesoros
4. **Coordina con otros**: En multijugador, comunícate

### **Optimización de Tiempo**
1. **Planifica tu ruta**: No vayas de un lado a otro sin rumbo
2. **Prioriza tesoros cercanos**: Ve primero por los más próximos
3. **Usa el movimiento rápido**: Shift para correr
4. **Evita obstáculos**: No te quedes atascado

### **Competencia Inteligente**
1. **Observa otros jugadores**: Ve hacia dónde van
2. **Bloquea estratégicamente**: En multijugador, puedes "bloquear" áreas
3. **Comunica**: Coordina con aliados si los tienes
4. **Adapta tu estrategia**: Cambia de plan según la situación

## 🎮 **Modo Multijugador**

### **Características**
- **Todos los jugadores** compiten en la misma partida
- **Los tesoros son únicos**: Solo un jugador puede recolectar cada tesoro
- **Tiempo compartido**: Todos tienen los mismos 5 minutos
- **Ranking en tiempo real**: Ve quién va ganando

### **Estrategias Colaborativas**
- **División de áreas**: Cada jugador busca en una zona
- **Comunicación**: Informa a otros sobre tesoros encontrados
- **Apoyo mutuo**: Ayuda a otros a encontrar tesoros

### **Estrategias Competitivas**
- **Bloqueo**: Posiciónate para impedir que otros lleguen a tesoros
- **Distracción**: Haz que otros vayan a áreas sin tesoros
- **Velocidad**: Sé más rápido que la competencia

## 🔧 **Configuración Avanzada**

### **Parámetros Ajustables**
```javascript
// En TreasureHuntGame.js
this.config = {
    treasureCount: 10,      // Número de tesoros
    huntTime: 300,          // Tiempo en segundos
    spawnRadius: 20,        // Radio de spawn
    minDistance: 3,         // Distancia mínima entre tesoros
    collectionDistance: 2   // Distancia de recolección
};
```

### **Personalización**
- **Cambiar número de tesoros**: Modifica `treasureCount`
- **Ajustar tiempo**: Modifica `huntTime`
- **Cambiar área de spawn**: Modifica `spawnRadius`
- **Ajustar dificultad**: Modifica `collectionDistance`

## 🎉 **Consejos para Ganar**

### **Antes del Juego**
1. **Familiarízate con el mapa**: Conoce el terreno
2. **Practica el movimiento**: Domina los controles
3. **Configura tu sensibilidad**: Ajusta la velocidad del mouse

### **Durante el Juego**
1. **Mantén la calma**: No te apresures innecesariamente
2. **Observa el progreso**: Ve cuántos tesoros faltan
3. **Adapta tu estrategia**: Cambia de plan si es necesario
4. **Comunica**: En multijugador, coordina con otros

### **Optimización Técnica**
1. **Usa WASD eficientemente**: Combina movimientos
2. **Aprovecha el salto**: Para llegar a lugares difíciles
3. **Usa el arrastre**: Puedes mover objetos si es necesario
4. **Mantén el foco**: No te distraigas con otros elementos

## 🏅 **Logros y Estadísticas**

### **Logros Disponibles**
- **🏆 Primera Victoria**: Gana tu primera partida
- **⚡ Velocista**: Completa en menos de 2 minutos
- **🎯 Perfeccionista**: Recolecta todos los tesoros sin errores
- **👥 Colaborador**: Gana en modo multijugador
- **🔄 Persistente**: Juega 10 partidas

### **Estadísticas Rastreadas**
- **Partidas jugadas**: Total de veces que has jugado
- **Victorias**: Número de veces que has ganado
- **Tiempo promedio**: Tiempo medio para completar
- **Tesoros recolectados**: Total de tesoros recolectados
- **Ranking**: Posición en la tabla de líderes

## 🚀 **Próximas Características**

### **Planeadas**
- [ ] Múltiples mapas temáticos
- [ ] Power-ups durante la caza
- [ ] Modo torneo
- [ ] Estadísticas persistentes
- [ ] Logros y badges

### **Solicitadas**
- [ ] Modo tiempo infinito
- [ ] Tesoros móviles
- [ ] Efectos especiales
- [ ] Música de fondo
- [ ] Modo espectador

## 🎮 **Comandos de Debug**

### **F10 - Iniciar/Detener Juego**
```
Presiona F10 para activar el minijuego
```

### **Comandos de Chat**
```
"estado" - Ver tu progreso
"ayuda" - Mostrar ayuda
```

### **Logs de Consola**
- **🎁 Tesoro generado**: Cuando se crea un tesoro
- **🎯 Tesoro recolectado**: Cuando alguien recolecta un tesoro
- **🏆 Victoria**: Cuando alguien gana
- **⏰ Tiempo agotado**: Cuando se acaba el tiempo

## 🎉 **Conclusión**

El **Cazador de Tesoros** es un minijuego emocionante que combina:
- **Exploración**: Buscar tesoros en el mundo 3D
- **Competencia**: Ser el primero en completar la misión
- **Estrategia**: Planificar tu ruta y adaptarte
- **Colaboración**: Trabajar con otros en multijugador

**¡Disfruta cazando tesoros y compitiendo por la victoria!** 🎯🏆 