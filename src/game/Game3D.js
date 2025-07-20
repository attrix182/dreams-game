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
        
        // DESACTIVAR TEMPORALMENTE: Limpiar jugadores remotos desconectados cada minuto
        // setInterval(() => {
        //     this.cleanupDisconnectedPlayers();
        // }, 60 * 1000);
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
            this.playerController.onClearAllObjects = () => this.clearAllObjects();
            
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
        
        // Callback para limpiar todos los objetos
        this.playerController.onClearAllObjects = () => {
            console.log('🔍 Callback onClearAllObjects ejecutado en Game3D');
            this.clearAllObjects();
        };
        
        // Callback para interacción
        this.playerController.onInteract = (object) => {
        };
        
        // Callback para movimiento de objetos
        this.playerController.onObjectMove = (objectId, position, rotation) => {
            this.onObjectMove(objectId, position, rotation);
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
        
        this.networkManager.on('onConnectError', (error) => {
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
            console.log('🎨 Evento onObjectCreated recibido:', object);
            this.createObjectFromNetwork(object);
            this.showChatMessage(`🎨 ${object.name} fue creado`);
        });
        
        this.networkManager.on('onObjectMoved', (data) => {
            console.log('🎨 Evento onObjectMoved recibido:', data);
            this.moveObjectFromNetwork(data);
        });
        
        this.networkManager.on('onObjectDeleted', (data) => {
            console.log('🎨 Evento onObjectDeleted recibido:', data);
            this.deleteObjectFromNetwork(data.id);
        });
        
        this.networkManager.on('onObjectsCleared', () => {
            console.log('🧹 Evento onObjectsCleared recibido');
            this.clearAllObjectsFromNetwork();
        });
        
        // Chat
        this.networkManager.on('onChatMessage', (message) => {
            this.showChatMessage(`${message.playerName}: ${message.message}`);
        });
        
        // Estado del mundo
        this.networkManager.on('onWorldState', (state) => {
            this.syncWorldState(state);
        });
        
        // Errores
        this.networkManager.on('onError', (error) => {
            this.showChatMessage(`❌ Error de red: ${error.message}`);
        });
    }
    
    addRemotePlayer(playerData) {
        console.log('🎮 addRemotePlayer llamado con:', playerData);
        
        // Verificar que no exista ya
        if (this.remotePlayers.has(playerData.id)) {
            console.log('⚠️ Jugador ya existe:', playerData.name);
            return;
        }
        
        try {
            console.log('🎮 Creando RemotePlayer para:', playerData.name);
            const remotePlayer = new RemotePlayer(playerData, this.scene);
            this.remotePlayers.set(playerData.id, remotePlayer);
            console.log('✅ RemotePlayer creado exitosamente. Total jugadores:', this.remotePlayers.size);
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
                console.error('❌ Error al actualizar posición de jugador:', error);
            }
        } else {
            console.log('⚠️ Jugador no encontrado para actualizar posición:', playerId);
        }
    }
    
    updateRemotePlayerRotation(playerId, rotation) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            try {
                remotePlayer.updateRotation(rotation);
            } catch (error) {
                console.error('❌ Error al actualizar rotación de jugador:', error);
            }
        } else {
            console.log('⚠️ Jugador no encontrado para actualizar rotación:', playerId);
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
            
            console.log('🎨 Creando objeto desde red:', objectData);
            
            // Crear datos del objeto basados en la información del servidor
            const analysis = {
                type: objectData.type || 'cube',
                size: { 
                    x: objectData.scale?.x || 1, 
                    y: objectData.scale?.y || 1, 
                    z: objectData.scale?.z || 1 
                },
                color: objectData.color || this.generateRandomColor(),
                material: objectData.material || 'basic',
                effects: []
            };
            
            // Crear el mesh usando el mismo sistema que generateObject
            const mesh = this.createMeshFromData(analysis);
            
            // Establecer posición si viene del servidor
            if (objectData.position) {
                mesh.position.set(
                    objectData.position.x,
                    objectData.position.y,
                    objectData.position.z
                );
            }
            
            // Establecer rotación si viene del servidor
            if (objectData.rotation) {
                mesh.rotation.set(
                    objectData.rotation.x,
                    objectData.rotation.y,
                    objectData.rotation.z
                );
            }
            
            // Establecer escala si viene del servidor
            if (objectData.scale) {
                mesh.scale.set(
                    objectData.scale.x,
                    objectData.scale.y,
                    objectData.scale.z
                );
            }
            
            // Agregar identificador
            mesh.userData = {
                isGameObject: true,
                objectId: objectData.id,
                name: objectData.name,
                type: objectData.type || 'cube',
                isFromNetwork: true,
                createdAt: Date.now()
            };
            
            // Agregar a la escena
            this.scene.add(mesh);
            
            // Crear objeto simple para tracking
            const simpleObject = {
                id: objectData.id,
                name: objectData.name,
                mesh: mesh,
                position: mesh.position,
                createdAt: Date.now(),
                getId: () => objectData.id,
                getPosition: () => mesh.position,
                setPosition: (x, y, z) => mesh.position.set(x, y, z)
            };
            
            this.objects.set(objectData.id, simpleObject);
            
            // Agregar para interacción
            this.playerController.addInteractableObject(simpleObject);
            
            console.log('✅ Objeto creado desde red exitosamente:', objectData.name);
            
        } catch (error) {
            console.error('❌ Error al crear objeto desde red:', error);
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
    
    clearAllObjectsFromNetwork() {
        console.log('🧹 Limpiando objetos desde red...');
        
        // Remover todos los objetos de la escena
        for (const [id, object] of this.objects) {
            if (object.mesh) {
                this.scene.remove(object.mesh);
                this.playerController.removeInteractableObject(object);
            }
        }
        
        // Limpiar el mapa de objetos
        this.objects.clear();
        
        this.showChatMessage('🧹 Todos los objetos fueron limpiados');
    }
    
    syncWorldState(state) {
        // Sincronizar jugadores
        const currentPlayerIds = new Set(this.remotePlayers.keys());
        const serverPlayerIds = new Set(state.players.map(p => p.id));
        
        // Remover jugadores que ya no están en el servidor
        for (const playerId of currentPlayerIds) {
            if (!serverPlayerIds.has(playerId) && playerId !== this.networkManager?.playerId) {
                this.removeRemotePlayer(playerId);
            }
        }
        
        // Agregar/actualizar jugadores del servidor
        state.players.forEach(playerData => {
            if (playerData.id !== this.networkManager?.playerId) {
                if (this.remotePlayers.has(playerData.id)) {
                    // Actualizar posición existente
                    this.updateRemotePlayerPosition(playerData.id, playerData.position);
                    this.updateRemotePlayerRotation(playerData.id, playerData.rotation);
                } else {
                    // Agregar nuevo jugador
                    this.addRemotePlayer(playerData);
                }
            }
        });
        
        // Sincronizar objetos
        const currentObjectIds = new Set(this.objects.keys());
        const serverObjectIds = new Set(state.objects.map(o => o.id));
        
        // Remover objetos que ya no están en el servidor
        for (const objectId of currentObjectIds) {
            if (!serverObjectIds.has(objectId)) {
                this.deleteObjectFromNetwork(objectId);
            }
        }
        
        // Agregar/actualizar objetos del servidor
        state.objects.forEach(objectData => {
            if (this.objects.has(objectData.id)) {
                // Actualizar objeto existente
                this.moveObjectFromNetwork({
                    id: objectData.id,
                    position: objectData.position,
                    rotation: objectData.rotation
                });
            } else {
                // Crear nuevo objeto
                this.createObjectFromNetwork(objectData);
            }
        });
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
            
            // Analizar la descripción para determinar el tipo de objeto
            const objectData = this.analyzeAndCreateObject(description, spawnPosition);
            
            // Crear el objeto en la escena
            const mesh = this.createMeshFromData(objectData);
            mesh.position.copy(spawnPosition);
            
            // Agregar identificador
            const objectId = 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            mesh.userData = {
                isGameObject: true,
                objectId: objectId,
                name: description,
                type: objectData.type,
                createdAt: Date.now()
            };
            
            // Agregar a la escena
            this.scene.add(mesh);
            
            // Crear objeto simple para tracking
            const simpleObject = {
                id: objectId,
                name: description,
                mesh: mesh,
                position: spawnPosition,
                createdAt: Date.now(),
                getId: () => objectId,
                getPosition: () => mesh.position,
                setPosition: (x, y, z) => mesh.position.set(x, y, z)
            };
            
            this.objects.set(objectId, simpleObject);
            
            // Agregar para interacción
            this.playerController.addInteractableObject(simpleObject);
            
            // Enviar al servidor si estamos en multijugador
            if (this.isMultiplayer && this.networkManager && this.networkManager.isConnected) {
                this.networkManager.sendObjectCreate({
                    type: objectData.type,
                    name: description,
                    position: {
                        x: mesh.position.x,
                        y: mesh.position.y,
                        z: mesh.position.z
                    },
                    rotation: {
                        x: mesh.rotation.x,
                        y: mesh.rotation.y,
                        z: mesh.rotation.z
                    },
                    scale: {
                        x: mesh.scale.x,
                        y: mesh.scale.y,
                        z: mesh.scale.z
                    },
                    material: objectData.material,
                    color: objectData.color,
                    physics: true
                });
            }
            
            this.showChatMessage(`🎨 Creado: ${description}`);
            
        } catch (error) {
            console.error('❌ Error al generar objeto:', error);
            this.showChatMessage('❌ Error al crear objeto');
        }
    }
    
    clearAllObjects() {
        try {
            console.log('🧹 Limpiando todos los objetos...');
            
            // Contar objetos antes de limpiar
            const objectCount = this.objects.size;
            
            // Remover todos los objetos de la escena
            for (const [id, object] of this.objects) {
                if (object.mesh) {
                    this.scene.remove(object.mesh);
                    this.playerController.removeInteractableObject(object);
                }
            }
            
            // Limpiar el mapa de objetos
            this.objects.clear();
            
            // Enviar evento al servidor si estamos en multijugador
            if (this.isMultiplayer && this.networkManager && this.networkManager.isConnected) {
                this.networkManager.sendClearAllObjects();
            }
            
            this.showChatMessage(`🧹 Limpiados ${objectCount} objetos`);
            console.log(`✅ Limpiados ${objectCount} objetos exitosamente`);
            
        } catch (error) {
            console.error('❌ Error al limpiar objetos:', error);
            this.showChatMessage('❌ Error al limpiar objetos');
        }
    }
    
    analyzeAndCreateObject(description, position) {
        const lowerDesc = description.toLowerCase();
        
        // Análisis básico de la descripción
        const analysis = {
            type: 'cube',
            size: { x: 1, y: 1, z: 1 },
            color: this.generateRandomColor(),
            material: 'basic',
            effects: []
        };
        
        // Detectar tipo de objeto basado en palabras clave
        if (lowerDesc.includes('esfera') || lowerDesc.includes('sphere') || lowerDesc.includes('bola') || lowerDesc.includes('ball')) {
            analysis.type = 'sphere';
        } else if (lowerDesc.includes('cilindro') || lowerDesc.includes('cylinder') || lowerDesc.includes('tubo') || lowerDesc.includes('tube')) {
            analysis.type = 'cylinder';
        } else if (lowerDesc.includes('cono') || lowerDesc.includes('cone') || lowerDesc.includes('pirámide') || lowerDesc.includes('pyramid')) {
            analysis.type = 'cone';
        } else if (lowerDesc.includes('toro') || lowerDesc.includes('torus') || lowerDesc.includes('donut') || lowerDesc.includes('anillo')) {
            analysis.type = 'torus';
        } else if (lowerDesc.includes('árbol') || lowerDesc.includes('tree') || lowerDesc.includes('planta')) {
            analysis.type = 'tree';
        } else if (lowerDesc.includes('casa') || lowerDesc.includes('house') || lowerDesc.includes('edificio')) {
            analysis.type = 'house';
        } else if (lowerDesc.includes('coche') || lowerDesc.includes('car') || lowerDesc.includes('auto')) {
            analysis.type = 'car';
        } else if (lowerDesc.includes('dragón') || lowerDesc.includes('dragon')) {
            analysis.type = 'dragon';
        } else if (lowerDesc.includes('cristal') || lowerDesc.includes('crystal')) {
            analysis.type = 'crystal';
        } else if (lowerDesc.includes('flor') || lowerDesc.includes('flower')) {
            analysis.type = 'flower';
        } else if (lowerDesc.includes('roca') || lowerDesc.includes('rock') || lowerDesc.includes('piedra')) {
            analysis.type = 'rock';
        } else if (lowerDesc.includes('robot') || lowerDesc.includes('androide')) {
            analysis.type = 'robot';
        } else if (lowerDesc.includes('nave') || lowerDesc.includes('spaceship') || lowerDesc.includes('cohete')) {
            analysis.type = 'spaceship';
        } else if (lowerDesc.includes('castillo') || lowerDesc.includes('castle')) {
            analysis.type = 'castle';
        } else if (lowerDesc.includes('puente') || lowerDesc.includes('bridge')) {
            analysis.type = 'bridge';
        } else if (lowerDesc.includes('torre') || lowerDesc.includes('tower')) {
            analysis.type = 'tower';
        } else if (lowerDesc.includes('fuego') || lowerDesc.includes('fire') || lowerDesc.includes('llama')) {
            analysis.type = 'fire';
        } else if (lowerDesc.includes('hielo') || lowerDesc.includes('ice') || lowerDesc.includes('nieve')) {
            analysis.type = 'ice';
        } else if (lowerDesc.includes('agua') || lowerDesc.includes('water') || lowerDesc.includes('río')) {
            analysis.type = 'water';
        }
        
        // Detectar tamaño
        if (lowerDesc.includes('grande') || lowerDesc.includes('big') || lowerDesc.includes('enorme')) {
            analysis.size = { x: 2, y: 2, z: 2 };
        } else if (lowerDesc.includes('pequeño') || lowerDesc.includes('small') || lowerDesc.includes('mini')) {
            analysis.size = { x: 0.5, y: 0.5, z: 0.5 };
        } else if (lowerDesc.includes('gigante') || lowerDesc.includes('huge')) {
            analysis.size = { x: 3, y: 3, z: 3 };
        }
        
        // Detectar color
        if (lowerDesc.includes('rojo') || lowerDesc.includes('red')) {
            analysis.color = 0xff0000;
        } else if (lowerDesc.includes('azul') || lowerDesc.includes('blue')) {
            analysis.color = 0x0000ff;
        } else if (lowerDesc.includes('verde') || lowerDesc.includes('green')) {
            analysis.color = 0x00ff00;
        } else if (lowerDesc.includes('amarillo') || lowerDesc.includes('yellow')) {
            analysis.color = 0xffff00;
        } else if (lowerDesc.includes('naranja') || lowerDesc.includes('orange')) {
            analysis.color = 0xff8000;
        } else if (lowerDesc.includes('morado') || lowerDesc.includes('purple')) {
            analysis.color = 0x8000ff;
        } else if (lowerDesc.includes('rosa') || lowerDesc.includes('pink')) {
            analysis.color = 0xff80ff;
        } else if (lowerDesc.includes('marrón') || lowerDesc.includes('brown')) {
            analysis.color = 0x8b4513;
        } else if (lowerDesc.includes('negro') || lowerDesc.includes('black')) {
            analysis.color = 0x000000;
        } else if (lowerDesc.includes('blanco') || lowerDesc.includes('white')) {
            analysis.color = 0xffffff;
        } else if (lowerDesc.includes('gris') || lowerDesc.includes('gray')) {
            analysis.color = 0x808080;
        } else if (lowerDesc.includes('dorado') || lowerDesc.includes('gold')) {
            analysis.color = 0xffd700;
        } else if (lowerDesc.includes('plateado') || lowerDesc.includes('silver')) {
            analysis.color = 0xc0c0c0;
        } else if (lowerDesc.includes('turquesa') || lowerDesc.includes('turquoise')) {
            analysis.color = 0x40e0d0;
        }
        
        // Detectar material
        if (lowerDesc.includes('transparente') || lowerDesc.includes('transparent')) {
            analysis.material = 'transparent';
        } else if (lowerDesc.includes('brillante') || lowerDesc.includes('shiny')) {
            analysis.material = 'shiny';
        } else if (lowerDesc.includes('mágico') || lowerDesc.includes('magical')) {
            analysis.material = 'magical';
        }
        
        // Detectar efectos
        if (lowerDesc.includes('flotante') || lowerDesc.includes('floating')) {
            analysis.effects.push('floating');
        }
        if (lowerDesc.includes('brillante') || lowerDesc.includes('glowing')) {
            analysis.effects.push('glowing');
        }
        if (lowerDesc.includes('rotación') || lowerDesc.includes('spinning')) {
            analysis.effects.push('spinning');
        }
        
        return analysis;
    }
    
    createMeshFromData(objectData) {
        let geometry;
        
        // Crear geometría basada en el tipo
        switch (objectData.type) {
            case 'sphere':
                geometry = new THREE.SphereGeometry(objectData.size.x / 2, 32, 32);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(objectData.size.x / 2, objectData.size.x / 2, objectData.size.y, 32);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(objectData.size.x / 2, objectData.size.y, 32);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(objectData.size.x / 2, objectData.size.x / 4, 16, 32);
                break;
            case 'tree':
                // Árbol: cilindro para tronco + esfera para copa
                const treeGroup = new THREE.Group();
                const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
                const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 1;
                treeGroup.add(trunk);
                
                const leavesGeometry = new THREE.SphereGeometry(1, 16, 16);
                const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 2.5;
                treeGroup.add(leaves);
                
                treeGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return treeGroup;
                
            case 'house':
                // Casa: cubo principal + techo triangular
                const houseGroup = new THREE.Group();
                const houseGeometry = new THREE.BoxGeometry(2, 1.5, 2);
                const houseMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const house = new THREE.Mesh(houseGeometry, houseMaterial);
                house.position.y = 0.75;
                houseGroup.add(house);
                
                const roofGeometry = new THREE.ConeGeometry(1.5, 1, 4);
                const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.y = 2;
                roof.rotation.y = Math.PI / 4;
                houseGroup.add(roof);
                
                houseGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return houseGroup;
                
            case 'car':
                // Coche: cubo principal + cilindros para ruedas
                const carGroup = new THREE.Group();
                const carGeometry = new THREE.BoxGeometry(2, 0.5, 1);
                const carMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const car = new THREE.Mesh(carGeometry, carMaterial);
                carGroup.add(car);
                
                const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
                const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
                
                const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel1.position.set(-0.7, -0.4, 0.6);
                wheel1.rotation.z = Math.PI / 2;
                carGroup.add(wheel1);
                
                const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel2.position.set(0.7, -0.4, 0.6);
                wheel2.rotation.z = Math.PI / 2;
                carGroup.add(wheel2);
                
                const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel3.position.set(-0.7, -0.4, -0.6);
                wheel3.rotation.z = Math.PI / 2;
                carGroup.add(wheel3);
                
                const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel4.position.set(0.7, -0.4, -0.6);
                wheel4.rotation.z = Math.PI / 2;
                carGroup.add(wheel4);
                
                carGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return carGroup;
                
            case 'dragon':
                // Dragón: cuerpo alargado + alas + cabeza
                const dragonGroup = new THREE.Group();
                const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.2, 3, 8);
                const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
                const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
                body.rotation.z = Math.PI / 2;
                dragonGroup.add(body);
                
                const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
                const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
                const head = new THREE.Mesh(headGeometry, headMaterial);
                head.position.set(1.5, 0, 0);
                dragonGroup.add(head);
                
                const wingGeometry = new THREE.BoxGeometry(1, 0.1, 0.8);
                const wingMaterial = new THREE.MeshLambertMaterial({ color: 0x4B0082 });
                const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
                wing1.position.set(0, 0.5, 0.5);
                wing1.rotation.x = Math.PI / 4;
                dragonGroup.add(wing1);
                
                const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
                wing2.position.set(0, 0.5, -0.5);
                wing2.rotation.x = -Math.PI / 4;
                dragonGroup.add(wing2);
                
                dragonGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return dragonGroup;
                
            case 'crystal':
                // Cristal: octaedro
                geometry = new THREE.OctahedronGeometry(objectData.size.x / 2);
                break;
                
            case 'flower':
                // Flor: esfera pequeña + cilindro delgado
                const flowerGroup = new THREE.Group();
                const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
                const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
                const stem = new THREE.Mesh(stemGeometry, stemMaterial);
                stem.position.y = 0.5;
                flowerGroup.add(stem);
                
                const petalGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                const petalMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const petal = new THREE.Mesh(petalGeometry, petalMaterial);
                petal.position.y = 1.3;
                flowerGroup.add(petal);
                
                flowerGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return flowerGroup;
                
            case 'rock':
                geometry = new THREE.DodecahedronGeometry(objectData.size.x / 2);
                break;
                
            case 'robot':
                // Robot: cubo principal + cabeza + brazos
                const robotGroup = new THREE.Group();
                const robotBodyGeometry = new THREE.BoxGeometry(1, 1.5, 0.5);
                const robotBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const robotBody = new THREE.Mesh(robotBodyGeometry, robotBodyMaterial);
                robotBody.position.y = 0.75;
                robotGroup.add(robotBody);
                
                const robotHeadGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
                const robotHeadMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const robotHead = new THREE.Mesh(robotHeadGeometry, robotHeadMaterial);
                robotHead.position.y = 1.9;
                robotGroup.add(robotHead);
                
                const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.2);
                const armMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const arm1 = new THREE.Mesh(armGeometry, armMaterial);
                arm1.position.set(-0.6, 0.75, 0);
                robotGroup.add(arm1);
                
                const arm2 = new THREE.Mesh(armGeometry, armMaterial);
                arm2.position.set(0.6, 0.75, 0);
                robotGroup.add(arm2);
                
                robotGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return robotGroup;
                
            case 'spaceship':
                // Nave espacial: cono + cilindro
                const shipGroup = new THREE.Group();
                const shipBodyGeometry = new THREE.CylinderGeometry(0.3, 0.1, 2, 8);
                const shipBodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
                const shipBody = new THREE.Mesh(shipBodyGeometry, shipBodyMaterial);
                shipBody.rotation.z = Math.PI / 2;
                shipGroup.add(shipBody);
                
                const shipNoseGeometry = new THREE.ConeGeometry(0.1, 0.5, 8);
                const shipNoseMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
                const shipNose = new THREE.Mesh(shipNoseGeometry, shipNoseMaterial);
                shipNose.position.set(1.25, 0, 0);
                shipNose.rotation.z = Math.PI / 2;
                shipGroup.add(shipNose);
                
                shipGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return shipGroup;
                
            case 'castle':
                // Castillo: torre principal + torres pequeñas
                const castleGroup = new THREE.Group();
                const mainTowerGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
                const mainTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const mainTower = new THREE.Mesh(mainTowerGeometry, mainTowerMaterial);
                mainTower.position.y = 1.5;
                castleGroup.add(mainTower);
                
                const smallTowerGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
                const smallTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                
                const tower1 = new THREE.Mesh(smallTowerGeometry, smallTowerMaterial);
                tower1.position.set(1.5, 1, 0);
                castleGroup.add(tower1);
                
                const tower2 = new THREE.Mesh(smallTowerGeometry, smallTowerMaterial);
                tower2.position.set(-1.5, 1, 0);
                castleGroup.add(tower2);
                
                castleGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return castleGroup;
                
            case 'bridge':
                // Puente: cubo largo
                geometry = new THREE.BoxGeometry(3, 0.3, 1);
                break;
                
            case 'tower':
                // Torre: cilindro alto
                geometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
                break;
                
            case 'fire':
                // Fuego: cono invertido
                geometry = new THREE.ConeGeometry(0.5, 1, 8);
                break;
                
            case 'ice':
                // Hielo: cubo con transparencia
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
                
            case 'water':
                // Agua: cubo plano
                geometry = new THREE.BoxGeometry(2, 0.2, 2);
                break;
                
            default:
                geometry = new THREE.BoxGeometry(objectData.size.x, objectData.size.y, objectData.size.z);
        }
        
        // Crear material basado en el tipo
        let material;
        switch (objectData.material) {
            case 'transparent':
                material = new THREE.MeshLambertMaterial({ 
                    color: objectData.color,
                    transparent: true,
                    opacity: 0.6
                });
                break;
            case 'shiny':
                material = new THREE.MeshPhongMaterial({ 
                    color: objectData.color,
                    shininess: 100
                });
                break;
            case 'magical':
                material = new THREE.MeshLambertMaterial({ 
                    color: objectData.color,
                    transparent: true,
                    opacity: 0.8
                });
                break;
            default:
                material = new THREE.MeshLambertMaterial({ 
                    color: objectData.color,
                    transparent: true,
                    opacity: 0.9
                });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
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
        
        // Enviar actualización al servidor con throttling
        if (this.isMultiplayer && this.networkManager && this.networkManager.isConnected) {
            const position = this.playerController.getPosition();
            const rotation = this.playerController.getCameraRotation();
            
            // Solo enviar si la posición cambió significativamente
            if (!this.lastSentPosition || 
                position.distanceTo(this.lastSentPosition) > 0.1 ||
                Math.abs(rotation.y - (this.lastSentRotation?.y || 0)) > 0.1) {
                
                this.networkManager.sendPlayerMove(position);
                this.networkManager.sendPlayerRotate(rotation);
                
                this.lastSentPosition = position.clone();
                this.lastSentRotation = { ...rotation };
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
                // Verificar si estoy escribiendo en algún input
                const activeElement = document.activeElement;
                const isTypingInInput = activeElement && (
                    activeElement.tagName === 'INPUT' || 
                    activeElement.tagName === 'TEXTAREA' ||
                    activeElement.contentEditable === 'true'
                );
                
                if (!isTypingInInput) {
                    e.preventDefault(); // Prevenir que escriba 't' en el input
                    chatContainer.style.display = 'block';
                    chatInput.focus();
                }
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
        console.log('🎮 === DEBUG JUGADORES ===');
        console.log('Jugadores remotos:', this.remotePlayers.size);
        
        this.remotePlayers.forEach((player, id) => {
            console.log(`- ${player.name} (${id}):`, {
                position: player.position,
                targetPosition: player.targetPosition,
                mesh: player.mesh ? '✅' : '❌',
                inScene: player.mesh && this.scene.children.includes(player.mesh) ? '✅' : '❌',
                lastUpdate: player.lastUpdate
            });
        });
        
        console.log('Objetos en escena:', this.scene.children.length);
        console.log('Objetos que son jugadores:', this.scene.children.filter(child => 
            child.userData && child.userData.isRemotePlayer
        ).length);
        console.log('========================');
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
    
    onObjectMove(objectId, position, rotation) {
        if (this.networkManager && this.networkManager.isConnected) {
            // Throttling para evitar spam de actualizaciones
            const now = Date.now();
            const lastUpdate = this.lastObjectMoveUpdate || 0;
            const throttleInterval = 100; // ms
            
            if (now - lastUpdate > throttleInterval) {
                this.networkManager.sendObjectMove(objectId, position, rotation);
                this.lastObjectMoveUpdate = now;
            }
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