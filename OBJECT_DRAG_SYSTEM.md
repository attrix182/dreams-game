# 🎯 Sistema de Arrastre de Objetos (Drag & Drop)

## 🎮 **Cómo Usar el Sistema de Arrastre**

### **Controles Básicos:**
- **Click Izquierdo**: Iniciar/Detener arrastre de objeto
- **Mouse**: Mover el objeto en 3D
- **Scroll**: Acercar/Alejar el objeto de la cámara
- **Escape**: Cancelar arrastre

### **Pasos para Arrastrar:**
1. **Acercarse al objeto** (máximo 3 metros)
2. **Mirar hacia el objeto** (crosshair verde)
3. **Mantener click izquierdo** para arrastrar
4. **Mover el mouse** para reposicionar
5. **Usar scroll** para acercar/alejar
6. **Soltar click** para finalizar

## 🎨 **Feedback Visual**

### **Crosshair (Mira):**
- **Blanco**: Sin objeto seleccionado
- **Verde**: Objeto en rango (≤3m)
- **Rojo**: Objeto muy lejos (>3m)
- **Amarillo**: Arrastrando objeto

### **Indicador de Interacción:**
- **Verde**: "Click para mover: [Objeto] (X.Xm)"
- **Rojo**: "Muy lejos: [Objeto] (X.Xm)"
- **Amarillo**: "Arrastrando: [Objeto] | Scroll: Acercar/Alejar"

### **Efectos en Objetos:**
- **Brillo verde**: Objeto siendo arrastrado
- **Material original**: Objeto en reposo

## 🔧 **Características Técnicas**

### **Detección de Objetos:**
- **Raycasting**: Detección precisa de objetos 3D
- **Búsqueda jerárquica**: Encuentra meshes hijos
- **Distancia máxima**: 3 metros de interacción
- **Objetos compatibles**: Todos los objetos generados

### **Física Durante Arrastre:**
- **Gravedad desactivada**: Objeto flota libremente
- **Física reactivada**: Al soltar el objeto
- **Posición sincronizada**: En tiempo real con multijugador

### **Sincronización Multijugador:**
- **Movimiento en tiempo real**: Todos los jugadores ven el movimiento
- **Posición final**: Se sincroniza al soltar el objeto
- **Escala normalizada**: Evita objetos muy pequeños/grandes

## 🎯 **Estados del Sistema**

### **Estado Normal:**
```
🎮 Jugador libre
🎯 Sin objeto seleccionado
📊 Crosshair blanco
```

### **Objeto Detectado:**
```
🎮 Jugador libre
🎯 Objeto: [Nombre] (X.Xm)
📊 Crosshair verde/rojo
💬 Indicador visible
```

### **Arrastrando:**
```
🎮 Arrastrando objeto
🎯 Objeto: [Nombre] (X.Xm)
📊 Crosshair amarillo
💬 Indicador amarillo
✨ Efecto visual activo
```

## 🚨 **Solución de Problemas**

### **"No hay objeto interactuable seleccionado"**
**Causas:**
- Objeto muy lejos (>3m)
- Raycasting no detecta el mesh
- Objeto no agregado como interactuable

**Soluciones:**
1. Acercarse al objeto
2. Mirar directamente al objeto
3. Verificar que el objeto existe

### **"Objeto muy lejos"**
**Solución:**
- Acercarse al objeto
- El rango máximo es 3 metros

### **Objeto no se mueve**
**Causas:**
- Click no mantenido
- Objeto bloqueado
- Error en el sistema

**Soluciones:**
1. Mantener click izquierdo
2. Verificar que el crosshair esté amarillo
3. Reiniciar el juego si persiste

## 📊 **Información del HUD**

### **Panel de Información:**
```
Vida: 100%
Energía: 100%
Posición: X: 0.0, Y: 1.8, Z: 0.0
Velocidad: 5 m/s
Objetos: 3 | Física: 2

Objeto Interactuable:
Nombre: Couch Small
Distancia: 2.1m
Estado: En rango

Arrastrando:
Objeto: Couch Small
Distancia: 2.1m
Controles: Mover mouse + Scroll
```

## 🎮 **Comandos de Debug**

### **Teclas de Debug:**
- **F1**: Estado del sistema
- **F2**: Forzar inicio de arrastre
- **F3**: Corregir altura de objetos
- **F4**: Resetear posición del jugador

### **Logs de Debug:**
```
🎯 Iniciando arrastre de: Couch Small
🎯 Finalizando arrastre de: Couch Small
❌ No hay objeto interactuable seleccionado
❌ Objeto muy lejos (4.2m > 3m)
```

## 🔄 **Flujo de Arrastre**

### **1. Detección:**
```
updateInteractions() → Raycasting → Encontrar objeto → currentInteractable
```

### **2. Inicio:**
```
mousedown → startObjectDrag() → Verificar distancia → Activar arrastre
```

### **3. Movimiento:**
```
mousemove → updateObjectDrag() → Calcular posición → Aplicar movimiento
```

### **4. Scroll:**
```
wheel → handleObjectScroll() → Ajustar distancia → Reposicionar
```

### **5. Finalización:**
```
mouseup → stopObjectDrag() → Sincronizar → Reactivar física
```

## 🎯 **Optimizaciones**

### **Rendimiento:**
- **Throttling**: Actualizaciones limitadas
- **LOD**: Nivel de detalle adaptativo
- **Culling**: Solo renderizar objetos visibles

### **Precisión:**
- **Raycasting optimizado**: Detección precisa
- **Búsqueda jerárquica**: Encuentra meshes complejos
- **Validación de distancia**: Evita interacciones lejanas

## 🎉 **Conclusión**

El sistema de arrastre proporciona una forma intuitiva y precisa de manipular objetos 3D en el juego. Con feedback visual claro y sincronización multijugador, permite una experiencia fluida de interacción con objetos.

**¡Disfruta arrastrando y reorganizando tu mundo 3D!** 🎮✨ 