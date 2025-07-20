import * as THREE from 'three';

export class PhysicsObject {
    constructor(mesh, options = {}) {
        this.mesh = mesh;
        this.velocity = new THREE.Vector3();
        this.acceleration = new THREE.Vector3(0, -9.8, 0); // Gravedad
        this.mass = options.mass || 1.0;
        this.restitution = options.restitution || 0.3; // Rebote
        this.friction = options.friction || 0.8; // Fricción
        this.enabled = options.enabled !== false;
        this.onGround = false;
        this.groundY = 0.1; // Altura mínima del suelo (pequeño margen)
        
        // Collider (esfera simple)
        this.collider = {
            type: 'sphere',
            radius: options.radius || 0.5
        };
        
        // Calcular radio del collider basado en el tamaño del mesh
        this.updateCollider();
    }
    
    updateCollider() {
        if (this.mesh) {
            // Calcular el radio basado en el bounding box del mesh
            const box = new THREE.Box3().setFromObject(this.mesh);
            const size = box.getSize(new THREE.Vector3());
            this.collider.radius = Math.max(size.x, size.y, size.z) * 0.5;
        }
    }
    
    update(deltaTime) {
        if (!this.enabled) return;
        
        // Aplicar gravedad
        this.velocity.add(this.acceleration.clone().multiplyScalar(deltaTime));
        
        // Aplicar fricción
        this.velocity.multiplyScalar(this.friction);
        
        // Actualizar posición
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Colisión con el suelo
        this.handleGroundCollision();
        
        // Colisión con otros objetos
        this.handleObjectCollisions();
    }
    
    handleGroundCollision() {
        // Calcular la altura real del suelo considerando el tamaño del objeto
        const box = new THREE.Box3().setFromObject(this.mesh);
        const objectHeight = box.getSize(new THREE.Vector3()).y;
        const actualGroundY = this.groundY + (objectHeight * 0.5);
        
        if (this.mesh.position.y <= actualGroundY) {
            this.mesh.position.y = actualGroundY;
            
            if (this.velocity.y < 0) {
                // Rebote en el suelo
                this.velocity.y = -this.velocity.y * this.restitution;
                this.onGround = true;
            }
        } else {
            this.onGround = false;
        }
    }
    
    handleObjectCollisions() {
        // Esta función se implementará cuando tengamos otros objetos
        // Por ahora es un placeholder
    }
    
    applyForce(force) {
        if (!this.enabled) return;
        this.velocity.add(force.clone().divideScalar(this.mass));
    }
    
    applyImpulse(impulse) {
        if (!this.enabled) return;
        this.velocity.add(impulse.clone().divideScalar(this.mass));
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // Detener movimiento cuando se desactiva
            this.velocity.set(0, 0, 0);
        }
    }
    
    getPosition() {
        return this.mesh.position.clone();
    }
    
    setPosition(position) {
        this.mesh.position.copy(position);
    }
    
    getVelocity() {
        return this.velocity.clone();
    }
    
    setVelocity(velocity) {
        this.velocity.copy(velocity);
    }
} 