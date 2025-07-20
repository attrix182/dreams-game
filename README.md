# 🌟 Dreams 3D - Juego Multijugador

Un juego 3D con IA local para generar objetos dinámicamente y **soporte multijugador completo**.

## 🚀 Características

### 🎮 **Juego Base**
- **Generación de objetos con IA**: Describe cualquier objeto y se creará automáticamente
- **Física realista**: Gravedad, colisiones y rebotes
- **Manipulación de objetos**: Mover, rotar y escalar objetos como en Portal
- **Controles fluidos**: WASD, mouse look, saltos y carrera

### 🌐 **Multijugador**
- **Hasta 50 jugadores simultáneos**
- **Sincronización en tiempo real** de posiciones y objetos
- **Chat integrado** para comunicación
- **Física compartida** en el servidor
- **Jugadores remotos visibles** con nombres y barras de salud

## 🛠️ Instalación

### 1. **Instalar Dependencias**
```bash
npm install
```

### 2. **Iniciar Servidor y Cliente**
```bash
# Opción 1: Iniciar todo junto
npm run dev:full

# Opción 2: Iniciar por separado
npm run server    # Servidor en puerto 3000
npm run dev       # Cliente en puerto 5173
```

## 🎯 Cómo Jugar

### **Controles Básicos**
- **WASD**: Movimiento
- **Mouse**: Mirar alrededor (horizonte nivelado)
- **Space**: Saltar
- **Shift**: Correr
- **E**: Interactuar con objetos
- **G**: Generar objeto (menú rápido)

### **Manipulación de Objetos**
- **Click + Mantener**: Mover objeto
- **Scroll**: Acercar/alejar objeto (estilo Portal)
- **F3**: Corregir altura de todos los objetos

### **Multijugador**
- **💬**: Abrir/cerrar chat
- **Enter**: Enviar mensaje
- **Jugadores visibles**: Con colores únicos y nombres

## 🌐 Configuración del Servidor

### **Puertos**
- **Servidor**: `http://localhost:3001`
- **Cliente**: `http://localhost:3000`
- **API Status**: `http://localhost:3001/api/status`

### **Variables de Entorno**
```bash
PORT=3000          # Puerto del servidor
MAX_PLAYERS=50     # Máximo de jugadores
```

## 📊 Panel de Estado

Accede a `http://localhost:3000/api/status` para ver:
- Estado del servidor
- Número de jugadores conectados
- Número de objetos en el mundo
- Tiempo de actividad

## 🏗️ Arquitectura

### **Servidor (`server/`)**
- `index.js`: Servidor principal con Express y Socket.io
- `GameServer.js`: Lógica del juego multijugador

### **Cliente (`src/`)**
- `network/NetworkManager.js`: Comunicación con el servidor
- `game/RemotePlayer.js`: Representación de otros jugadores
- `ui/ChatSystem.js`: Sistema de chat

### **Características Técnicas**
- **WebSocket**: Comunicación en tiempo real
- **Interpolación**: Movimiento suave de jugadores remotos
- **Física del servidor**: Sincronización de objetos
- **Reconexión automática**: Manejo de desconexiones

## 🎨 Generación de Objetos

### **Tipos Soportados**
- **Geometrías básicas**: Cubo, esfera, cilindro, cono, toro
- **Objetos compuestos**: Árboles, casas, animales, vehículos, objetos mágicos
- **Materiales**: Básico, metálico, transparente, brillante
- **Efectos**: Brillo, partículas, rotación, flotación

### **Ejemplos de Descripción**
```
"un árbol mágico brillante"
"una casa flotante transparente"
"un dragón de fuego con partículas"
"un coche deportivo rojo"
```

## 🔧 Comandos de Debug

- **F1**: Mostrar estado de debug
- **F2**: Forzar modo de arrastre
- **F3**: Corregir altura de objetos
- **R**: Resetear rotación de cámara
- **[]**: Ajustar sensibilidad del mouse

## 🌟 Características Avanzadas

### **Física Realista**
- Gravedad aplicada a todos los objetos
- Colisiones con el suelo
- Rebotes y fricción
- Ajuste automático de altura

### **Sistema de Chat**
- Mensajes en tiempo real
- Notificaciones de conexión/desconexión
- Historial de mensajes
- Interfaz intuitiva

### **Optimizaciones**
- Interpolación de movimiento
- LOD (Level of Detail) para jugadores remotos
- Limpieza automática de objetos desconectados
- Compresión de datos de red

## 🚀 Despliegue

### **Local**
```bash
npm run dev:full
```

### **Producción**
```bash
npm run build
npm run server
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📝 Licencia

MIT License - Ver `LICENSE` para más detalles.

---

**¡Disfruta creando y explorando en Dreams 3D!** 🌟 