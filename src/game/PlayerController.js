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
        
        // Estado del jugador - Posición inicial más visible
        this.position = new THREE.Vector3(0, this.height, 5); // Más cerca del terreno
        this.velocity = new THREE.Vector3();
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
    }

    init() {
        console.log('🎮 Inicializando controlador del jugador...');
        
        // Configurar cámara inicial
        this.camera.position.copy(this.position);
        
        // Ajustar rotación inicial para mirar hacia el suelo
        this.cameraRotation.x = -0.5; // Mirar más hacia abajo
        this.cameraRotation.y = 0; // Mirar hacia adelante
        this.updateCameraRotation();
        
        // Configurar eventos
        this.setupEventListeners();
        
        // Crear HUD
        this.createHUD();
        
        this.isInitialized = true;
        console.log('✅ Controlador del jugador inicializado');
    }

    setupEventListeners() {
        // Eventos de teclado
        document.addEventListener('keydown', (event) => {
            // No procesar teclas si hay un modal abierto o el chat tiene foco
            if (this.isModalOpen || this.isChatFocused()) {
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
                console.log('🔧 Sensibilidad reducida:', this.mouseSensitivity);
            }
            if (event.code === 'BracketRight') {
                event.preventDefault();
                this.mouseSensitivity = Math.min(0.05, this.mouseSensitivity + 0.001);
                console.log('🔧 Sensibilidad aumentada:', this.mouseSensitivity);
            }
            
            // Resetear rotación de cámara con R
            if (event.code === 'KeyR') {
                event.preventDefault();
                this.resetCameraRotation();
                console.log('🔄 Rotación de cámara reseteada');
            }
            
            // Debug con F1
            if (event.code === 'F1') {
                event.preventDefault();
                this.debugState();
            }
            
            // Forzar inicio de arrastre con F2 (para testing)
            if (event.code === 'F2') {
                event.preventDefault();
                console.log('🧪 Forzando inicio de arrastre...');
                this.startObjectDrag();
            }
            
            // Corregir altura de todos los objetos con F3
            if (event.code === 'F3') {
                event.preventDefault();
                console.log('🔧 Corrigiendo altura de todos los objetos...');
                // Llamar al método del Game3D si está disponible
                if (window.game3D && window.game3D.fixAllObjectHeights) {
                    window.game3D.fixAllObjectHeights();
                }
            }
            
            // Forzar posición de cámara para debug con F4
            if (event.code === 'F4') {
                event.preventDefault();
                console.log('🔧 Forzando posición de cámara para debug...');
                this.position.set(0, 2, 20); // Posición más alta y atrás
                this.cameraRotation.x = -0.1; // Mirar ligeramente hacia abajo
                this.cameraRotation.y = 0; // Mirar hacia adelante
                this.updateCameraRotation();
                console.log('✅ Posición forzada:', this.position);
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
            if (this.isPointerLocked && !this.isModalOpen && !this.isChatFocused() && document.hasFocus()) {
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
            if (this.isPointerLocked && !this.isModalOpen && !this.isChatFocused() && event.button === 0 && document.hasFocus()) {
                this.startObjectDrag();
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.stopObjectDrag();
            }
        });
        
        document.addEventListener('wheel', (event) => {
            if (this.isPointerLocked && !this.isModalOpen && !this.isChatFocused() && this.objectManipulation.isDragging && document.hasFocus()) {
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
            console.log('🪟 Ventana ganó foco');
        });
        
        window.addEventListener('blur', () => {
            console.log('🪟 Ventana perdió foco');
            // No desbloquear el puntero automáticamente al perder foco
        });
    }

    lockPointer() {
        document.body.requestPointerLock();
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

    // Sistema de manipulación de objetos (Portal style)
    startObjectDrag() {
        if (!this.currentInteractable) {
            return;
        }
        
        const object = this.currentInteractable;
        
        // Verificar que el objeto tenga las propiedades necesarias
        if (!object || !object.mesh || !object.mesh.position) {
            return;
        }
        
        this.objectManipulation.isDragging = true;
        this.objectManipulation.draggedObject = object;
        this.objectManipulation.originalPosition.copy(object.mesh.position);
        
        // Calcular distancia inicial desde la cámara
        this.objectManipulation.dragDistance = object.mesh.position.distanceTo(this.camera.position);
        
        // Desactivar gravedad y física del objeto mientras se arrastra
        if (object.physics) {
            object.physics.enabled = false;
        }
        
        console.log('🎯 Iniciando manipulación:', object.data?.name || 'Objeto');
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
        
        // Aplicar posición al objeto
        object.mesh.position.copy(targetPosition);
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
        object.mesh.position.copy(newPosition);
    }

    stopObjectDrag() {
        if (this.objectManipulation.isDragging) {
            const object = this.objectManipulation.draggedObject;
            
            // Reactivar gravedad y física del objeto
            if (object && object.physics) {
                object.physics.enabled = true;
            }
            
            this.objectManipulation.isDragging = false;
            this.objectManipulation.draggedObject = null;
            
            console.log('✅ Finalizando manipulación de objeto');
        }
    }

    // Método para debuggear el estado del sistema
    debugState() {
        console.log('🔍 Estado del PlayerController:');
        console.log('- Posición del jugador:', this.position);
        console.log('- Posición de la cámara:', this.camera.position);
        console.log('- Rotación de la cámara:', this.cameraRotation);
        console.log('- Objetos interactuables:', this.interactableObjects.length);
        console.log('- Objeto actual:', this.currentInteractable ? this.currentInteractable.data?.name : 'Ninguno');
        console.log('- Manipulación activa:', this.objectManipulation.isDragging);
        console.log('- Modal abierto:', this.isModalOpen);
        console.log('- Puntero bloqueado:', this.isPointerLocked);
        console.log('- Objeto arrastrado:', this.objectManipulation.draggedObject ? this.objectManipulation.draggedObject.data?.name : 'Ninguno');
        
        if (this.currentInteractable) {
            console.log('- Detalles del objeto actual:');
            console.log('  - Tipo:', typeof this.currentInteractable);
            console.log('  - Tiene mesh:', !!this.currentInteractable.mesh);
            console.log('  - Tiene position:', !!this.currentInteractable.mesh?.position);
            console.log('  - Tiene scale:', !!this.currentInteractable.mesh?.scale);
            console.log('  - Data:', this.currentInteractable.data);
            console.log('  - Posición actual:', this.currentInteractable.mesh?.position);
        }
        
        console.log('- Estado de manipulación:');
        console.log('  - isDragging:', this.objectManipulation.isDragging);
        console.log('  - draggedObject:', this.objectManipulation.draggedObject);
        console.log('  - originalPosition:', this.objectManipulation.originalPosition);
    }

    update(deltaTime) {
        if (!this.isInitialized) return;

        // Actualizar movimiento
        this.updateMovement(deltaTime);
        
        // Actualizar cámara
        this.updateCamera();
        
        // Actualizar interacciones
        this.updateInteractions();
        
        // Actualizar HUD
        this.updateHUD();
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
        
        // Buscar objetos interactuables
        const intersects = this.interactionRaycaster.intersectObjects(this.interactableObjects, true);
        
        if (intersects.length > 0) {
            const closestObject = intersects[0].object;
            const gameObject = this.findGameObject(closestObject);
            
            if (gameObject && gameObject !== this.currentInteractable) {
                this.currentInteractable = gameObject;
                if (this.onObjectHover) {
                    this.onObjectHover(gameObject);
                }
                console.log('🎯 Objeto detectado para interacción:', gameObject.data?.name || 'Sin nombre');
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
    }

    updateHUD() {
        // Contar objetos con física activa
        const physicsObjects = this.interactableObjects.filter(obj => {
            const gameObj = this.findGameObject(obj);
            return gameObj && gameObj.physics && gameObj.physics.enabled;
        }).length;
        
        // Actualizar información del HUD
        this.hud.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong>Vida:</strong> ${this.health}%
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Energía:</strong> ${this.energy}%
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Posición:</strong> X: ${this.position.x.toFixed(1)}, Y: ${this.position.y.toFixed(1)}, Z: ${this.position.z.toFixed(1)}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Velocidad:</strong> ${this.speed} m/s
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Objetos:</strong> ${this.interactableObjects.length} | <strong>Actual:</strong> ${this.currentInteractable ? this.currentInteractable.data?.name || 'Sin nombre' : 'Ninguno'}
            </div>
            <div style="margin-bottom: 10px;">
                <strong>Física:</strong> ${physicsObjects} objetos activos
            </div>
        `;
        
        // Actualizar crosshair
        if (this.objectManipulation.isDragging) {
            this.crosshair.style.borderColor = '#ff6600';
            this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.5)';
            
            this.interactionIndicator.textContent = `Mantén click para mover | Scroll para acercar/alejar`;
            this.interactionIndicator.style.opacity = '1';
        } else if (this.currentInteractable) {
            this.crosshair.style.borderColor = '#00ff00';
            this.crosshair.style.transform = 'translate(-50%, -50%) scale(1.2)';
            
            this.interactionIndicator.textContent = `Presiona E para interactuar | Click para mover ${this.currentInteractable.data.name}`;
            this.interactionIndicator.style.opacity = '1';
        } else {
            this.crosshair.style.borderColor = 'white';
            this.crosshair.style.transform = 'translate(-50%, -50%) scale(1)';
            
            this.interactionIndicator.style.opacity = '0';
        }
    }

    // Métodos públicos
    addInteractableObject(object) {
        if (object && object.mesh) {
            this.interactableObjects.push(object.mesh);
            console.log('✅ Objeto agregado para interacción:', object.data?.name || 'Sin nombre');
        } else {
            console.warn('⚠️ Objeto inválido para interacción');
        }
    }

    removeInteractableObject(object) {
        if (object && object.mesh) {
            const index = this.interactableObjects.indexOf(object.mesh);
            if (index > -1) {
                this.interactableObjects.splice(index, 1);
                console.log('❌ Objeto removido de interacción:', object.data?.name || 'Sin nombre');
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
        console.log('💀 Jugador ha muerto');
        // Implementar lógica de muerte
        this.health = 100;
        this.energy = 100;
        this.setPosition(0, this.height, 0);
    }
} 