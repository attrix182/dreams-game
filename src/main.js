import { Game3D } from './game/Game3D.js';

class Dreams3DGame {
    constructor() {
        this.game = null;
        this.isInitialized = false;
    }

    async init() {
        try {
            // Obtener el contenedor del juego
            const container = document.getElementById('gameContainer');
            if (!container) {
                throw new Error('No se encontró el contenedor del juego');
            }
            
            // Inicializar el juego 3D
            this.game = new Game3D(container);
            
            // Configurar event listeners del UI original
            this.setupUIEvents();
            
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Error al inicializar Dreams 3D:', error);
            this.showError('Error al inicializar el juego: ' + error.message);
        }
    }
    
    setupUIEvents() {
        const generateBtn = document.getElementById('uiGenerateBtn');
        const objectInput = document.getElementById('uiObjectInput');
        
        if (generateBtn && objectInput) {
            generateBtn.addEventListener('click', () => {
                const description = objectInput.value.trim();
                if (description && this.game) {
                    this.game.generateObject(description);
                    objectInput.value = '';
                }
            });
            
            objectInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const description = objectInput.value.trim();
                    if (description && this.game) {
                        this.game.generateObject(description);
                        objectInput.value = '';
                    }
                }
            });
        }
    }

    showError(message) {
        // Crear notificación de error
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);
    }
}

// Agregar estilos para las animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Inicializar el juego cuando se carga la página
window.addEventListener('DOMContentLoaded', () => {
    const game = new Dreams3DGame();
    game.init();
});

// Exportar para uso global
window.Dreams3DGame = Dreams3DGame; 