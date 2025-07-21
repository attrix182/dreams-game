# Sistema de Comandos Inteligentes - Dreams 3D

## 🎯 **Descripción General**

El sistema de comandos inteligentes permite crear objetos usando lenguaje natural en español, interpretando automáticamente modificadores como colores, tamaños y materiales.

### **Ejemplo de Uso**
```
"crear couch en color rojo y gigante"
"generar mesa azul pequeña"
"hacer silla verde brillante"
"poner lámpara dorada enorme"
"crear hamburguesa roja gigante"
```

## 🚀 **Comandos Soportados**

### **Acciones Disponibles**
- `crear` - Crear un objeto
- `generar` - Generar un objeto
- `hacer` - Hacer un objeto
- `poner` - Poner un objeto
- `colocar` - Colocar un objeto
- `agregar` - Agregar un objeto
- `añadir` - Añadir un objeto
- `spawn` - Spawnear un objeto
- `spawnear` - Spawnear un objeto

### **Colores Disponibles**

#### **Colores Básicos**
- `rojo/roja` - Color rojo
- `azul/azul` - Color azul
- `verde/verde` - Color verde
- `amarillo/amarilla` - Color amarillo
- `naranja/naranja` - Color naranja
- `morado/morada` - Color morado
- `rosa/rosa` - Color rosa
- `negro/negra` - Color negro
- `blanco/blanca` - Color blanco
- `gris/gris` - Color gris
- `marrón/marrón` - Color marrón
- `café/café` - Color café

#### **Colores Metálicos**
- `dorado/dorada` - Color dorado
- `plateado/plateada` - Color plateado
- `bronce/bronce` - Color bronce

#### **Colores Especiales**
- `transparente` - Objeto transparente
- `invisible` - Objeto casi invisible
- `brillante` - Objeto brillante
- `neón` - Color neón
- `pastel` - Color pastel

### **Tamaños Disponibles**

#### **Tamaños Básicos**
- `muy pequeño/muy pequeña` - x0.3
- `pequeño/pequeña` - x0.5
- `normal/mediano/mediana` - x1.0
- `grande/grande` - x2.0
- `muy grande/muy grande` - x3.0
- `enorme/enorme` - x4.0
- `gigante/gigante` - x5.0
- `masivo/masivo` - x6.0
- `colosal/colosal` - x8.0

#### **Tamaños Específicos**
- `mini` - x0.2
- `micro` - x0.1
- `mega` - x4.0
- `ultra` - x6.0
- `titan` - x10.0

### **Materiales Disponibles**
- `brillante` - Material brillante con emisión
- `opaco` - Material opaco (Lambert)
- `transparente` - Material transparente
- `invisible` - Material casi invisible
- `metálico/metálica` - Material metálico
- `neón` - Material con emisión neón

## 📝 **Ejemplos de Comandos**

### **Comandos Básicos**
```
"crear couch"
"generar mesa"
"hacer silla"
"poner lámpara"
```

### **Comandos con Color**
```
"crear couch rojo"
"generar mesa azul"
"hacer silla verde"
"poner lámpara dorada"
```

### **Comandos con Tamaño**
```
"crear couch gigante"
"generar mesa pequeña"
"hacer silla enorme"
"poner lámpara mini"
```

### **Comandos Combinados**
```
"crear couch rojo gigante"
"generar mesa azul pequeña brillante"
"hacer silla verde enorme metálica"
"poner lámpara dorada transparente"
```

### **Comandos con Frases Naturales**
```
"crear un couch en color rojo y gigante"
"generar una mesa azul que sea pequeña"
"hacer una silla verde brillante y enorme"
"poner una lámpara dorada transparente"
```

## 🔧 **Implementación Técnica**

### **Flujo de Procesamiento**
1. **Entrada**: Usuario escribe comando natural
2. **Parsing**: `CommandParser` analiza el texto
3. **Extracción**: Se identifican acción, objeto, color, tamaño y material
4. **Aplicación**: Se aplican modificadores al objeto base
5. **Creación**: Se genera el objeto con las propiedades especificadas

### **Estructura de Datos**
```javascript
// Comando parseado
{
    action: 'create',
    object: 'couch',
    color: { name: 'rojo', value: 0xff0000 },
    size: { name: 'gigante', value: 5.0 },
    material: { type: 'basic' },
    original: 'crear couch rojo gigante'
}
```

### **Archivos Principales**
- `src/game/CommandParser.js` - Parser de comandos naturales
- `src/game/Game3D.js` - Integración con el sistema de objetos
- `src/game/AssetManager.js` - Manejo de assets 3D

## 🎨 **Características Avanzadas**

### **Detección Inteligente**
- **Flexibilidad**: Acepta variaciones en el orden de las palabras
- **Sinónimos**: Reconoce múltiples formas de decir lo mismo
- **Limpieza**: Ignora palabras comunes como "en", "de", "con", "y"
- **Fallback**: Si no encuentra modificadores, usa valores por defecto

### **Aplicación de Modificadores**
- **Color**: Se aplica directamente al material del objeto
- **Tamaño**: Se multiplica por el tamaño base del objeto
- **Material**: Se cambia el tipo de material y se agregan efectos
- **Efectos**: Se aplican efectos especiales como transparencia o emisión

### **Compatibilidad**
- **Assets 3D**: Funciona con modelos GLB del AssetManager
- **Geometrías Básicas**: Funciona con objetos geométricos básicos
- **Multijugador**: Los modificadores se sincronizan en red
- **Chat**: Se integra con el sistema de chat existente

## 🎮 **Casos de Uso**

### **Creación Rápida**
```
"crear couch" → Sofá normal
"crear couch rojo" → Sofá rojo
"crear couch gigante" → Sofá gigante
"crear couch rojo gigante" → Sofá rojo gigante
```

### **Experimentos Creativos**
```
"crear mesa transparente" → Mesa invisible
"generar lámpara neón brillante" → Lámpara que brilla
"hacer silla dorada metálica" → Silla de oro metálico
"poner hamburguesa roja gigante" → Hamburguesa enorme roja
```

### **Comandos Complejos**
```
"crear un couch muy grande en color azul brillante y transparente"
"generar una mesa pequeña dorada metálica"
"hacer una silla enorme verde neón"
"poner una lámpara colosal roja transparente"
```

## 🔍 **Logs y Debugging**

### **Logs de Parsing**
```
🔍 Comando parseado: {
    original: "crear couch rojo gigante",
    action: "create",
    object: "couch",
    color: { name: "rojo", value: 16711680 },
    size: { name: "gigante", value: 5 },
    material: { type: "basic" }
}
```

### **Logs de Aplicación**
```
🎨 Aplicando color: rojo (ff0000)
📏 Aplicando tamaño: gigante (x5)
🔧 Objeto con modificadores aplicados: { ... }
```

## 🚀 **Próximas Mejoras**

### **Funcionalidades Futuras**
1. **Texturas**: Soporte para texturas específicas
2. **Animaciones**: Comandos para objetos animados
3. **Física**: Modificadores de propiedades físicas
4. **Sonidos**: Objetos con efectos de sonido
5. **Partículas**: Efectos de partículas

### **Mejoras de UX**
1. **Autocompletado**: Sugerencias de comandos
2. **Historial**: Recordar comandos recientes
3. **Favoritos**: Comandos guardados
4. **Templates**: Plantillas de comandos complejos
5. **Voz**: Comandos por voz

### **Optimizaciones**
1. **Cache**: Cachear comandos frecuentes
2. **Compresión**: Reducir tamaño de datos
3. **Validación**: Mejor validación de comandos
4. **Performance**: Optimizar parsing de comandos

El sistema de comandos inteligentes hace que la creación de objetos sea más intuitiva y expresiva, permitiendo a los usuarios describir exactamente lo que quieren crear usando lenguaje natural. 