import * as THREE from 'three';

export class RemotePlayer {
    constructor(playerData, scene) {
        this.id = playerData.id;
        this.name = playerData.name;
        this.scene = scene;
        this.mesh = null;
        this.nameTag = null;
        this.healthBar = null;
        
        // Estado del jugador
        this.position = new THREE.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        this.rotation = new THREE.Euler(
            playerData.rotation.x,
            playerData.rotation.y,
            playerData.rotation.z
        );
        this.health = playerData.health || 100;
        this.energy = playerData.energy || 100;
        
        // Interpolación para movimiento suave
        this.targetPosition = this.position.clone();
        this.targetRotation = this.rotation.clone();
        this.interpolationSpeed = 0.1;
        
        this.createMesh();
        this.createNameTag();
        this.createHealthBar();
    }
    
    createMesh() {
        // Crear geometría del jugador (cápsula simple)
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getPlayerColor(this.id),
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Agregar al escena
        this.scene.add(this.mesh);
    }
    
    createNameTag() {
        // Crear canvas para el nombre
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // Configurar texto
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, 40);
        
        // Crear textura y material
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Crear mesh del nombre
        const geometry = new THREE.PlaneGeometry(2, 0.5);
        this.nameTag = new THREE.Mesh(geometry, material);
        this.nameTag.position.set(0, 2.5, 0);
        this.nameTag.lookAt(0, 0, 0);
        
        this.mesh.add(this.nameTag);
    }
    
    createHealthBar() {
        // Crear barra de salud
        const healthGeometry = new THREE.BoxGeometry(1, 0.1, 0.05);
        const healthMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        
        this.healthBar = new THREE.Mesh(healthGeometry, healthMaterial);
        this.healthBar.position.set(0, 2.2, 0);
        
        this.mesh.add(this.healthBar);
    }
    
    update(deltaTime) {
        // Interpolar posición
        this.position.lerp(this.targetPosition, this.interpolationSpeed);
        this.mesh.position.copy(this.position);
        
        // Interpolar rotación
        this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, this.targetRotation.x, this.interpolationSpeed);
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, this.targetRotation.y, this.interpolationSpeed);
        this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, this.targetRotation.z, this.interpolationSpeed);
        this.mesh.rotation.copy(this.rotation);
        
        // Hacer que el nombre siempre mire hacia la cámara (si está disponible)
        if (this.nameTag && window.game3D && window.game3D.camera) {
            this.nameTag.lookAt(window.game3D.camera.position);
        }
        
        // Actualizar barra de salud
        this.updateHealthBar();

    }
    
    updateHealthBar() {
        if (this.healthBar) {
            const healthPercent = this.health / 100;
            this.healthBar.scale.x = healthPercent;
            
            // Cambiar color según la salud
            if (healthPercent > 0.6) {
                this.healthBar.material.color.setHex(0x00ff00); // Verde
            } else if (healthPercent > 0.3) {
                this.healthBar.material.color.setHex(0xffff00); // Amarillo
            } else {
                this.healthBar.material.color.setHex(0xff0000); // Rojo
            }
        }
    }
    
    updatePosition(position) {
      
        this.targetPosition.set(position.x, position.y, position.z);
        this.lastUpdate = Date.now();
    }
    
    updateRotation(rotation) {
    
        this.targetRotation.set(rotation.x, rotation.y, rotation.z);
        this.lastUpdate = Date.now();
    }
    
    updateHealth(health) {
        this.health = health;
    }
    
    updateEnergy(energy) {
        this.energy = energy;
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
    }
    
    getPlayerColor(playerId) {
        // Generar color único basado en el ID del jugador
        const colors = [
            0xff0000, // Rojo
            0x00ff00, // Verde
            0x0000ff, // Azul
            0xffff00, // Amarillo
            0xff00ff, // Magenta
            0x00ffff, // Cyan
            0xff8800, // Naranja
            0x8800ff, // Púrpura
            0x00ff88, // Verde azulado
            0xff0088  // Rosa
        ];
        
        const index = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }
    
    getDistanceTo(otherPosition) {
        return this.position.distanceTo(otherPosition);
    }
    
    isVisible(camera) {
        // Verificar si el jugador está en el campo de visión de la cámara
        const direction = new THREE.Vector3();
        direction.subVectors(this.position, camera.position).normalize();
        
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        const angle = direction.angleTo(cameraDirection);
        return angle < Math.PI / 3; // 60 grados
    }
} 