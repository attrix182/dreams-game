import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { Object3D } from './Object3D.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { RemotePlayer } from './RemotePlayer.js';
import { ChatSystem } from '../ui/ChatSystem.js';

export class Game3D {
    constructor(container) {
        this.container = container;
        
        // Configuración optimizada
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            antialias: false, // Desactivar antialiasing para mejor rendimiento
            shadows: false, // Desactivar sombras para mejor rendimiento
            maxObjects: 50, // Límite de objetos en cliente
            maxPlayers: 20 // Límite de jugadores en cliente
        };
        
        // Escena y renderer
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        
        // Controladores
        this.playerController = null;
        this.networkManager = null;
        
        // Colecciones con límites
        this.objects = new Map();
        this.remotePlayers = new Map();
        
        // Estado del juego
        this.isMultiplayer = false;
        this.lastPositionUpdate = 0;
        this.lastCleanup = Date.now();
        
        // Configurar limpieza automática
        this.setupAutoCleanup();
        
        // Inicializar
        this.init();
    }
    
    setupAutoCleanup() {
        // Limpiar objetos antiguos cada 2 minutos
        setInterval(() => {
            this.cleanupOldObjects();
        }, 2 * 60 * 1000);
        
        // Limpiar jugadores remotos desconectados cada minuto
        setInterval(() => {
            this.cleanupDisconnectedPlayers();
        }, 60 * 1000);
    }
    
    cleanupOldObjects() {
        const now = Date.now();
        const maxAge = 10 * 60 * 1000; // 10 minutos
        
        for (const [objectId, object] of this.objects) {
            if (object.createdAt && now - object.createdAt > maxAge) {
                this.deleteObjectFromNetwork(objectId);
            }
        }
    }
    
    cleanupDisconnectedPlayers() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutos
        
        for (const [playerId, remotePlayer] of this.remotePlayers) {
            if (remotePlayer.lastUpdate && now - remotePlayer.lastUpdate > timeout) {
                this.removeRemotePlayer(playerId);
            }
        }
    }
    
    async init() {
        try {
            
            // Crear escena
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro
            
            // Crear cámara
            this.camera = new THREE.PerspectiveCamera(
                this.config.fov,
                this.config.width / this.config.height,
                this.config.near,
                this.config.far
            );
            
            // Crear renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                canvas: this.container.querySelector('#canvas') // Usar canvas existente
            });
            this.renderer.setSize(this.config.width, this.config.height);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            // No agregar al DOM porque ya existe
            
            // Configurar iluminación
            this.setupLighting();
            
            // Crear suelo
            this.createGround();
            
            // Crear controlador del jugador
            this.playerController = new PlayerController(this.camera, this.scene);
            this.playerController.init();
            
            // Configurar callbacks del controlador
            this.playerController.setFindGameObjectCallback((threeObject) => this.findGameObject(threeObject));
            this.playerController.onInteract = (object) => this.interactWithObject(object);
            this.playerController.onObjectHover = (object) => this.hoverObject(object);
            this.playerController.onObjectLeave = (object) => this.leaveObject(object);
            this.playerController.onGenerateObject = () => this.showQuickGenerateMenu();
            this.playerController.onPlayerMove = (position) => this.onPlayerMove(position);
            this.playerController.onPlayerRotate = (rotation) => this.onPlayerRotate(rotation);
            
            // Configurar eventos de ventana
            this.setupWindowEvents();
            
            // Configurar multijugador
            this.setupMultiplayer();
            
            // Iniciar loop de renderizado
            this.animate();
            
        } catch (error) {
            console.error('❌ Error en init:', error);
            throw error;
        }
    }
    
    setupLighting() {
        // Luz ambiental más brillante
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Más brillante y blanca
        this.scene.add(ambientLight);
        
        // Luz direccional (sol) más intensa
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Más intensa
        directionalLight.position.set(50, 100, 50); // Más alta para mejor iluminación
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Luz adicional desde el frente para mejor visibilidad
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.6);
        frontLight.position.set(0, 50, 100);
        this.scene.add(frontLight);
    }
    
    createGround() {
        // Crear suelo simple y más visible
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90, // Verde más claro y brillante
            side: THREE.DoubleSide // Visible desde ambos lados
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotar para que esté horizontal
        ground.position.y = 0; // Asegurar que esté en Y=0
        ground.receiveShadow = true;
        this.scene.add(ground);
        
    }
    
    setupPlayerControllerCallbacks() {
        // Callback para encontrar objetos del juego
        this.playerController.setFindGameObjectCallback((threeObject) => {
            return this.findGameObject(threeObject);
        });
        
        // Callback para generar objetos
        this.playerController.onGenerateObject = () => {
            this.showQuickGenerateMenu();
        };
        
        // Callback para interacción
        this.playerController.onInteract = (object) => {
        };
    }
    
    setupMultiplayer() {
        try {
            // Inicializar NetworkManager
            this.networkManager = new NetworkManager();
            
            if (this.networkManager) {
                // Configurar eventos de red de forma más robusta
                this.setupNetworkEvents();
                
                // Conectar al servidor
                this.networkManager.connect();
                
                // Crear UI de chat
                this.createChatUI();
            }
        } catch (error) {
            console.error('❌ Error al configurar multijugador:', error);
        }
    }
    
    setupNetworkEvents() {
        // Conexión
        this.networkManager.on('onConnect', () => {
            this.isMultiplayer = true;
            this.updateMultiplayerIndicator();
        });
        
        this.networkManager.on('onDisconnect', () => {
            this.isMultiplayer = false;
            this.updateMultiplayerIndicator();
        });
        
        // Inicialización del juego
        this.networkManager.on('onGameInit', (data) => {
            // Limpiar jugadores remotos existentes
            this.remotePlayers.forEach(player => player.remove());
            this.remotePlayers.clear();
            
            // Cargar jugadores existentes
            data.players.forEach(playerData => {
                if (playerData.id !== this.networkManager.playerId) {
                    this.addRemotePlayer(playerData);
                }
            });
            
            // Cargar objetos existentes
            data.objects.forEach(objData => {
                this.createObjectFromNetwork(objData);
            });
        });
        
        // Nuevos jugadores
        this.networkManager.on('onPlayerJoined', (player) => {
            this.addRemotePlayer(player);
            this.showChatMessage(`👤 ${player.name} se ha unido al juego`);
        });
        
        // Jugadores que se van
        this.networkManager.on('onPlayerLeft', (data) => {
            this.removeRemotePlayer(data.id);
            this.showChatMessage(`👤 ${data.name} se ha desconectado`);
        });
        
        // Movimiento de jugadores
        this.networkManager.on('onPlayerMoved', (data) => {
            this.updateRemotePlayerPosition(data.id, data.position);
        });
        
        this.networkManager.on('onPlayerRotated', (data) => {
            this.updateRemotePlayerRotation(data.id, data.rotation);
        });
        
        // Objetos
        this.networkManager.on('onObjectCreated', (object) => {
            this.createObjectFromNetwork(object);
            this.showChatMessage(`🎨 ${object.name} fue creado`);
        });
        
        this.networkManager.on('onObjectMoved', (data) => {
            this.moveObjectFromNetwork(data);
        });
        
        this.networkManager.on('onObjectDeleted', (data) => {
            this.deleteObjectFromNetwork(data.id);
        });
        
        // Chat
        this.networkManager.on('onChatMessage', (message) => {
            this.showChatMessage(`${message.playerName}: ${message.message}`);
        });
    }
    
    addRemotePlayer(playerData) {
        
        // Verificar que no exista ya
        if (this.remotePlayers.has(playerData.id)) {
            return;
        }
        
        try {
            const remotePlayer = new RemotePlayer(playerData, this.scene);
            this.remotePlayers.set(playerData.id, remotePlayer);
        } catch (error) {
            console.error('❌ Error al agregar jugador remoto:', error);
        }
    }
    
    removeRemotePlayer(playerId) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            try {
                remotePlayer.remove();
                this.remotePlayers.delete(playerId);
            } catch (error) {
                // Error silencioso
            }
        }
    }
    
    updateRemotePlayerPosition(playerId, position) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            try {
                remotePlayer.updatePosition(position);
            } catch (error) {
                // Error silencioso
            }
        }
    }
    
    updateRemotePlayerRotation(playerId, rotation) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            try {
                remotePlayer.updateRotation(rotation);
            } catch (error) {
                // Error silencioso
            }
        }
    }
    
    loadExistingObjects(objectsData) {
        objectsData.forEach(objData => {
            this.createObjectFromNetwork(objData);
        });
    }
    
    loadExistingPlayers(playersData) {
        playersData.forEach(playerData => {
            if (playerData.id !== this.networkManager?.playerId) {
                this.addRemotePlayer(playerData);
            }
        });
    }
    
    async createObjectFromNetwork(objectData) {
        try {
            // Verificar si el objeto ya existe
            if (this.objects.has(objectData.id)) {
                return; // Ya existe, no crear duplicado
            }
            
            const object = new Object3D(objectData);
            await object.create();
            
            // Establecer posición si viene del servidor
            if (objectData.position) {
                object.mesh.position.set(
                    objectData.position.x,
                    objectData.position.y,
                    objectData.position.z
                );
            }
            
            this.objects.set(objectData.id, object);
            this.scene.add(object.mesh);
            
            // Agregar para interacción
            this.playerController.addInteractableObject(object);
        } catch (error) {
            // Error silencioso
        }
    }
    
    moveObjectFromNetwork(data) {
        const object = this.objects.get(data.id);
        if (object && object.mesh) {
            object.mesh.position.set(data.position.x, data.position.y, data.position.z);
            object.mesh.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z);
        }
    }
    
    deleteObjectFromNetwork(objectId) {
        const object = this.objects.get(objectId);
        if (object) {
            this.scene.remove(object.mesh);
            this.playerController.removeInteractableObject(object);
            this.objects.delete(objectId);
        }
    }
    
    setupWindowEvents() {
        window.addEventListener('resize', () => {
            this.config.width = window.innerWidth;
            this.config.height = window.innerHeight;
            
            this.camera.aspect = this.config.width / this.config.height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(this.config.width, this.config.height);
        });
        
        // Comando de debug para la escena
        document.addEventListener('keydown', (event) => {
            if (event.code === 'F5') {
                this.debugScene();
            }
            
            // Comando para mostrar jugadores conectados
            if (event.code === 'F6') {
                this.debugPlayers();
            }
            
            // Comando para debug de conexión multijugador
            if (event.code === 'F7') {
                this.debugMultiplayerConnection();
            }
            
            // Comando para crear jugador de prueba
            if (event.code === 'F8') {
                this.createTestPlayer();
            }
        });
    }
    
    debugScene() {
        // Forzar un renderizado
        this.renderer.render(this.scene, this.camera);
    }
    
    showQuickGenerateMenu() {
        // Crear modal de generación rápida
        const modal = document.createElement('div');
        modal.id = 'quickGenerateModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            min-width: 400px;
            max-width: 600px;
            color: white;
            font-family: Arial, sans-serif;
        `;
        
        modalContent.innerHTML = `
            <h2 style="margin: 0 0 20px 0; text-align: center; font-size: 24px;">
                ✨ Generar Objeto Rápido
            </h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: bold;">
                    Describe el objeto que quieres crear:
                </label>
                <input 
                    type="text" 
                    id="quickObjectInput" 
                    placeholder="Ej: un árbol mágico, una casa flotante, un dragón de fuego..."
                    style="
                        width: 100%;
                        padding: 12px;
                        border: none;
                        border-radius: 8px;
                        background: rgba(255, 255, 255, 0.9);
                        color: #333;
                        font-size: 14px;
                        box-sizing: border-box;
                    "
                    autocomplete="off"
                >
            </div>
            
        
            
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button id="generateBtn" style="
                    padding: 12px 24px;
                    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    flex: 1;
                ">✨ Generar Objeto</button>
                
                <button id="cancelBtn" style="
                    padding: 12px 24px;
                    background: rgba(255, 255, 255, 0.2);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 8px;
                    color: white;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                ">❌ Cancelar</button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Enfocar el input
        const input = document.getElementById('quickObjectInput');
        input.focus();
        
        // Eventos
        const generateBtn = document.getElementById('generateBtn');
        const cancelBtn = document.getElementById('cancelBtn');
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        
        // Botones de sugerencia
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.suggestion;
                input.focus();
            });
            
            // Efectos hover
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.3)';
                btn.style.transform = 'translateY(-2px)';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255, 255, 255, 0.2)';
                btn.style.transform = 'translateY(0)';
            });
        });
        
        // Generar objeto
        generateBtn.addEventListener('click', () => {
            const description = input.value.trim();
            if (description) {
                this.generateObject(description);
                this.closeQuickGenerateMenu();
            }
        });
        
        // Cancelar
        cancelBtn.addEventListener('click', () => {
            this.closeQuickGenerateMenu();
        });
        
        // Enter para generar
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const description = input.value.trim();
                if (description) {
                    this.generateObject(description);
                    this.closeQuickGenerateMenu();
                }
            }
        });
        
        // Escape para cancelar
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeQuickGenerateMenu();
            }
        });
        
        // Efectos hover para botones principales
        generateBtn.addEventListener('mouseenter', () => {
            generateBtn.style.transform = 'translateY(-2px)';
            generateBtn.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        });
        
        generateBtn.addEventListener('mouseleave', () => {
            generateBtn.style.transform = 'translateY(0)';
            generateBtn.style.boxShadow = 'none';
        });
        
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        });
        
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        });
        
        // Bloquear controles del juego
        if (this.playerController) {
            this.playerController.setModalOpen(true);
        }
    }
    
    closeQuickGenerateMenu() {
        const modal = document.getElementById('quickGenerateModal');
        if (modal) {
            modal.remove();
        }
        
        // Desbloquear controles del juego
        if (this.playerController) {
            this.playerController.setModalOpen(false);
        }
    }
    
    async generateObject(description) {
        try {
            // Verificar límite de objetos
            if (this.objects.size >= this.config.maxObjects) {
                this.showChatMessage('⚠️ Límite de objetos alcanzado');
                return;
            }
            
            // Obtener posición del jugador
            const playerPosition = this.playerController.getPosition();
            const cameraDirection = new THREE.Vector3();
            this.camera.getWorldDirection(cameraDirection);
            
            // Posición delante del jugador (a 3 metros de distancia)
            const spawnPosition = playerPosition.clone().add(cameraDirection.multiplyScalar(3));
            spawnPosition.y = 1; // Elevar un poco del suelo
            
            // Crear objeto local
            const objectData = {
                name: description,
                type: 'cube', // Por defecto
                size: 1,
                color: this.generateRandomColor(),
                material: 'basic',
                physics: true,
                position: spawnPosition,
                createdAt: Date.now() // Agregar timestamp
            };
            
            const object = new Object3D(objectData);
            await object.create();
            
            // Establecer la posición calculada
            object.mesh.position.copy(spawnPosition);
            
            this.objects.set(object.getId(), object);
            this.scene.add(object.mesh);
            
            // Agregar para interacción
            this.playerController.addInteractableObject(object);
            
            // Enviar al servidor si estamos en multijugador
            if (this.isMultiplayer) {
                this.networkManager.sendObjectCreate({
                    type: objectData.type,
                    name: objectData.name,
                    position: {
                        x: object.mesh.position.x,
                        y: object.mesh.position.y,
                        z: object.mesh.position.z
                    },
                    rotation: {
                        x: object.mesh.rotation.x,
                        y: object.mesh.rotation.y,
                        z: object.mesh.rotation.z
                    },
                    scale: {
                        x: object.mesh.scale.x,
                        y: object.mesh.scale.y,
                        z: object.mesh.scale.z
                    },
                    material: objectData.material,
                    color: objectData.color,
                    physics: objectData.physics
                });
            }
            
        } catch (error) {
            console.error('❌ Error al generar objeto:', error);
        }
    }
    
    generateRandomColor() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    findGameObject(threeObject) {
        for (const [id, object] of this.objects) {
            if (object.mesh === threeObject) {
                return object;
            }
        }
        return null;
    }
    
    fixAllObjectHeights() {
        for (const [id, object] of this.objects) {
            if (object.adjustHeightForGround) {
                object.adjustHeightForGround();
            }
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = 0.016;
        
        // Actualizar controlador del jugador
        if (this.playerController) {
            this.playerController.update(deltaTime);
        }
        
        // Enviar actualización al servidor cada 100ms
        if (this.isMultiplayer && this.networkManager && this.networkManager.isConnected) {
            const now = Date.now();
            if (!this.lastPositionUpdate || now - this.lastPositionUpdate > 100) {
                const position = this.playerController.getPosition();
                const rotation = this.playerController.getCameraRotation();
                
                // Solo enviar si la posición cambió significativamente
                if (!this.lastSentPosition || 
                    position.distanceTo(this.lastSentPosition) > 0.1 ||
                    Math.abs(rotation.y - this.lastSentRotation?.y) > 0.1) {
                    
                    this.networkManager.sendPlayerMove(position);
                    this.networkManager.sendPlayerRotate(rotation);
                    
                    this.lastSentPosition = position.clone();
                    this.lastSentRotation = { ...rotation };
                }
                
                this.lastPositionUpdate = now;
            }
        }
        
        // Actualizar objetos
        for (const [id, object] of this.objects) {
            if (object.update) {
                object.update(deltaTime);
            }
        }
        
        // Actualizar jugadores remotos
        for (const [id, remotePlayer] of this.remotePlayers) {
            if (remotePlayer.update) {
                remotePlayer.update(deltaTime);
            }
        }
        
        // Actualizar indicador de multijugador
        this.updateMultiplayerIndicator();
        
        // Renderizar escena
        this.renderer.render(this.scene, this.camera);
    }
    
    // Métodos públicos para acceso global
    getPlayerController() {
        return this.playerController;
    }
    
    getNetworkManager() {
        return this.networkManager;
    }
    
    getChatSystem() {
        return this.chatSystem;
    }
    
    isMultiplayerEnabled() {
        return this.isMultiplayer;
    }

    createChatUI() {
        // Crear contenedor de chat
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatContainer';
        chatContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            width: 300px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            overflow-y: auto;
        `;
        
        // Crear área de mensajes
        const messagesArea = document.createElement('div');
        messagesArea.id = 'chatMessages';
        messagesArea.style.cssText = `
            margin-bottom: 10px;
            max-height: 150px;
            overflow-y: auto;
            font-size: 12px;
            line-height: 1.4;
        `;
        
        // Crear input de chat
        const chatInput = document.createElement('input');
        chatInput.id = 'chatInput';
        chatInput.type = 'text';
        chatInput.placeholder = 'Escribe un mensaje...';
        chatInput.style.cssText = `
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.9);
            color: #333;
            font-size: 12px;
        `;
        
        // Evento para enviar mensaje
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.sendChatMessage(chatInput.value.trim());
                chatInput.value = '';
            }
        });
        
        chatContainer.appendChild(messagesArea);
        chatContainer.appendChild(chatInput);
        document.body.appendChild(chatContainer);
        
        // Ocultar chat por defecto
        chatContainer.style.display = 'none';
        
        // Tecla T para abrir chat
        document.addEventListener('keydown', (e) => {
            if ((e.key === 't' || e.key === 'T') && chatContainer.style.display === 'none') {
                chatContainer.style.display = 'block';
                chatInput.focus();
            }
        });
        
        // Escape para cerrar chat
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                chatContainer.style.display = 'none';
                chatInput.blur();
            }
        });
        
        // Enter para enviar mensaje y cerrar chat
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.sendChatMessage(chatInput.value.trim());
                chatInput.value = '';
                chatContainer.style.display = 'none';
                chatInput.blur();
            }
        });
    }
    
    showChatMessage(message) {
        const messagesArea = document.getElementById('chatMessages');
        if (messagesArea) {
            const messageElement = document.createElement('div');
            messageElement.style.cssText = `
                margin-bottom: 5px;
                padding: 5px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
                word-wrap: break-word;
            `;
            messageElement.textContent = message;
            
            messagesArea.appendChild(messageElement);
            messagesArea.scrollTop = messagesArea.scrollHeight;
            
            // Auto-ocultar mensajes después de 5 segundos
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.opacity = '0.5';
                }
            }, 5000);
        }
    }
    
    sendChatMessage(message) {
        if (this.isMultiplayer && this.networkManager) {
            this.networkManager.sendChatMessage(message);
        }
    }

    debugPlayers() {
        // Método de debug sin logs para evitar lag
    }

    debugMultiplayerConnection() {
        // Método de debug sin logs para evitar lag
    }
    
    createTestPlayer() {
        const testPlayerData = {
            id: 'test_player_' + Date.now(),
            name: 'Jugador de Prueba',
            position: { x: 5, y: 1.8, z: 5 },
            rotation: { x: 0, y: 0, z: 0 },
            health: 100,
            energy: 100
        };
        
        try {
            this.addRemotePlayer(testPlayerData);
        } catch (error) {
            // Error silencioso
        }
    }

    createHUD() {
        // Crear HUD básico
        this.hud = document.createElement('div');
        this.hud.id = 'playerHUD';
        this.hud.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 14px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
        `;
        
        // Agregar indicador de multijugador
        this.multiplayerIndicator = document.createElement('div');
        this.multiplayerIndicator.id = 'multiplayerIndicator';
        this.multiplayerIndicator.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            font-size: 12px;
        `;
        this.hud.appendChild(this.multiplayerIndicator);
        
        document.body.appendChild(this.hud);
        
        // Crear crosshair
        this.crosshair = document.createElement('div');
        this.crosshair.id = 'crosshair';
        this.crosshair.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            border: 2px solid white;
            border-radius: 50%;
            z-index: 1000;
            pointer-events: none;
            transition: all 0.2s ease;
        `;
        
        document.body.appendChild(this.crosshair);
        
        // Crear indicador de interacción
        this.interactionIndicator = document.createElement('div');
        this.interactionIndicator.id = 'interactionIndicator';
        this.interactionIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, 50px);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            display: none;
            z-index: 1000;
        `;
        
        document.body.appendChild(this.interactionIndicator);
    }

    updateMultiplayerIndicator() {
        const indicator = document.getElementById('multiplayerIndicator');
        if (indicator) {
            if (this.isMultiplayer && this.networkManager && this.networkManager.isPlayerConnected()) {
                const playerCount = this.networkManager.getPlayerCount();
                const objectCount = this.networkManager.getObjectCount();
                
                indicator.innerHTML = `
                    <div style="color: #00ff00;">🌐 Multijugador Activo</div>
                    <div>👥 Jugadores: ${playerCount}</div>
                    <div>🎨 Objetos: ${objectCount}</div>
                `;
            } else {
                indicator.innerHTML = `
                    <div style="color: #ff0000;">🔌 Modo Local</div>
                    <div>Servidor no disponible</div>
                `;
            }
        }
    }

    onPlayerMove(position) {
        if (this.networkManager && this.networkManager.isConnected) {
            this.networkManager.sendPlayerMove(position);
        }
    }
    
    onPlayerRotate(rotation) {
        if (this.networkManager && this.networkManager.isConnected) {
            this.networkManager.sendPlayerRotate(rotation);
        }
    }

    hoverObject(object) {
        // Función para cuando el mouse está sobre un objeto
        // Por ahora solo para evitar errores
    }
    
    leaveObject(object) {
        // Función para cuando el mouse sale de un objeto
        // Por ahora solo para evitar errores
    }
    
    interactWithObject(object) {
        // Función para interactuar con objetos
        // Por ahora solo para evitar errores
    }
}

// Hacer la instancia globalmente accesible
window.Game3D = Game3D; 