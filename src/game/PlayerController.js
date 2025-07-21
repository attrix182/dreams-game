import * as THREE from 'three';

export class PlayerController {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        this.isInitialized = false;
        
        // Configuración del jugador
        this.height = 1.8;
        this.speed = 5;
        this.jumpSpeed = 8;
        this.mouseSensitivity = 0.01; // Sensibilidad más natural
        
        // Estado del jugador - Posición inicial sobre el suelo
        this.position = new THREE.Vector3(0, this.height, 0); // Sobre el suelo
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.onGround = true;
        this.health = 100;
        this.energy = 100;
        
        // Controles
        this.keys = {};
        this.isPointerLocked = false;
        this.isModalOpen = false; // Control para modales
        
        // Sistema de cámara mejorado
        this.cameraRotation = {
            x: 0, // Pitch (arriba/abajo)
            y: 0  // Yaw (izquierda/derecha)
        };
        
        // Movimiento del mouse
        this.mouseMovement = {
            x: 0,
            y: 0
        };
        
        // Sistema de manipulación de objetos (R.E.P.O style)
        this.objectManipulation = {
            isDragging: false,
            draggedObject: null,
            dragPlane: null,
            dragOffset: new THREE.Vector3(),
            originalPosition: new THREE.Vector3(),
            dragDistance: 0,
            scrollDistance: 0,
            originalScale: new THREE.Vector3()
        };
        
        // Interacción
        this.interactionDistance = 3;
        this.interactionRaycaster = new THREE.Raycaster();
        this.interactionRaycaster.far = this.interactionDistance;
        this.interactionRaycaster.near = 0.1;
        
        // Objetos interactuables
        this.interactableObjects = [];
        this.currentInteractable = null;
        
        // Callbacks
        this.onInteract = null;
        this.onObjectHover = null;
        this.onObjectLeave = null;
        this.onGenerateObject = null; // Nuevo callback para generar objetos
        this.onPlayerMove = null; // Callback para notificar movimiento
        this.onPlayerRotate = null; // Callback para notificar rotación
        this.onObjectMove = null; // Callback para notificar movimiento de objetos
        this.onClearAllObjects = null; // Callback para limpiar todos los objetos
    }

    init() {
        // Asegurar que el jugador esté sobre el suelo
        this.position.set(0, this.height, 0);
        this.velocity.set(0, 0, 0);
        this.onGround = true;
        
        // Configurar cámara inicial
        this.camera.position.copy(this.position);
        
        // Ajustar rotación inicial para mirar hacia adelante
        this.cameraRotation.x = 0; // Mirar al frente
        this.cameraRotation.y = 0; // Mirar hacia adelante
        this.updateCameraRotation();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Crear HUD
        this.createHUD();
        
        // Marcar como inicializado ANTES de actualizar HUD
        this.isInitialized = true;
        
        // Actualizar HUD después de la inicialización completa
        this.updateHUD();
        
        // Log de debug
        console.log('✅ PlayerController inicializado - Posición:', this.position);
    }

    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', (event) => {
            // Verificar si hay un modal abierto
            const modalOpen = document.getElementById('itemCatalogModal') && 
                             document.getElementById('itemCatalogModal').style.display === 'block';
            
            // No procesar teclas si hay un modal abierto o el chat tiene foco
            if (modalOpen || this.isModalOpen || this.isChatFocused()) {
                return;
            }
            
            // Permitir tecla T para el chat
            if (event.key === 't' || event.key === 'T') {
                return; // No procesar T aquí, se maneja en el chat
            }
            
            this.keys[event.code] = true;
            
            // Interacción con E
            if (event.code === 'KeyE' && this.currentInteractable) {
                event.preventDefault();
                this.interact();
            }
            
            // Generar objeto con G
            if (event.code === 'KeyG') {
                event.preventDefault(); // Prevenir comportamiento por defecto
                this.generateObject();
            }
            
            // Limpiar todos los objetos con C
            if (event.code === 'KeyC') {
                event.preventDefault();
                console.log('🔍 Tecla C presionada - llamando clearAllObjects');
                this.clearAllObjects();
            }
            
            // Saltar con Space
            if (event.code === 'Space' && this.onGround) {
                event.preventDefault();
                this.jump();
            }
            
            // Correr con Shift
            if (event.code === 'ShiftLeft') {
                this.speed = 8;
            }
            
            // Ajustar sensibilidad del mouse
            if (event.code === 'BracketLeft') {
                event.preventDefault();
                this.mouseSensitivity = Math.max(0.001, this.mouseSensitivity - 0.001);
            }
            if (event.code === 'BracketRight') {
                event.preventDefault();
                this.mouseSensitivity = Math.min(0.05, this.mouseSensitivity + 0.001);
            }
            
            // Resetear rotación de cámara con R
            if (event.code === 'KeyR') {
                event.preventDefault();
                this.resetCameraRotation();
            }
            
            // Debug con F1
            if (event.code === 'F1') {
                event.preventDefault();
                this.debugState();
            }
            
            // Debug de instancia del juego con F8
            if (event.code === 'F8') {
                event.preventDefault();
                console.log('🔍 === DEBUG INSTANCIA DEL JUEGO ===');
                console.log('window.game3D:', window.game3D);
                console.log('window.game3D?.simpleTreasureGame:', window.game3D?.simpleTreasureGame);
                console.log('window.game3D?.obstacleGame:', window.game3D?.obstacleGame);
                console.log('this:', this);
                console.log('🔍 === FIN DEBUG ===');
            }
            
            // Debug del minijuego con F7
            if (event.code === 'F7') {
                event.preventDefault();
                console.log('🎮 === DEBUG MINIJUEGO ===');
                if (window.game3D?.simpleTreasureGame) {
                    const game = window.game3D.simpleTreasureGame;
                    console.log('Estado del minijuego:', {
                        isActive: game.isActive,
                        isHost: game.isHost,
                        gameId: game.gameId,
                        treasures: game.treasures.length,
                        collectedTreasures: game.collectedTreasures.size,
                        playerScores: Object.fromEntries(game.playerScores),
                        gameUI: !!game.gameUI
                    });
                    
                    // Verificar si la UI existe en el DOM
                    const uiElement = document.getElementById('simpleTreasureGameUI');
                    console.log('UI en DOM:', !!uiElement);
                    if (uiElement) {
                        console.log('UI visible:', uiElement.style.display !== 'none');
                    }
                } else {
                    console.log('❌ Minijuego no disponible');
                }
                
                // Verificar estado de la red
                if (window.game3D?.networkManager) {
                    const network = window.game3D.networkManager;
                    console.log('Estado de la red:', {
                        isConnected: network.isConnected,
                        playerId: network.playerId,
                        playerCount: network.getPlayerCount(),
                        callbacks: Array.from(network.callbacks.keys())
                    });
                    
                    // Verificar jugadores conectados
                    const players = network.getAllPlayers();
                    console.log('Jugadores conectados:', players);
                    
                    // Verificar objetos en la red
                    const objects = network.getAllObjects();
                    console.log('Objetos en la red:', objects.length);
                }
                
                console.log('🎮 === FIN DEBUG ===');
            }
            
            // Debug de colisiones con F11
            if (event.code === 'F11') {
                event.preventDefault();
                if (window.game3D && window.game3D.debugCollisions) {
                    window.game3D.debugCollisions();
                }
            }
            
            // Minijuego de obstáculos con F12
            if (event.code === 'F12') {
                event.preventDefault();
                if (window.game3D && window.game3D.obstacleGame) {
                    if (window.game3D.obstacleGame.isActive) {
                        window.game3D.obstacleGame.stop();
                    } else {
                        window.game3D.obstacleGame.start();
                    }
                }
            }
            
            // Minijuego simple con F10 o F9
            if (event.code === 'F10' || event.code === 'F9') {
                event.preventDefault();
                console.log('🎯 F10 presionada - Minijuego Simple');
                console.log('🔍 window.game3D:', window.game3D);
                console.log('🔍 simpleTreasureGame:', window.game3D?.simpleTreasureGame);
                
                if (window.game3D && window.game3D.simpleTreasureGame) {
                    console.log('🎯 Estado actual del minijuego:', window.game3D.simpleTreasureGame.isActive);
                    if (window.game3D.simpleTreasureGame.isActive) {
                        console.log('⏹️ Deteniendo minijuego simple...');
                        window.game3D.simpleTreasureGame.stop();
                    } else {
                        console.log('🎯 Iniciando minijuego simple...');
                        window.game3D.simpleTreasureGame.start();
                    }
                } else {
                    console.log('❌ Minijuego simple no disponible');
                }
            }
            
            // Forzar inicio de arrastre con F2 (para testing)
            if (event.code === 'F2') {
                event.preventDefault();
                this.startObjectDrag();
            }
            
            // Corregir altura de todos los objetos con F3
            if (event.code === 'F3') {
                event.preventDefault();
                // Llamar al método del Game3D si está disponible
                if (window.game3D && window.game3D.fixAllObjectHeights) {
                    window.game3D.fixAllObjectHeights();
                }
            }
            
            // Resetear posición del jugador con F4
            if (event.code === 'F4') {
                event.preventDefault();
                this.resetPosition();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
            
            // Dejar de correr
            if (event.code === 'ShiftLeft') {
                this.speed = 5;
            }
        });

        // Eventos del mouse (solo cuando la ventana tiene foco)
        document.addEventListener('mousemove', (event) => {
            const modalOpen = document.getElementById('itemCatalogModal') && 
                             document.getElementById('itemCatalogModal').style.display === 'block';
            
            if (this.isPointerLocked && !this.isModalOpen && !modalOpen && !this.isChatFocused() && document.hasFocus()) {
                // Capturar movimiento del mouse
                this.mouseMovement.x = event.movementX || 0;
                this.mouseMovement.y = event.movementY || 0;
                
                // Actualizar manipulación de objetos si está activa
                if (this.objectManipulation.isDragging) {
                    this.updateObjectDrag(event);
                }
            }
        });
        
        // Eventos de click y scroll para manipulación de objetos
        document.addEventListener('mousedown', (event) => {
            const modalOpen = document.getElementById('itemCatalogModal') && 
                             document.getElementById('itemCatalogModal').style.display === 'block';
            
            if (this.isPointerLocked && !this.isModalOpen && !modalOpen && !this.isChatFocused() && event.button === 0 && document.hasFocus()) {
                this.startObjectDrag();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.stopObjectDrag();
            }
        });
        
        document.addEventListener('wheel', (event) => {
            const modalOpen = document.getElementById('itemCatalogModal') && 
                             document.getElementById('itemCatalogModal').style.display === 'block';
            
            if (this.isPointerLocked && !this.isModalOpen && !modalOpen && !this.isChatFocused() && this.objectManipulation.isDragging && document.hasFocus()) {
                this.handleObjectScroll(event);
            }
        });

        // Click para bloquear el puntero
        document.addEventListener('click', () => {
            if (!this.isPointerLocked && document.hasFocus()) {
                this.lockPointer();
            }
        });

        // Eventos de bloqueo de puntero
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement !== null;
        });

        // Escape para desbloquear
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Escape') {
                this.unlockPointer();
            }
        });
        
        // Eventos de foco de ventana
        window.addEventListener('focus', () => {
            // Ventana ganó foco - no hacer nada especial
        });
        
        window.addEventListener('blur', () => {
            // Ventana perdió foco - mantener el estado
            // NO desbloquear el puntero automáticamente
        });
        
        // Prevenir que el render se detenga al perder foco
        document.addEventListener('visibilitychange', () => {
            // Mantener el juego funcionando incluso cuando la pestaña no está visible
        });
    }

    lockPointer() {
        try {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        } catch (error) {
            console.warn('⚠️ Error al bloquear el puntero:', error);
        }
    }

    unlockPointer() {
        document.exitPointerLock();
    }

    jump() {
        if (this.onGround) {
            this.velocity.y = this.jumpSpeed;
            this.onGround = false;
        }
    }

    interact() {
        if (this.currentInteractable && this.onInteract) {
            this.onInteract(this.currentInteractable);
        }
    }

    generateObject() {
        if (this.onGenerateObject) {
            this.onGenerateObject();
        }
    }
    
    clearAllObjects() {
        console.log('🔍 clearAllObjects llamado en PlayerController');
        console.log('🔍 onClearAllObjects callback:', this.onClearAllObjects);
        if (this.onClearAllObjects) {
            console.log('🔍 Ejecutando callback onClearAllObjects');
            this.onClearAllObjects();
        } else {
            console.log('❌ onClearAllObjects callback no está configurado');
        }
    }

    resetCameraRotation() {
        // Resetear rotación de la cámara
        this.cameraRotation.x = 0;
        this.cameraRotation.y = 0;
        this.updateCameraRotation();
    }

    setModalOpen(isOpen) {
        this.isModalOpen = isOpen;
        if (isOpen) {
            // Desbloquear puntero cuando se abre modal
            this.unlockPointer();
        }
    }
    
    isChatFocused() {
        const chatInput = document.getElementById('chatInput');
        return chatInput && document.activeElement === chatInput;
    }
    
    onModalClosed() {
        // Cuando se cierra un modal, no restaurar automáticamente el puntero
        // El usuario puede hacer clic para restaurarlo si lo desea
        this.isModalOpen = false;
    }

    // Sistema de manipulación de objetos (Portal style)
    startObjectDrag() {
        if (!this.currentInteractable) {
            console.log('❌ No hay objeto interactuable seleccionado');
            return;
        }
        
        const object = this.currentInteractable;
        
        // Verificar que el objeto tenga las propiedades necesarias
        if (!object || !object.mesh || !object.mesh.position) {
            console.log('❌ Objeto no válido para arrastrar');
            return;
        }
        
        // Verificar distancia al objeto
        const distanceToObject = object.mesh.position.distanceTo(this.camera.position);
        if (distanceToObject > this.interactionDistance) {
            console.log(`❌ Objeto muy lejos (${distanceToObject.toFixed(2)}m > ${this.interactionDistance}m)`);
            return;
        }
        
        console.log(`🎯 Iniciando arrastre de: ${object.name || object.id}`);
        
        this.objectManipulation.isDragging = true;
        this.objectManipulation.draggedObject = object;
        this.objectManipulation.originalPosition.copy(object.mesh.position);
        
        // Calcular distancia inicial desde la cámara
        this.objectManipulation.dragDistance = distanceToObject;
        
        // Desactivar gravedad y física del objeto mientras se arrastra
        if (object.physics) {
            object.physics.enabled = false;
        }
        
        // Agregar efecto visual al objeto arrastrado
        this.addDragEffect(object);
    }

    updateObjectDrag(event) {
        if (!this.objectManipulation.isDragging || !this.objectManipulation.draggedObject) {
            return;
        }
        
        const object = this.objectManipulation.draggedObject;
        
        // Verificar que el objeto exista
        if (!object || !object.mesh || !object.mesh.position) {
            this.stopObjectDrag();
            return;
        }
        
        // Obtener dirección de la cámara
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Posicionar el objeto a la distancia fija desde la cámara
        const targetPosition = this.camera.position.clone().add(
            cameraDirection.multiplyScalar(this.objectManipulation.dragDistance)
        );
        
        // Verificar colisiones antes de aplicar la posición
        if (window.game3D && window.game3D.checkCollision) {
            const collision = window.game3D.checkCollision(targetPosition, object.mesh, object.id);
            
            if (collision.colliding) {
                // Si hay colisión, mantener la posición anterior
                console.log(`🚫 Colisión durante arrastre: ${collision.object.name || collision.object.id}`);
                return;
            }
        }
        
        // Aplicar posición al objeto (solo si no hay colisión)
        object.mesh.position.copy(targetPosition);
        
        // Notificar movimiento del objeto al servidor
        if (this.onObjectMove) {
            this.onObjectMove(object.id, object.mesh.position, object.mesh.rotation);
        }
    }

    handleObjectScroll(event) {
        if (!this.objectManipulation.isDragging || !this.objectManipulation.draggedObject) return;
        
        const object = this.objectManipulation.draggedObject;
        
        // Verificar que el objeto tenga posición
        if (!object || !object.mesh || !object.mesh.position) {
            return;
        }
        
        const scrollDelta = event.deltaY * 0.01; // Sensibilidad del scroll para acercar/alejar
        
        // Calcular nueva distancia desde la cámara
        const currentDistance = this.objectManipulation.dragDistance;
        const newDistance = Math.max(0.5, Math.min(20, currentDistance + scrollDelta));
        this.objectManipulation.dragDistance = newDistance;
        
        // Obtener dirección de la cámara
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        
        // Posicionar el objeto a la distancia calculada desde la cámara
        const newPosition = this.camera.position.clone().add(cameraDirection.multiplyScalar(newDistance));
        
        // Verificar colisiones antes de aplicar la posición
        if (window.game3D && window.game3D.checkCollision) {
            const collision = window.game3D.checkCollision(newPosition, object.mesh, object.id);
            
            if (collision.colliding) {
                // Si hay colisión, revertir la distancia
                this.objectManipulation.dragDistance = currentDistance;
                console.log(`🚫 Colisión durante scroll: ${collision.object.name || collision.object.id}`);
                return;
            }
        }
        
        object.mesh.position.copy(newPosition);
        
        // Notificar movimiento del objeto al servidor
        if (this.onObjectMove) {
            this.onObjectMove(object.id, object.mesh.position, object.mesh.rotation);
        }
    }

    stopObjectDrag() {
        if (this.objectManipulation.isDragging) {
            const object = this.objectManipulation.draggedObject;
            
            console.log(`🎯 Finalizando arrastre de: ${object.name || object.id}`);
            
            // Reactivar gravedad y física del objeto
            if (object && object.physics) {
                object.physics.enabled = true;
            }
            
            // Remover efecto visual del objeto
            this.removeDragEffect(object);
            
            // Notificar movimiento final al servidor
            if (this.onObjectMove && object) {
                this.onObjectMove(object.id, object.mesh.position, object.mesh.rotation);
            }
            
            this.objectManipulation.isDragging = false;
            this.objectManipulation.draggedObject = null;
        }
    }
    
    addDragEffect(object) {
        if (!object || !object.mesh) return;
        
        // Agregar outline verde al objeto arrastrado
        object.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                // Guardar material original
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone();
                }
                
                // Crear material con outline
                const outlineMaterial = child.material.clone();
                outlineMaterial.emissive = new THREE.Color(0x00ff00);
                outlineMaterial.emissiveIntensity = 0.3;
                child.material = outlineMaterial;
            }
        });
    }
    
    removeDragEffect(object) {
        if (!object || !object.mesh) return;
        
        // Restaurar material original
        object.mesh.traverse((child) => {
            if (child.isMesh && child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
                delete child.userData.originalMaterial;
            }
        });
    }

    // Método para debuggear el estado del sistema
    debugState() {
        // Método de debug sin logs para evitar lag
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        // Verificar que la posición sea válida
        if (isNaN(this.position.x) || isNaN(this.position.y) || isNaN(this.position.z)) {
            console.warn('⚠️ Posición inválida detectada, reseteando...');
            this.resetPosition();
            return;
        }

        // Actualizar movimiento
        this.updateMovement(deltaTime);
        
        // Actualizar cámara
        this.updateCamera();
        
        // Actualizar interacciones
        this.updateInteractions();
        
        // Actualizar HUD
        this.updateHUD();
        
                    // Verificar recolección de tesoros
            if (window.game3D && window.game3D.simpleTreasureGame && window.game3D.simpleTreasureGame.isActive) {
                const playerPosition = this.getPosition();
                window.game3D.simpleTreasureGame.checkTreasureCollection('local', playerPosition);
            }
    }

    updateMovement(deltaTime) {
        // Calcular dirección de movimiento
        const direction = new THREE.Vector3();
        
        if (this.keys['KeyW']) direction.z -= 1;
        if (this.keys['KeyS']) direction.z += 1;
        if (this.keys['KeyA']) direction.x -= 1;
        if (this.keys['KeyD']) direction.x += 1;
        
        // Normalizar dirección
        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Aplicar rotación de la cámara al movimiento
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        
        const moveDirection = new THREE.Vector3();
        moveDirection.addScaledVector(cameraDirection, -direction.z);
        moveDirection.addScaledVector(cameraRight, direction.x);
        
        // Aplicar velocidad
        this.velocity.x = moveDirection.x * this.speed;
        this.velocity.z = moveDirection.z * this.speed;
        
        // Gravedad
        if (!this.onGround) {
            this.velocity.y -= 20 * deltaTime; // 20 m/s²
        }
        
        // Actualizar posición
        this.position.addScaledVector(this.velocity, deltaTime);
        
        // Verificar colisión con el suelo
        if (this.position.y <= this.height) {
            this.position.y = this.height;
            this.velocity.y = 0;
            this.onGround = true;
        }
        
        // Actualizar posición de la cámara
        this.camera.position.copy(this.position);
        
        // Notificar movimiento al Game3D (siempre, independientemente del foco)
        if (this.onPlayerMove) {
            this.onPlayerMove(this.position);
        }
    }

    updateCamera() {
        // Solo actualizar cámara si el puntero está bloqueado y no hay modal abierto
        if (!this.isPointerLocked || this.isModalOpen || this.isChatFocused()) return;
        
        // Aplicar rotación si hay movimiento del mouse
        if (this.mouseMovement.x !== 0 || this.mouseMovement.y !== 0) {
            // Actualizar rotación de la cámara
            this.cameraRotation.y -= this.mouseMovement.x * this.mouseSensitivity;
            this.cameraRotation.x -= this.mouseMovement.y * this.mouseSensitivity;
            
            // Limitar rotación vertical (pitch)
            this.cameraRotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraRotation.x));
            
            // Aplicar rotación a la cámara
            this.updateCameraRotation();
            
            // Notificar rotación al Game3D
            if (this.onPlayerRotate) {
                this.onPlayerRotate(this.cameraRotation);
            }
            
            // Resetear movimiento
            this.mouseMovement.x = 0;
            this.mouseMovement.y = 0;
        }
    }

    updateCameraRotation() {
        // Aplicar rotación usando quaternions para evitar gimbal lock
        this.camera.rotation.set(0, 0, 0, 'YXZ');
        this.camera.rotateY(this.cameraRotation.y);
        this.camera.rotateX(this.cameraRotation.x);
    }

    updateInteractions() {
        if (this.objectManipulation.isDragging) return;
        
        // Configurar raycaster desde la cámara
        this.interactionRaycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        // Extraer solo los meshes de los objetos interactuables para el raycaster
        const meshes = this.interactableObjects.map(obj => obj.mesh).filter(mesh => mesh);
        
        // Buscar objetos interactuables
        const intersects = this.interactionRaycaster.intersectObjects(meshes, true);
        
        if (intersects.length > 0) {
            const closestMesh = intersects[0].object;
            
            // Encontrar el objeto completo que contiene este mesh (incluyendo meshes hijos)
            let gameObject = this.interactableObjects.find(obj => obj.mesh === closestMesh);
            
            // Si no se encuentra directamente, buscar en meshes hijos
            if (!gameObject) {
                gameObject = this.interactableObjects.find(obj => {
                    if (obj.mesh) {
                        let found = false;
                        obj.mesh.traverse((child) => {
                            if (child === closestMesh) {
                                found = true;
                            }
                        });
                        return found;
                    }
                    return false;
                });
            }
            
            if (gameObject && gameObject !== this.currentInteractable) {
                this.currentInteractable = gameObject;
                if (this.onObjectHover) {
                    this.onObjectHover(gameObject);
                }
            }
        } else {
            if (this.currentInteractable) {
                if (this.onObjectLeave) {
                    this.onObjectLeave(this.currentInteractable);
                }
                this.currentInteractable = null;
            }
        }
    }

    findGameObject(threeObject) {
        // Buscar el objeto del juego que contiene este objeto de Three.js
        // Esto se implementará en el Game3D
        if (this.findGameObjectCallback) {
            return this.findGameObjectCallback(threeObject);
        }
        return null;
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
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-family: Arial, sans-serif;
            font-size: 12px;
            z-index: 1001;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
        `;
        
        document.body.appendChild(this.interactionIndicator);
        
        // Actualizar HUD inicialmente
        this.updateHUD();
    }

    updateHUD() {
        // Verificar que la posición sea válida
        const posX = isNaN(this.position.x) ? 0 : this.position.x.toFixed(1);
        const posY = isNaN(this.position.y) ? this.height : this.position.y.toFixed(1);
        const posZ = isNaN(this.position.z) ? 0 : this.position.z.toFixed(1);
        
        // Contar objetos con física activa
        const physicsObjects = this.interactableObjects.filter(obj => {
            return obj.physics && obj.physics.enabled;
        }).length;
        
        // Información de objeto interactuable
        let interactableInfo = '';
        if (this.currentInteractable) {
            const distance = this.currentInteractable.mesh.position.distanceTo(this.camera.position);
            const inRange = distance <= this.interactionDistance;
            const statusColor = inRange ? '#00ff00' : '#ff0000';
            const statusText = inRange ? 'En rango' : 'Muy lejos';
            
            interactableInfo = `
                <div style="margin-bottom: 10px; color: ${statusColor};">
                    <strong>Objeto Interactuable:</strong><br>
                    Nombre: ${this.currentInteractable.name || this.currentInteractable.id || 'Sin nombre'}<br>
                    Distancia: ${distance.toFixed(2)}m<br>
                    Estado: ${statusText}
                </div>
            `;
        }
        
        // Información de arrastre
        let dragInfo = '';
        if (this.objectManipulation.isDragging) {
            dragInfo = `
                <div style="margin-bottom: 10px; color: #ffff00;">
                    <strong>Arrastrando:</strong><br>
                    Objeto: ${this.objectManipulation.draggedObject.name || this.objectManipulation.draggedObject.id || 'Sin nombre'}<br>
                    Distancia: ${this.objectManipulation.dragDistance.toFixed(2)}m<br>
                    Controles: Mover mouse + Scroll
                </div>
            `;
        }
        
        this.hud.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Vida:</strong> ${this.health}%
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Energía:</strong> ${this.energy}%
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Posición:</strong> X: ${posX}, Y: ${posY}, Z: ${posZ}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Velocidad:</strong> ${this.speed} m/s
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Objetos:</strong> ${this.interactableObjects.length} | <strong>Física:</strong> ${physicsObjects} | <strong>Ambiente:</strong> ${this.countEnvironmentObjects()}
            </div>
            ${interactableInfo}
            ${dragInfo}
        `;
        
        // Actualizar crosshair
        if (this.objectManipulation.isDragging) {
            this.crosshair.style.borderColor = '#ffff00';
            this.crosshair.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
            this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.5)';
            
            this.interactionIndicator.textContent = `Arrastrando: ${this.objectManipulation.draggedObject.name || this.objectManipulation.draggedObject.id} | Scroll: Acercar/Alejar`;
            this.interactionIndicator.style.opacity = '1';
            this.interactionIndicator.style.background = 'rgba(255, 255, 0, 0.8)';
        } else if (this.currentInteractable) {
            const distance = this.currentInteractable.mesh.position.distanceTo(this.camera.position);
            const inRange = distance <= this.interactionDistance;
            
            if (inRange) {
                this.crosshair.style.borderColor = '#00ff00';
                this.crosshair.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
                this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
                
                const objectName = this.currentInteractable.name || this.currentInteractable.id || 'Sin nombre';
                this.interactionIndicator.textContent = `Click para mover: ${objectName} (${distance.toFixed(1)}m)`;
                this.interactionIndicator.style.opacity = '1';
                this.interactionIndicator.style.background = 'rgba(0, 255, 0, 0.8)';
            } else {
                this.crosshair.style.borderColor = '#ff0000';
                this.crosshair.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
                this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.0)';
                
                const objectName = this.currentInteractable.name || this.currentInteractable.id || 'Sin nombre';
                this.interactionIndicator.textContent = `Muy lejos: ${objectName} (${distance.toFixed(1)}m)`;
                this.interactionIndicator.style.opacity = '1';
                this.interactionIndicator.style.background = 'rgba(255, 0, 0, 0.8)';
            }
        } else {
            this.crosshair.style.borderColor = 'white';
            this.crosshair.style.backgroundColor = 'transparent';
            this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.0)';
            
            this.interactionIndicator.style.opacity = '0';
        }
    }

    // Métodos públicos
    addInteractableObject(object) {
        if (object && object.mesh) {
            // Agregar el objeto completo, no solo el mesh
            this.interactableObjects.push(object);
        }
    }

    removeInteractableObject(object) {
        if (object && object.mesh) {
            // Buscar y remover el objeto completo
            const index = this.interactableObjects.findIndex(obj => obj === object);
            if (index > -1) {
                this.interactableObjects.splice(index, 1);
            }
        }
    }

    setFindGameObjectCallback(callback) {
        this.findGameObject = callback;
    }

    getPosition() {
        return this.position.clone();
    }

    setPosition(x, y, z) {
        this.position.set(x, y, z);
        this.camera.position.copy(this.position);
    }

    getCamera() {
        return this.camera;
    }
    
    getCameraRotation() {
        return this.cameraRotation;
    }
    
    isPlayerMoving() {
        return this.keys['KeyW'] || this.keys['KeyS'] || this.keys['KeyA'] || this.keys['KeyD'];
    }

    // Métodos de utilidad
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.die();
        }
    }

    heal(amount) {
        this.health = Math.min(100, this.health + amount);
    }

    useEnergy(amount) {
        this.energy = Math.max(0, this.energy - amount);
    }

    restoreEnergy(amount) {
        this.energy = Math.min(100, this.energy + amount);
    }

    die() {
        this.health = 0;
        // Resetear posición al suelo
        this.setPosition(0, this.height, 0);
        this.velocity.set(0, 0, 0);
        this.onGround = true;
    }
    
    resetPosition() {
        this.setPosition(0, this.height, 0);
        this.velocity.set(0, 0, 0);
        this.onGround = true;
        this.camera.position.copy(this.position);
    }

    clearAllObjects() {
        console.log('🔍 clearAllObjects llamado en PlayerController');
        console.log('🔍 onClearAllObjects callback:', this.onClearAllObjects);
        if (this.onClearAllObjects) {
            console.log('🔍 Ejecutando callback onClearAllObjects');
            this.onClearAllObjects();
        } else {
            console.log('❌ onClearAllObjects callback no está configurado');
        }
    }
    
    countEnvironmentObjects() {
        let count = 0;
        this.scene.traverse((object) => {
            if (object.isMesh && object.name && object.name.startsWith('test_')) {
                count++;
            }
        });
        return count;
    }
} 