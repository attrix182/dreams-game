# Catálogo de Items - Dreams

## Resumen

Se ha implementado un catálogo modal completo que permite a los usuarios explorar y generar todos los objetos disponibles en el juego Dreams. El catálogo se activa presionando la tecla **"I"** y proporciona una interfaz intuitiva y organizada.

## Características Principales

### 🎯 **Activación Rápida**
- **Tecla "I"**: Abre/cierra el catálogo instantáneamente
- **Tecla "ESC"**: Cierra el catálogo
- **Clic fuera del modal**: Cierra el catálogo

### 📋 **Organización por Categorías**
El catálogo organiza todos los objetos en 8 categorías principales:

#### 🪑 **Muebles (Furniture)**
- Escritorios, mesas, sillas, sofás, estantes, gabinetes
- **Color**: Verde (#4CAF50)
- **Prioridad**: Alta (9-10)

#### 💻 **Tecnología (Technology)**
- Computadoras, monitores, teclados, mouse, teléfonos, impresoras
- **Color**: Azul (#2196F3)
- **Prioridad**: Muy alta (10)

#### 🌿 **Decoración (Decoration)**
- Plantas, arte, trofeos, pizarras, alfombras
- **Color**: Naranja (#FF9800)
- **Prioridad**: Media-alta (5-8)

#### 🍽️ **Alimentos (Food)**
- Tazas, café, sodas, bebidas
- **Color**: Rojo (#F44336)
- **Prioridad**: Media (5-7)

#### 📝 **Papelería (Stationery)**
- Papel, cuadernos, lápices, grapadoras, clipboards
- **Color**: Púrpura (#9C27B0)
- **Prioridad**: Media (4-6)

#### 📦 **Contenedores (Containers)**
- Cajas, basura, maletas, botes
- **Color**: Gris azulado (#607D8B)
- **Prioridad**: Media (5-6)

#### 🎮 **Entretenimiento (Entertainment)**
- Dardos, juguetes, patinetas, Gundam
- **Color**: Rosa (#E91E63)
- **Prioridad**: Baja-media (2-5)

#### 💡 **Iluminación (Lighting)**
- Lámparas, luces, interruptores
- **Color**: Amarillo (#FFC107)
- **Prioridad**: Media (7)

### 🔍 **Sistema de Búsqueda**
- **Búsqueda en tiempo real**: Filtra objetos mientras escribes
- **Búsqueda inteligente**: Encuentra por nombre o palabra clave
- **Filtrado por categoría**: Oculta categorías sin resultados

### 🎨 **Interfaz Visual**
- **Diseño moderno**: Gradientes y efectos visuales atractivos
- **Iconos descriptivos**: Cada objeto tiene su emoji representativo
- **Efectos hover**: Animaciones suaves al pasar el mouse
- **Responsive**: Se adapta a diferentes tamaños de pantalla

### 📊 **Información Detallada**
Cada tarjeta de objeto muestra:
- **Icono del objeto**: Emoji representativo
- **Nombre del objeto**: Nombre legible en español
- **Número de variantes**: Cuántos modelos 3D diferentes hay disponibles
- **Prioridad**: Nivel de prioridad del objeto (1-10)
- **Comando de ejemplo**: Cómo generar el objeto por texto

## Uso del Catálogo

### Abrir el Catálogo
1. **Presiona "I"** en cualquier momento durante el juego
2. El modal aparecerá con todos los objetos organizados

### Navegar por Categorías
1. **Scroll vertical** para ver todas las categorías
2. **Cada categoría** tiene su color distintivo
3. **Contador de items** en cada categoría

### Buscar Objetos
1. **Escribe en la barra de búsqueda** en la parte superior
2. **Los resultados se filtran** en tiempo real
3. **Las categorías se ocultan** si no tienen resultados

### Generar Objetos
1. **Haz clic en cualquier tarjeta** de objeto
2. El catálogo se cerrará automáticamente
3. El objeto se generará en el mundo 3D

## Controles del Catálogo

| Tecla | Acción |
|-------|--------|
| **I** | Abrir/cerrar catálogo (no funciona mientras escribes en chat) |
| **ESC** | Cerrar catálogo |
| **Mouse** | Navegar y seleccionar objetos (cursor libre) |
| **Scroll** | Navegar por categorías |
| **WASD + Espacio** | Bloqueados dentro del modal (no afectan el juego) |

## 🎯 Mejoras de Interacción

### Prevención de Conflictos
- **Detección de input activo**: El catálogo no se abre si estás escribiendo en chat
- **Bloqueo de teclas**: WASD y espacio no afectan el juego cuando el modal está abierto
- **Cursor libre**: Puedes mover el mouse sin afectar la cámara del juego

### Compatibilidad con Chat
- **Chat activo**: Si estás escribiendo en el chat, "I" no abre el catálogo
- **Input de objetos**: Si estás en el menú de generación, "I" no abre el catálogo
- **Cualquier input**: El sistema detecta cualquier campo de texto activo

### Restauración del Estado
- **Al cerrar**: El modal se cierra limpiamente sin afectar el juego
- **Puntero**: El cursor se libera automáticamente al abrir el modal
- **Foco**: El modal recibe el foco para capturar eventos de teclado

## Información en el HUD

El HUD del juego ahora incluye:
- **Indicador del catálogo**: Muestra que se puede presionar "I"
- **Estadísticas de assets**: Número de modelos cargados
- **Estado de multijugador**: Información de conexión

## Ejemplos de Uso

### Búsqueda Rápida
```
Buscar "escritorio" → Muestra todos los escritorios disponibles
Buscar "computadora" → Muestra PCs y monitores
Buscar "planta" → Muestra todas las plantas
```

### Navegación por Categorías
```
Categoría Muebles → Ver todos los muebles de oficina
Categoría Tecnología → Ver equipos tecnológicos
Categoría Decoración → Ver elementos decorativos
```

### Generación Directa
```
Clic en "Escritorio" → Genera un escritorio en el mundo
Clic en "Computadora" → Genera una PC en el mundo
Clic en "Planta" → Genera una planta en el mundo
```

## Beneficios del Sistema

### Para Usuarios
- **Descubrimiento**: Ve todos los objetos disponibles
- **Facilidad**: No necesita recordar comandos exactos
- **Visualización**: Ve iconos y descripciones claras
- **Organización**: Objetos agrupados lógicamente

### Para Desarrolladores
- **Escalabilidad**: Fácil agregar nuevos objetos
- **Mantenibilidad**: Configuración centralizada
- **Flexibilidad**: Sistema de prioridades y categorías
- **Extensibilidad**: Fácil agregar nuevas funcionalidades

## Próximas Mejoras

### Funcionalidades Futuras
1. **Favoritos**: Marcar objetos favoritos
2. **Historial**: Ver objetos generados recientemente
3. **Filtros avanzados**: Por tamaño, complejidad, etc.
4. **Vista previa**: Miniaturas de los modelos 3D
5. **Comandos personalizados**: Crear alias para objetos

### Mejoras de UX
1. **Atajos de teclado**: Navegación con flechas
2. **Búsqueda por voz**: Comandos de voz
3. **Temas visuales**: Diferentes estilos de interfaz
4. **Animaciones**: Transiciones más fluidas

## Archivos Relacionados

- `src/ui/ItemCatalog.js` - Componente principal del catálogo
- `src/config/AssetConfig.js` - Configuración de assets y categorías
- `src/game/Game3D.js` - Integración con el juego principal

El catálogo de items representa una mejora significativa en la experiencia de usuario, proporcionando una forma intuitiva y visual de explorar y generar todos los objetos disponibles en Dreams. 