import * as THREE from 'three';

export class RemotePlayer {
    constructor(playerData, scene) {
        this.id = playerData.id;
        this.name = playerData.name;
        this.scene = scene;
        this.mesh = null;
        this.nameTag = null;
        
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
        
        // Interpolación simple
        this.targetPosition = this.position.clone();
        this.targetRotation = this.rotation.clone();
        this.interpolationSpeed = 0.1;
        
        this.createMesh();
        this.createNameTag();
    }
    
    createMesh() {
        // Crear geometría del jugador (cápsula simple)
        const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getPlayerColor(this.id)
        });
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // Agregar identificador
        this.mesh.userData = {
            isRemotePlayer: true,
            playerId: this.id,
            playerName: this.name
        };
        
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
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 20px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(this.name, canvas.width / 2, 35);
        
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
        
        this.mesh.add(this.nameTag);
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
        
        // Hacer que el nombre siempre mire hacia la cámara
        if (this.nameTag && window.game3D && window.game3D.camera) {
            this.nameTag.lookAt(window.game3D.camera.position);
        }
    }
    
    updatePosition(position) {
        this.targetPosition.set(position.x, position.y, position.z);
    }
    
    updateRotation(rotation) {
        this.targetRotation.set(rotation.x, rotation.y, rotation.z);
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.nameTag && this.nameTag.material) this.nameTag.material.dispose();
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
} 