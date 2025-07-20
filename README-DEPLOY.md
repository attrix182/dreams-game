# Dreams 3D - Despliegue en Coolify

## 🐳 Docker Optimizado

Este proyecto está optimizado para despliegue en Coolify con las siguientes características:

### ✅ Optimizaciones de Recursos

- **Límite de memoria**: 512MB máximo
- **Límite de CPU**: 0.5 cores máximo
- **Límite de jugadores**: 20 concurrentes
- **Límite de objetos**: 100 objetos
- **Limpieza automática**: Objetos antiguos se eliminan cada 30 minutos
- **FPS del servidor**: 10 FPS (optimizado para bajo consumo)

### 🚀 Despliegue en Coolify

1. **Crear nuevo proyecto en Coolify**
   - Tipo: Docker Compose
   - Repositorio: Tu repositorio de GitHub/GitLab

2. **Configuración del proyecto**
   ```yaml
   Build Command: npm run build
   Start Command: node server/index.js
   Port: 3001
   ```

3. **Variables de entorno (opcionales)**
   ```env
   NODE_ENV=production
   PORT=3001
   MAX_PLAYERS=20
   MAX_OBJECTS=100
   ```

4. **Recursos recomendados**
   - **RAM**: 512MB - 1GB
   - **CPU**: 0.5 - 1 core
   - **Storage**: 1GB

### 🔧 Comandos útiles

```bash
# Construir imagen localmente
npm run docker:build

# Ejecutar contenedor localmente
npm run docker:run

# Ver logs del contenedor
docker logs dreams-3d

# Ver estadísticas del servidor
curl http://localhost:3001/info
```

### 📊 Monitoreo

- **Health Check**: `GET /health`
- **Información del servidor**: `GET /info`
- **Logs**: Revisar logs de Coolify para monitoreo

### 🛡️ Seguridad

- Usuario no-root en contenedor
- Límites de recursos estrictos
- Timeouts de conexión
- Limpieza automática de recursos

### 🔄 Mantenimiento

- **Reinicio automático**: `unless-stopped`
- **Health checks**: Cada 30 segundos
- **Limpieza de memoria**: Automática
- **Logs rotativos**: Configurados en Coolify

### 📈 Escalabilidad

Para escalar horizontalmente:
1. Aumentar límites de recursos en Coolify
2. Ajustar `MAX_PLAYERS` y `MAX_OBJECTS`
3. Considerar balanceador de carga para múltiples instancias

### 🐛 Troubleshooting

**Problema**: Servidor no inicia
- Verificar puerto 3001 disponible
- Revisar logs de Coolify
- Verificar variables de entorno

**Problema**: Alto consumo de memoria
- Reducir `MAX_PLAYERS` y `MAX_OBJECTS`
- Verificar limpieza automática funcionando
- Revisar logs de memoria

**Problema**: Conexiones perdidas
- Aumentar timeout en configuración
- Verificar health checks
- Revisar logs de red 