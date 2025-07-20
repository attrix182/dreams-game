import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameServer } from './GameServer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Permitir cualquier origen en producción
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde la carpeta dist
app.use(express.static(path.join(__dirname, '../dist')));

// Ruta para servir index.html en cualquier ruta (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Crear instancia del servidor de juego
const gameServer = new GameServer(io);

// Rutas API
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        players: gameServer.getPlayerCount(),
        objects: gameServer.getObjectCount(),
        uptime: process.uptime()
    });
});

// Health check endpoint para Docker
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        players: gameServer.getPlayerCount(),
        objects: gameServer.getObjectCount()
    });
});

// Endpoint de información del servidor
app.get('/info', (req, res) => {
    res.json({
        name: 'Dreams 3D Multiplayer',
        version: '1.0.0',
        players: gameServer.getPlayerCount(),
        objects: gameServer.getObjectCount(),
        maxPlayers: gameServer.worldConfig.maxPlayers,
        maxObjects: gameServer.worldConfig.maxObjects
    });
});

// Manejo de conexiones WebSocket
io.on('connection', (socket) => {
    // Registrar jugador
    gameServer.addPlayer(socket);
    
    // Manejar desconexión
    socket.on('disconnect', () => {
        gameServer.removePlayer(socket.id);
    });
    
    // Manejar eventos del juego
    socket.on('player:move', (data) => {
        gameServer.updatePlayerPosition(socket, data);
    });
    
    socket.on('player:rotate', (data) => {
        gameServer.updatePlayerRotation(socket, data);
    });
    
    socket.on('object:create', (data) => {
        gameServer.createObject(socket, data);
    });
    
    socket.on('object:move', (data) => {
        gameServer.moveObject(socket, data);
    });
    
    socket.on('object:delete', (data) => {
        gameServer.deleteObject(socket, data);
    });
    
    socket.on('objects:clear', () => {
        gameServer.clearAllObjects(socket);
    });
    
    socket.on('chat:message', (data) => {
        gameServer.broadcastChat(socket.id, data);
    });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor multijugador iniciado en puerto ${PORT}`);
    console.log(`📊 Panel de estado: http://localhost:${PORT}/api/status`);
    console.log(`🎮 Cliente: http://localhost:${PORT}`);
    console.log(`🌐 Modo: ${process.env.NODE_ENV || 'development'}`);
}); 