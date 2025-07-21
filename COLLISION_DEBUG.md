# 🔍 Debug del Sistema de Colisiones

## 🚨 **Problema: Los objetos siguen atravesándose**

Si los objetos siguen atravesándose, sigue estos pasos para diagnosticar el problema:

## 🔧 **Pasos de Diagnóstico**

### **1. Verificar que el sistema está activo**
```
Presiona F11 para ver el debug de colisiones
```

Deberías ver algo como:
```
🔍 === DEBUG SISTEMA DE COLISIONES ===
📦 Total de objetos: 3
  obj_123: desk - Pos: 5.20, 1.00, 3.40 - Tamaño: 2.50
  obj_124: couch - Pos: 2.10, 1.00, 1.80 - Tamaño: 1.80
  obj_125: chair - Pos: 8.50, 1.00, 4.20 - Tamaño: 1.20
👤 Jugador: 0.00, 1.80, 0.00
🔍 === FIN DEBUG ===
```

### **2. Crear un objeto y verificar logs**
```
Escribe en el chat: "desk"
```

Deberías ver logs como:
```
🔍 Verificando colisiones para: desk
📍 Posición base: 3.00, 1.00, 0.00
📦 Objetos existentes: 2
🔍 Buscando posición libre para spawn (15 intentos)
📍 Intento 1: Posición base
🔍 Verificando colisión en posición: 3.00, 1.00, 0.00
📦 Objetos a verificar: 2
📏 Comparando con obj_123: distancia=2.20m, mínima=2.75m, tamaños=2.50/2.50
✅ Sin colisiones detectadas
✅ Posición base libre encontrada
✅ Posición final: 3.00, 1.00, 0.00
```

### **3. Si no ves estos logs**
**Problema**: El sistema de colisiones no se está ejecutando
**Solución**: Verificar que el código se haya aplicado correctamente

## 🚨 **Problemas Comunes y Soluciones**

### **Problema 1: No se ven logs de colisiones**
**Causa**: El código no se aplicó correctamente
**Solución**: 
1. Recargar la página
2. Verificar que los archivos se guardaron
3. Verificar la consola del navegador

### **Problema 2: Los logs aparecen pero los objetos siguen atravesándose**
**Causa**: Threshold muy bajo o cálculo de tamaño incorrecto
**Solución**:
1. Verificar el tamaño calculado en los logs
2. Si es muy pequeño, el threshold de 1.0m puede no ser suficiente
3. Aumentar el threshold en `checkCollision()`

### **Problema 3: Objetos aparecen muy lejos**
**Causa**: El sistema está siendo demasiado agresivo
**Solución**:
1. Reducir el threshold de 1.0m a 0.5m
2. Reducir el número de intentos de 15 a 10
3. Reducir la distancia incremental

### **Problema 4: Colisiones falsas**
**Causa**: Cálculo de tamaño incorrecto
**Solución**:
1. Verificar los logs de `getObjectSize()`
2. Si el tamaño es 0 o muy pequeño, hay un problema con el BoundingBox
3. Verificar que el mesh tenga geometría válida

## 🔧 **Configuración Ajustable**

### **Threshold de Colisión:**
```javascript
// En checkCollision()
const collisionThreshold = 1.0; // Aumentar para ser más estricto
```

### **Intentos de Spawn:**
```javascript
// En findFreeSpawnPosition()
const maxAttempts = 15; // Reducir si es muy lento
```

### **Distancia Incremental:**
```javascript
// En findFreeSpawnPosition()
const distance = 1.5 + (attempt * 0.8); // Ajustar para más/menos agresivo
```

## 🎯 **Comandos de Debug Disponibles**

### **F11 - Debug de Colisiones**
```
Muestra información de todos los objetos y el jugador
```

### **Logs Automáticos**
```
Se muestran automáticamente al crear objetos
```

### **Logs de Arrastre**
```
Se muestran al arrastrar objetos si hay colisiones
```

## 📊 **Interpretación de Logs**

### **Log de Spawn Exitoso:**
```
🔍 Verificando colisiones para: desk
📍 Posición base: 3.00, 1.00, 0.00
📦 Objetos existentes: 2
✅ Posición final: 3.00, 1.00, 0.00
```

### **Log de Colisión Detectada:**
```
🚫 Colisión detectada: Couch Small (distancia: 0.8m, mínima: 1.2m)
📍 Intento 2: 1,0,0 * 2.3 = 5.30,1.00,0.00
✅ Posición libre encontrada en intento 2
```

### **Log de Posición de Último Recurso:**
```
⚠️ No se encontró posición libre después de todos los intentos
🆘 Usando posición de último recurso: 8.00, 1.00, 5.00
```

## 🎮 **Pruebas Recomendadas**

### **Prueba 1: Crear objetos cerca**
```
1. Crear un "desk"
2. Crear otro "desk" inmediatamente
3. Verificar que el segundo aparezca lejos del primero
```

### **Prueba 2: Arrastrar objetos**
```
1. Crear dos objetos cerca
2. Intentar arrastrar uno sobre el otro
3. Verificar que se bloquee el movimiento
```

### **Prueba 3: Scroll con colisiones**
```
1. Crear un objeto grande
2. Arrastrar un objeto pequeño cerca
3. Usar scroll para acercar
4. Verificar que se bloquee si hay colisión
```

## 🎉 **Conclusión**

Si sigues estos pasos de diagnóstico, deberías poder identificar y resolver el problema de colisiones. Los logs detallados te mostrarán exactamente qué está pasando en cada paso del proceso.

**¡El sistema de colisiones debería funcionar correctamente!** 🔍✨ 