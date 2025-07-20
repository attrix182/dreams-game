import * as THREE from 'three';

export class RemotePlayer {
    constructor(playerData, scene) {
        this.id = playerData.id;
        this.name = playerData.name;
        this.scene = scene;
        this.mesh = null;
        this.nameTag = null;
        this.lastUpdate = Date.now();
        
        // Estado del jugador
        this.position = new THREE.Vector3(
            playerData.position.x || 0,
            (playerData.position.y || 1) + 1, // Posición sobre el suelo
            playerData.position.z || 0
        );
        this.rotation = new THREE.Euler(
            playerData.rotation?.x || 0,
            playerData.rotation?.y || 0,
            playerData.rotation?.z || 0
        );
        
        // Interpolación simple
        this.targetPosition = this.position.clone();
        this.targetRotation = this.rotation.clone();
        this.interpolationSpeed = 0.1;
        
        this.createMesh();
        this.createNameTag();
        
        console.log('🎮 RemotePlayer creado para:', this.name, 'en posición:', this.position);
    }
    
    createMesh() {
        // Usar CylinderGeometry en lugar de CapsuleGeometry (más compatible)
        const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 8);
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getPlayerColor(this.id),
            transparent: true,
            opacity: 0.9
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
        console.log('✅ Mesh de RemotePlayer agregado a la escena');
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
        if (!this.mesh) return;
        
        // Interpolar posición
        this.position.lerp(this.targetPosition, this.interpolationSpeed);
        this.mesh.position.copy(this.position);
        
        // Interpolar rotación
        this.rotation.x = THREE.MathUtils.lerp(this.rotation.x, this.targetRotation.x, this.interpolationSpeed);
        this.rotation.y = THREE.MathUtils.lerp(this.rotation.y, this.targetRotation.y, this.interpolationSpeed);
        this.rotation.z = THREE.MathUtils.lerp(this.rotation.z, this.targetRotation.z, this.interpolationSpeed);
        this.mesh.rotation.copy(this.rotation);
        
        // Hacer que el nombre siempre mire hacia la cámara
        if (this.nameTag) {
            // Buscar la cámara de forma más robusta
            let camera = null;
            if (window.game3D && window.game3D.camera) {
                camera = window.game3D.camera;
            } else if (window.Dreams3DGame && window.Dreams3DGame.game && window.Dreams3DGame.game.camera) {
                camera = window.Dreams3DGame.game.camera;
            }
            
            if (camera) {
                this.nameTag.lookAt(camera.position);
            }
        }
        
        this.lastUpdate = Date.now();
    }
    
    updatePosition(position) {
        if (position) {
            this.targetPosition.set(
                position.x || 0,
                (position.y || 1) + 1, // Mantener sobre el suelo
                position.z || 0
            );
          
        }
    }
    
    updateRotation(rotation) {
        if (rotation) {
            this.targetRotation.set(
                rotation.x || 0,
                rotation.y || 0,
                rotation.z || 0
            );
        }
    }
    
    remove() {
        if (this.mesh) {
            this.scene.remove(this.mesh);
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) this.mesh.material.dispose();
            if (this.nameTag && this.nameTag.material) this.nameTag.material.dispose();
            console.log('🗑️ RemotePlayer removido:', this.name);
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