// Configuración para diferentes entornos
export const config = {
    // URL del servidor
    serverUrl: import.meta.env.PROD ? window.location.origin : 'http://localhost:3001',
    
    // Configuración del juego
    game: {
        maxPlayers: 20,
        maxObjects: 100,
        physicsEnabled: true,
        shadowsEnabled: true
    },
    
    // Configuración de red
    network: {
        reconnectAttempts: 5,
        reconnectDelay: 2000,
        updateInterval: 100 // ms
    }
}; 