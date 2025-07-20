export class UIManager {
    constructor() {
        this.elements = {};
        this.onGenerateObject = null;
        this.isInitialized = false;
    }

    init() {
        console.log('🎨 Inicializando gestor de UI...');
        
        this.cacheElements();
        this.setupEventListeners();
        this.setupKeyboardShortcuts();
        
        this.isInitialized = true;
        console.log('✅ Gestor de UI inicializado');
    }

    cacheElements() {
        // Cachear elementos del DOM
        this.elements = {
            objectInput: document.getElementById('objectInput'),
            generateBtn: document.getElementById('generateBtn'),
            loading: document.getElementById('loading'),
            objectInfo: document.getElementById('objectInfo'),
            objectDetails: document.getElementById('objectDetails'),
            instructions: document.getElementById('instructions')
        };
    }

    setupEventListeners() {
        // Evento para generar objeto
        this.elements.generateBtn.addEventListener('click', () => {
            this.handleGenerateObject();
        });

        // Evento para generar con Enter
        this.elements.objectInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                this.handleGenerateObject();
            }
        });

        // Evento para autocompletar
        this.elements.objectInput.addEventListener('input', () => {
            this.handleInputChange();
        });

        // Evento para mostrar sugerencias
        this.elements.objectInput.addEventListener('focus', () => {
            this.showSuggestions();
        });

        // Evento para ocultar sugerencias
        this.elements.objectInput.addEventListener('blur', () => {
            setTimeout(() => this.hideSuggestions(), 200);
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + Enter para generar objeto
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                event.preventDefault();
                this.handleGenerateObject();
            }

            // Escape para limpiar input
            if (event.key === 'Escape') {
                this.clearInput();
            }

            // Ctrl/Cmd + K para enfocar input
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                this.focusInput();
            }
        });
    }

    handleGenerateObject() {
        const description = this.elements.objectInput.value.trim();
        
        if (!description) {
            this.showError('Por favor, describe el objeto que quieres crear');
            return;
        }

        if (description.length < 3) {
            this.showError('La descripción debe tener al menos 3 caracteres');
            return;
        }

        if (this.onGenerateObject) {
            this.onGenerateObject(description);
        }
    }

    handleInputChange() {
        const description = this.elements.objectInput.value.trim();
        
        // Habilitar/deshabilitar botón según contenido
        this.elements.generateBtn.disabled = description.length < 3;
        
        // Actualizar sugerencias en tiempo real
        this.updateSuggestions(description);
    }

    showSuggestions() {
        this.createSuggestionsPanel();
        this.updateSuggestions(this.elements.objectInput.value.trim());
    }

    hideSuggestions() {
        const suggestionsPanel = document.getElementById('suggestionsPanel');
        if (suggestionsPanel) {
            suggestionsPanel.remove();
        }
    }

    createSuggestionsPanel() {
        // Remover panel existente
        this.hideSuggestions();

        // Crear nuevo panel
        const suggestionsPanel = document.createElement('div');
        suggestionsPanel.id = 'suggestionsPanel';
        suggestionsPanel.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            border-radius: 5px;
            margin-top: 5px;
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            backdrop-filter: blur(10px);
        `;

        this.elements.objectInput.parentNode.style.position = 'relative';
        this.elements.objectInput.parentNode.appendChild(suggestionsPanel);
    }

    updateSuggestions(query) {
        const suggestionsPanel = document.getElementById('suggestionsPanel');
        if (!suggestionsPanel) return;

        const suggestions = this.getSuggestions(query);
        
        suggestionsPanel.innerHTML = suggestions.map(suggestion => `
            <div class="suggestion-item" data-suggestion="${suggestion}">
                ${suggestion}
            </div>
        `).join('');

        // Agregar estilos para los elementos de sugerencia
        const style = document.createElement('style');
        style.textContent = `
            .suggestion-item {
                padding: 10px 15px;
                color: white;
                cursor: pointer;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                transition: background 0.2s ease;
            }
            .suggestion-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            .suggestion-item:last-child {
                border-bottom: none;
            }
        `;
        document.head.appendChild(style);

        // Agregar eventos a las sugerencias
        suggestionsPanel.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                this.elements.objectInput.value = item.dataset.suggestion;
                this.hideSuggestions();
                this.handleGenerateObject();
            });
        });
    }

    getSuggestions(query) {
        const allSuggestions = [
            // NATURALEZA
            'un árbol mágico brillante', 'una flor de cristal flotante', 'una roca mágica resplandeciente',
            'una cascada de agua cristalina', 'un árbol de fuego', 'una planta musical',
            
            // CONSTRUCCIONES
            'una casa flotante de cristal', 'una torre medieval dorada', 'un puente levadizo mágico',
            'una ventana transparente brillante', 'un castillo de hielo', 'una fortaleza de piedra',
            
            // VEHÍCULOS
            'un coche deportivo futurista', 'un avión de cristal flotante', 'un barco mágico resplandeciente',
            'una nave espacial brillante', 'un tren volador', 'una bicicleta mágica',
            
            // ANIMALES
            'un dragón de hielo gigante', 'un unicornio dorado mágico', 'un pájaro de fuego brillante',
            'un pez de cristal flotante', 'un gato mágico', 'un perro robot',
            
            // OBJETOS MÁGICOS
            'un cristal mágico resplandeciente', 'una varita mágica brillante', 'una poción de colores',
            'un orbe de poder flotante', 'un grimorio encantado', 'un portal dimensional',
            
            // MUEBLES
            'una silla de cristal elegante', 'una mesa flotante mágica', 'una lámpara brillante',
            'un trono dorado real', 'una cama de nubes', 'un armario mágico',
            
            // INSTRUMENTOS
            'un piano mágico flotante', 'una guitarra de cristal', 'un tambor brillante',
            'una flauta dorada', 'un violín mágico', 'una batería de fuego',
            
            // HERRAMIENTAS
            'un martillo mágico', 'una espada de fuego', 'una sierra brillante',
            'un taladro futurista', 'un hacha de hielo', 'una daga de cristal',
            
            // TECNOLOGÍA
            'una computadora holográfica', 'un robot de cristal', 'una pantalla flotante',
            'una consola mágica', 'un dron autónomo', 'un smartphone del futuro',
            
            // FORMAS GEOMÉTRICAS
            'una esfera dorada rotativa', 'un cubo transparente flotante', 'un cilindro metálico brillante',
            'un cono de fuego mágico', 'un toro de cristal resplandeciente', 'una pirámide dorada',
            
            // ELEMENTOS NATURALES
            'un fuego mágico eterno', 'un cristal de hielo brillante', 'una nube flotante mágica',
            'un rayo de electricidad', 'una tormenta de cristal', 'un viento mágico',
            
            // OBJETOS DECORATIVOS
            'una estatua de mármol', 'un cuadro mágico flotante', 'un espejo de cristal',
            'un reloj dorado', 'una escultura de hielo', 'un monumento mágico',
            
            // OBJETOS MISCELÁNEOS
            'un globo mágico flotante', 'un paraguas de cristal', 'una bandera brillante',
            'un libro mágico', 'un teléfono futurista', 'una bolsa de tela mágica',
            'un sombrero dorado', 'un zapato de cristal', 'una llave mágica', 'un reloj de arena',
        
            'una criatura mágica dorada',
            'un instrumento musical flotante',
            'una fuente de agua cristalina'
        ];

        if (!query) return allSuggestions.slice(0, 5);

        return allSuggestions
            .filter(suggestion => 
                suggestion.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 5);
    }

    setLoading(isLoading) {
        if (isLoading) {
            this.elements.generateBtn.disabled = true;
            this.elements.generateBtn.textContent = '🤖 Generando...';
            this.elements.loading.style.display = 'block';
        } else {
            this.elements.generateBtn.disabled = false;
            this.elements.generateBtn.textContent = '✨ Generar Objeto';
            this.elements.loading.style.display = 'none';
        }
    }

    showObjectInfo(object) {
        if (!object) return;

        const data = object.getData();
        const position = object.getPosition();
        const rotation = object.getRotation();
        const scale = object.getScale();

        this.elements.objectDetails.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Nombre:</strong> ${data.name}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Descripción:</strong> ${data.description}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Tipo:</strong> ${data.type}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Color:</strong> ${data.color || 'Aleatorio'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Material:</strong> ${data.material || 'Por defecto'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Efectos:</strong> ${data.effects.length > 0 ? data.effects.join(', ') : 'Ninguno'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Posición:</strong> X: ${position.x.toFixed(2)}, Y: ${position.y.toFixed(2)}, Z: ${position.z.toFixed(2)}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Rotación:</strong> X: ${(rotation.x * 180 / Math.PI).toFixed(1)}°, Y: ${(rotation.y * 180 / Math.PI).toFixed(1)}°, Z: ${(rotation.z * 180 / Math.PI).toFixed(1)}°
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Escala:</strong> X: ${scale.x.toFixed(2)}, Y: ${scale.y.toFixed(2)}, Z: ${scale.z.toFixed(2)}
            </div>
            <div style="margin-top: 15px;">
                <button onclick="window.game?.removeSelectedObject()" style="
                    background: #ff4757;
                    color: white;
                    border: none;
                    padding: 8px 12px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                ">🗑️ Eliminar</button>
            </div>
        `;

        this.elements.objectInfo.style.display = 'block';
    }

    hideObjectInfo() {
        this.elements.objectInfo.style.display = 'none';
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
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    showSuccess(message) {
        // Crear notificación de éxito
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ed573;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            font-family: Arial, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    clearInput() {
        this.elements.objectInput.value = '';
        this.elements.generateBtn.disabled = true;
        this.hideSuggestions();
    }

    focusInput() {
        this.elements.objectInput.focus();
    }

    // Métodos de utilidad
    getInputValue() {
        return this.elements.objectInput.value.trim();
    }

    setInputValue(value) {
        this.elements.objectInput.value = value;
        this.handleInputChange();
    }

    isInputFocused() {
        return document.activeElement === this.elements.objectInput;
    }

    // Método para mostrar estadísticas del juego
    showGameStats(stats) {
        const statsPanel = document.createElement('div');
        statsPanel.id = 'gameStats';
        statsPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            font-size: 12px;
            z-index: 100;
        `;

        statsPanel.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #ff6b6b;">📊 Estadísticas</h4>
            <div>Objetos creados: ${stats.objectsCreated || 0}</div>
            <div>Objetos activos: ${stats.activeObjects || 0}</div>
            <div>Tiempo de juego: ${stats.playTime || '0:00'}</div>
        `;

        document.body.appendChild(statsPanel);
    }

    // Método para mostrar tutorial
    showTutorial() {
        const tutorial = document.createElement('div');
        tutorial.id = 'tutorial';
        tutorial.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(15px);
            z-index: 1000;
            max-width: 500px;
            text-align: center;
        `;

        tutorial.innerHTML = `
            <h2 style="color: #ff6b6b; margin-bottom: 20px;">🎮 Tutorial - Dreams 3D</h2>
            <div style="text-align: left; line-height: 1.6;">
                <p><strong>1. Crear objetos:</strong> Escribe una descripción y presiona "Generar Objeto"</p>
                <p><strong>2. Seleccionar:</strong> Haz click en cualquier objeto para seleccionarlo</p>
                <p><strong>3. Mover:</strong> Arrastra objetos seleccionados para moverlos</p>
                <p><strong>4. Cámara:</strong> Usa el click derecho + arrastrar para rotar la vista</p>
                <p><strong>5. Zoom:</strong> Usa la rueda del mouse para hacer zoom</p>
                <p><strong>6. Deseleccionar:</strong> Presiona Escape o click en espacio vacío</p>
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                cursor: pointer;
                margin-top: 20px;
                font-size: 16px;
            ">¡Entendido!</button>
        `;

        document.body.appendChild(tutorial);
    }

    // Método para mostrar atajos de teclado
    showKeyboardShortcuts() {
        const shortcuts = document.createElement('div');
        shortcuts.id = 'keyboardShortcuts';
        shortcuts.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            color: white;
            padding: 30px;
            border-radius: 15px;
            backdrop-filter: blur(15px);
            z-index: 1000;
            max-width: 400px;
        `;

        shortcuts.innerHTML = `
            <h3 style="color: #ff6b6b; margin-bottom: 20px;">⌨️ Atajos de Teclado</h3>
            <div style="text-align: left; line-height: 1.8;">
                <div><strong>Ctrl/Cmd + Enter:</strong> Generar objeto</div>
                <div><strong>Ctrl/Cmd + K:</strong> Enfocar input</div>
                <div><strong>Escape:</strong> Deseleccionar / Limpiar input</div>
                <div><strong>Enter:</strong> Generar objeto (desde input)</div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: #ff6b6b;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 20px;
            ">Cerrar</button>
        `;

        document.body.appendChild(shortcuts);
    }
} 