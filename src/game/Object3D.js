import * as THREE from 'three';
import { PhysicsObject } from './PhysicsObject.js';

export class Object3D {
    constructor(data) {
        this.data = data;
        this.mesh = null;
        this.physics = null;
        this.isSelected = false;
        this.originalMaterial = null;
        this.selectionMaterial = null;
        this.animation = null;
        this.particles = null;
        this.id = this.generateId();
    }

    generateId() {
        return 'obj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async create() {
        console.log('🎨 Creando objeto:', this.data);
        
        try {
            // Determinar el tipo de objeto y crear el mesh apropiado
            this.mesh = await this.createMesh();
            
            // Configurar posición y escala
            this.setupTransform();
            
            // Agregar efectos especiales si es necesario
            await this.addSpecialEffects();
            
            // Crear materiales de selección
            this.createSelectionMaterials();
            
            // Crear sistema de física
            this.createPhysics();
            
            console.log('✅ Objeto creado:', this.data.name);
            
        } catch (error) {
            console.error('❌ Error al crear objeto:', error);
            throw error;
        }
    }

    async createMesh() {
        const { type, size = 1, complexity = 'medium' } = this.data;
        
        // Para objetos compuestos (tree, house, animal, vehicle, magical)
        if (['tree', 'house', 'animal', 'vehicle', 'magical'].includes(type)) {
            return this.createCompoundMesh(type, size);
        }
        
        // Para objetos simples, crear geometría y material
        const geometry = await this.createSimpleGeometry(type, size);
        const material = await this.createMaterial();
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        return mesh;
    }

    createCompoundMesh(type, size) {
        const group = new THREE.Group();
        
        switch (type) {
            case 'tree':
                this.createTreeMesh(group, size);
                break;
            case 'house':
                this.createHouseMesh(group, size);
                break;
            case 'animal':
                this.createAnimalMesh(group, size);
                break;
            case 'vehicle':
                this.createVehicleMesh(group, size);
                break;
            case 'magical':
                this.createMagicalMesh(group, size);
                break;
        }
        
        return group;
    }

    async createSimpleGeometry(type, size) {
        switch (type) {
            case 'cube':
                return new THREE.BoxGeometry(size, size, size);
                
            case 'sphere':
                return new THREE.SphereGeometry(size / 2, 32, 32);
                
            case 'cylinder':
                return new THREE.CylinderGeometry(size / 2, size / 2, size, 32);
                
            case 'cone':
                return new THREE.ConeGeometry(size / 2, size, 32);
                
            case 'torus':
                return new THREE.TorusGeometry(size / 2, size / 4, 16, 32);
                
            default:
                // Geometría por defecto basada en la descripción
                return this.createDefaultGeometry(size);
        }
    }

    createTreeMesh(group, size) {
        // Tronco
        const trunkGeometry = new THREE.CylinderGeometry(size * 0.1, size * 0.15, size * 0.8, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = size * 0.4;
        trunk.castShadow = true;
        group.add(trunk);
        
        // Copa del árbol
        const leavesGeometry = new THREE.SphereGeometry(size * 0.6, 16, 16);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = size * 1.2;
        leaves.castShadow = true;
        group.add(leaves);
    }

    createHouseMesh(group, size) {
        // Base de la casa
        const baseGeometry = new THREE.BoxGeometry(size, size * 0.8, size);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xD2B48C });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = size * 0.4;
        base.castShadow = true;
        group.add(base);
        
        // Techo
        const roofGeometry = new THREE.ConeGeometry(size * 0.8, size * 0.6, 4);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = size * 1.1;
        roof.rotation.y = Math.PI / 4;
        roof.castShadow = true;
        group.add(roof);
    }

    createAnimalMesh(group, size) {
        // Cuerpo
        const bodyGeometry = new THREE.SphereGeometry(size * 0.4, 16, 16);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.4;
        body.castShadow = true;
        group.add(body);
        
        // Cabeza
        const headGeometry = new THREE.SphereGeometry(size * 0.2, 16, 16);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(size * 0.3, size * 0.6, 0);
        head.castShadow = true;
        group.add(head);
        
        // Patas
        for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.CylinderGeometry(size * 0.05, size * 0.05, size * 0.3, 8);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(
                (i % 2 === 0 ? 1 : -1) * size * 0.2,
                size * 0.15,
                (i < 2 ? 1 : -1) * size * 0.2
            );
            leg.castShadow = true;
            group.add(leg);
        }
    }

    createVehicleMesh(group, size) {
        // Cuerpo del vehículo
        const bodyGeometry = new THREE.BoxGeometry(size, size * 0.4, size * 0.6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0xFF0000 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = size * 0.2;
        body.castShadow = true;
        group.add(body);
        
        // Ruedas
        for (let i = 0; i < 4; i++) {
            const wheelGeometry = new THREE.CylinderGeometry(size * 0.1, size * 0.1, size * 0.05, 16);
            const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(
                (i % 2 === 0 ? 1 : -1) * size * 0.3,
                size * 0.1,
                (i < 2 ? 1 : -1) * size * 0.25
            );
            wheel.castShadow = true;
            group.add(wheel);
        }
    }

    createMagicalMesh(group, size) {
        // Cuerpo principal con forma de cristal
        const crystalGeometry = new THREE.OctahedronGeometry(size * 0.5);
        const crystalMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });
        const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
        crystal.castShadow = true;
        group.add(crystal);
        
        // Aura mágica
        const auraGeometry = new THREE.SphereGeometry(size * 0.8, 16, 16);
        const auraMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const aura = new THREE.Mesh(auraGeometry, auraMaterial);
        group.add(aura);
    }

    createDefaultGeometry(size) {
        // Geometría por defecto basada en palabras clave en la descripción
        const description = this.data.description.toLowerCase();
        
        if (description.includes('redondo') || description.includes('esfera')) {
            return new THREE.SphereGeometry(size / 2, 32, 32);
        } else if (description.includes('cuadrado') || description.includes('caja')) {
            return new THREE.BoxGeometry(size, size, size);
        } else if (description.includes('alto') || description.includes('torre')) {
            return new THREE.CylinderGeometry(size / 3, size / 3, size, 16);
        } else {
            // Geometría aleatoria interesante
            const geometries = [
                () => new THREE.TetrahedronGeometry(size / 2),
                () => new THREE.OctahedronGeometry(size / 2),
                () => new THREE.IcosahedronGeometry(size / 2),
                () => new THREE.TorusKnotGeometry(size / 3, size / 6, 100, 16)
            ];
            
            const randomGeometry = geometries[Math.floor(Math.random() * geometries.length)];
            return randomGeometry();
        }
    }

    async createMaterial() {
        const { color, material, texture } = this.data;
        
        let materialColor = 0xFFFFFF;
        let materialType = 'MeshLambertMaterial';
        
        // Determinar color
        if (color) {
            materialColor = this.parseColor(color);
        } else {
            materialColor = this.generateRandomColor();
        }
        
        // Determinar tipo de material
        if (material) {
            materialType = this.parseMaterialType(material);
        }
        
        // Crear material
        const materialParams = {
            color: materialColor,
            transparent: false,
            opacity: 1
        };
        
        // Agregar propiedades especiales según el tipo
        if (materialType === 'MeshPhongMaterial') {
            materialParams.shininess = 100;
        } else if (materialType === 'MeshStandardMaterial') {
            materialParams.metalness = 0.5;
            materialParams.roughness = 0.5;
        }
        
        return new THREE[materialType](materialParams);
    }

    parseColor(color) {
        // Si ya es un número hexadecimal, devolverlo directamente
        if (typeof color === 'number') {
            return color;
        }
        
        // Si es una cadena, procesarla
        if (typeof color === 'string') {
            const colorMap = {
                'rojo': 0xFF0000,
                'azul': 0x0000FF,
                'verde': 0x00FF00,
                'amarillo': 0xFFFF00,
                'naranja': 0xFFA500,
                'morado': 0x800080,
                'rosa': 0xFFC0CB,
                'marrón': 0x8B4513,
                'negro': 0x000000,
                'blanco': 0xFFFFFF,
                'gris': 0x808080,
                'dorado': 0xFFD700,
                'plateado': 0xC0C0C0,
                'turquesa': 0x40E0D0,
                'magenta': 0xFF00FF,
                'cyan': 0x00FFFF
            };
            
            return colorMap[color.toLowerCase()] || 0xFFFFFF;
        }
        
        // Valor por defecto si no es válido
        return 0xFFFFFF;
    }

    parseMaterialType(material) {
        // Si no hay material o no es una cadena, usar el por defecto
        if (!material || typeof material !== 'string') {
            return 'MeshLambertMaterial';
        }
        
        const materialMap = {
            'metal': 'MeshStandardMaterial',
            'madera': 'MeshLambertMaterial',
            'cristal': 'MeshPhongMaterial',
            'plástico': 'MeshLambertMaterial',
            'piedra': 'MeshLambertMaterial',
            'brillante': 'MeshPhongMaterial',
            'mate': 'MeshLambertMaterial'
        };
        
        return materialMap[material.toLowerCase()] || 'MeshLambertMaterial';
    }

    generateRandomColor() {
        const colors = [
            0xFF6B6B, 0x4ECDC4, 0x45B7D1, 0x96CEB4, 0xFFEAA7,
            0xDDA0DD, 0x98D8C8, 0xF7DC6F, 0xBB8FCE, 0x85C1E9
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    setupTransform() {
        const { position, rotation, scale } = this.data;
        
        // Posición
        if (position) {
            this.mesh.position.set(position.x || 0, position.y || 0, position.z || 0);
        } else {
            // Posición aleatoria en el área de juego
            this.mesh.position.set(
                (Math.random() - 0.5) * 20,
                0,
                (Math.random() - 0.5) * 20
            );
        }
        
        // Rotación
        if (rotation) {
            this.mesh.rotation.set(
                rotation.x || 0,
                rotation.y || 0,
                rotation.z || 0
            );
        }
        
        // Escala
        if (scale) {
            this.mesh.scale.set(scale, scale, scale);
        }
        
        // Ajustar altura para que el objeto esté sobre el suelo
        this.adjustHeightForGround();
    }

    adjustHeightForGround() {
        // Calcular la altura correcta basada en el tamaño del objeto
        const box = new THREE.Box3().setFromObject(this.mesh);
        const objectSize = box.getSize(new THREE.Vector3());
        const objectHeight = objectSize.y;
        const objectCenter = box.getCenter(new THREE.Vector3());
        
        // Posicionar el objeto para que esté sobre el suelo
        // Usar un pequeño margen para que no se vea flotando
        const groundHeight = (objectHeight * 0.5) + 0.05;
        
        // Ajustar la posición Y para que la base del objeto esté en el suelo
        this.mesh.position.y = groundHeight;
        
        console.log('📏 Ajustando altura para:', this.data.name, {
            objectType: this.mesh.constructor.name,
            objectSize: objectSize,
            objectHeight: objectHeight,
            objectCenter: objectCenter,
            groundHeight: groundHeight,
            finalPosition: this.mesh.position.clone()
        });
    }

    async addSpecialEffects() {
        const { effects } = this.data;
        
        if (!effects) return;
        
        for (const effect of effects) {
            switch (effect) {
                case 'brillo':
                    this.addGlowEffect();
                    break;
                case 'partículas':
                    this.addParticleEffect();
                    break;
                case 'rotación':
                    this.addRotationAnimation();
                    break;
                case 'flotación':
                    this.addFloatingAnimation();
                    break;
            }
        }
    }

    addGlowEffect() {
        if (this.mesh instanceof THREE.Group) {
            // Para grupos, crear un glow que envuelva todo el grupo
            const box = new THREE.Box3().setFromObject(this.mesh);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const glowGeometry = new THREE.BoxGeometry(size.x * 1.3, size.y * 1.3, size.z * 1.3);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.position.copy(center);
            this.mesh.add(glowMesh);
        } else {
            // Para meshes simples
            const glowGeometry = this.mesh.geometry.clone();
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.scale.multiplyScalar(1.2);
            this.mesh.add(glowMesh);
        }
    }

    addParticleEffect() {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        // Determinar el tamaño del área de partículas
        let particleSize = 2;
        if (this.mesh instanceof THREE.Group) {
            const box = new THREE.Box3().setFromObject(this.mesh);
            const size = box.getSize(new THREE.Vector3());
            particleSize = Math.max(size.x, size.y, size.z) * 1.5;
        }
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * particleSize;
            positions[i + 1] = (Math.random() - 0.5) * particleSize;
            positions[i + 2] = (Math.random() - 0.5) * particleSize;
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFFF00,
            size: 0.05,
            transparent: true,
            opacity: 0.8
        });
        
        this.particles = new THREE.Points(particles, particleMaterial);
        this.mesh.add(this.particles);
    }

    addRotationAnimation() {
        this.animation = {
            type: 'rotation',
            speed: 0.02
        };
    }

    addFloatingAnimation() {
        this.animation = {
            type: 'floating',
            speed: 0.02,
            amplitude: 0.5,
            originalY: this.mesh.position.y
        };
    }

    createSelectionMaterials() {
        // Para grupos, no podemos clonar materiales directamente
        // Los materiales se manejan individualmente en cada mesh del grupo
        if (this.mesh instanceof THREE.Group) {
            this.originalMaterials = [];
            this.selectionMaterials = [];
            
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    this.originalMaterials.push(child.material.clone());
                    
                    const selectionMaterial = child.material.clone();
                    selectionMaterial.emissive = new THREE.Color(0x444444);
                    selectionMaterial.emissiveIntensity = 0.3;
                    this.selectionMaterials.push(selectionMaterial);
                }
            });
        } else {
            // Para meshes simples
            this.originalMaterial = this.mesh.material.clone();
            
            this.selectionMaterial = this.mesh.material.clone();
            this.selectionMaterial.emissive = new THREE.Color(0x444444);
            this.selectionMaterial.emissiveIntensity = 0.3;
        }
    }

    select() {
        if (this.isSelected) return;
        
        this.isSelected = true;
        
        // Cambiar materiales
        if (this.mesh instanceof THREE.Group) {
            let materialIndex = 0;
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material = this.selectionMaterials[materialIndex];
                    materialIndex++;
                }
            });
        } else if (this.mesh.material) {
            this.mesh.material = this.selectionMaterial;
        }
        
        // Agregar outline
        this.addOutline();
        
        console.log('✅ Objeto seleccionado:', this.data.name);
    }

    deselect() {
        if (!this.isSelected) return;
        
        this.isSelected = false;
        
        // Restaurar materiales originales
        if (this.mesh instanceof THREE.Group) {
            let materialIndex = 0;
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh && child.material) {
                    child.material = this.originalMaterials[materialIndex];
                    materialIndex++;
                }
            });
        } else if (this.mesh.material) {
            this.mesh.material = this.originalMaterial;
        }
        
        // Remover outline
        this.removeOutline();
        
        console.log('❌ Objeto deseleccionado:', this.data.name);
    }

    addOutline() {
        if (this.mesh instanceof THREE.Group) {
            // Para grupos, crear un outline que envuelva todo el grupo
            const box = new THREE.Box3().setFromObject(this.mesh);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            
            const outlineGeometry = new THREE.BoxGeometry(size.x * 1.1, size.y * 1.1, size.z * 1.1);
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                side: THREE.BackSide,
                transparent: true,
                opacity: 0.5
            });
            
            this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            this.outline.position.copy(center);
            this.mesh.add(this.outline);
        } else {
            // Para meshes simples
            const outlineGeometry = this.mesh.geometry.clone();
            const outlineMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                side: THREE.BackSide
            });
            
            this.outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
            this.outline.scale.multiplyScalar(1.05);
            this.mesh.add(this.outline);
        }
    }

    removeOutline() {
        if (this.outline) {
            this.mesh.remove(this.outline);
            this.outline = null;
        }
    }

    update(deltaTime) {
        // Actualizar física
        if (this.physics) {
            this.physics.update(deltaTime);
        }
        
        // Actualizar animaciones
        if (this.animation) {
            switch (this.animation.type) {
                case 'rotation':
                    this.mesh.rotation.y += this.animation.speed;
                    break;
                    
                case 'floating':
                    const time = Date.now() * 0.001;
                    this.mesh.position.y = this.animation.originalY + 
                        Math.sin(time * 2) * this.animation.amplitude;
                    break;
            }
        }
        
        // Actualizar partículas
        if (this.particles) {
            this.particles.rotation.y += 0.01;
        }
    }

    // Métodos de utilidad
    getPosition() {
        return this.mesh.position.clone();
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }

    getRotation() {
        return this.mesh.rotation.clone();
    }

    setRotation(x, y, z) {
        this.mesh.rotation.set(x, y, z);
    }

    getScale() {
        return this.mesh.scale.clone();
    }

    setScale(x, y, z) {
        this.mesh.scale.set(x, y, z);
    }

    getData() {
        return this.data;
    }

    getId() {
        return this.id;
    }

    createPhysics() {
        // Crear sistema de física para el objeto
        const physicsOptions = {
            mass: this.data.mass || 1.0,
            restitution: this.data.restitution || 0.3,
            friction: this.data.friction || 0.8,
            enabled: this.data.physics !== false
        };
        
        this.physics = new PhysicsObject(this.mesh, physicsOptions);
        
        // Asegurar que el objeto esté en la altura correcta
        this.adjustHeightForGround();
        
        console.log('⚡ Física creada para:', this.data.name);
    }
} 