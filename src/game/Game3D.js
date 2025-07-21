import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { PlayerController } from './PlayerController.js';
import { Object3D } from './Object3D.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { RemotePlayer } from './RemotePlayer.js';
import { ChatSystem } from '../ui/ChatSystem.js';
import { AssetManager } from './AssetManager.js';
import { ItemCatalog } from '../ui/ItemCatalog.js';
import { CommandParser } from './CommandParser.js';
import { ObstacleCourseGame } from './ObstacleCourseGame.js';
import { SimpleTreasureGame } from './SimpleTreasureGame.js';

export class Game3D {
    constructor(container) {
        this.container = container;
        
        // Configuración optimizada
        this.config = {
            width: window.innerWidth,
            height: window.innerHeight,
            fov: 75,
            near: 0.1,
            far: 1000,
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
        this.assetManager = new AssetManager();
        this.itemCatalog = null;
        this.commandParser = new CommandParser();
        this.obstacleGame = null; // Se inicializará después de setupPlayerControllerCallbacks
        this.simpleTreasureGame = null; // Se inicializará después de setupPlayerControllerCallbacks
        
        // Colecciones con límites
        this.objects = new Map();
        this.remotePlayers = new Map();
        
        // Ambiente 3D
        this.environmentModel = null;
        this.groundMesh = null;
        
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
            
            // NO posicionar la cámara aquí, dejar que PlayerController lo haga
            
            // Buscar canvas
            const canvas = this.container.querySelector('#canvas');
            
            if (!canvas) {
                throw new Error('Canvas no encontrado');
            }
            
            // Crear renderer
            this.renderer = new THREE.WebGLRenderer({ 
                antialias: true,
                canvas: canvas
            });
            this.renderer.setSize(this.config.width, this.config.height);
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            
            // Configurar iluminación
            this.setupLighting();
            
            // Crear suelo
            this.createGround();
            
            // Cargar ambiente 3D
            await this.loadEnvironment3D();
            
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
            
            // Precargar assets comunes en segundo plano
            this.assetManager.preloadCommonAssets();
            
            // Inicializar catálogo de items
            this.itemCatalog = new ItemCatalog(this);
            
            // Inicializar minijuegos después del player controller
            this.obstacleGame = new ObstacleCourseGame(this);
            console.log('🎮 ObstacleGame inicializado:', this.obstacleGame);
            
            try {
                this.simpleTreasureGame = new SimpleTreasureGame(this);
                console.log('🎯 SimpleTreasureGame inicializado:', this.simpleTreasureGame);
            } catch (error) {
                console.error('❌ Error inicializando SimpleTreasureGame:', error);
                this.simpleTreasureGame = null;
            }
            
            // Marcar como inicializado
            this.isInitialized = true;
            
            // Iniciar loop de renderizado
            this.animate();
            
        } catch (error) {
            console.error('❌ Error en init:', error);
            throw error;
        }
    }
    
    setupLighting() {
        // Luz ambiental más brillante
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
        this.scene.add(ambientLight);
        
        // Luz direccional (sol) más intensa
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(50, 100, 50);
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
        const frontLight = new THREE.DirectionalLight(0xffffff, 0.8);
        frontLight.position.set(0, 50, 100);
        this.scene.add(frontLight);
        
        // Luz adicional desde arriba
        const topLight = new THREE.DirectionalLight(0xffffff, 0.6);
        topLight.position.set(0, 100, 0);
        this.scene.add(topLight);
    }
    
    createGround() {
        // Crear suelo discreto para el ambiente urbano
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333, // Gris oscuro para asfalto
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.3 // Semi-transparente para no interferir con el ambiente
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5; // Bajo el nivel del suelo para no interferir
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Guardar referencia del suelo para poder ocultarlo si es necesario
        this.groundMesh = ground;
    }
    
    async loadEnvironment3D() {
        try {
            console.log('🏙️ Cargando ambiente 3D...');
            this.showChatMessage('🏙️ Cargando ambiente 3D...');
            
            // Verificar que los loaders estén disponibles
            console.log('🔍 Verificando loaders:', { OBJLoader: !!OBJLoader, MTLLoader: !!MTLLoader });
            if (!OBJLoader || !MTLLoader) {
                throw new Error('Loaders OBJ/MTL no disponibles');
            }
            
            // Crear loader para archivos OBJ
            const objLoader = new OBJLoader();
            const mtlLoader = new MTLLoader();
            
            // Configurar el MTLLoader para cargar texturas desde la carpeta correcta
            mtlLoader.setPath('/assets/9btvoxf8n0cg-3dt/textures/');
            
            // Configurar rutas de los archivos
            const objPath = '/assets/9btvoxf8n0cg-3dt/Street environment_V01.obj';
            const mtlPath = '/assets/9btvoxf8n0cg-3dt/Street environment_V01.mtl';
            
            console.log('📁 Rutas de archivos:', { objPath, mtlPath });
            
            // Verificar si el archivo existe
            try {
                const response = await fetch(objPath, { method: 'HEAD' });
                if (!response.ok) {
                    throw new Error(`Archivo no encontrado: ${objPath}`);
                }
                console.log('✅ Archivo OBJ encontrado');
            } catch (error) {
                console.error('❌ Error verificando archivo:', error);
                this.showChatMessage('❌ Archivo OBJ no encontrado, creando ambiente de prueba');
                this.createTestEnvironment();
                return;
            }
            
            // Intentar cargar el modelo OBJ con materiales
            const model = await new Promise((resolve, reject) => {
                // Primero intentar cargar materiales
                mtlLoader.load(
                    mtlPath,
                    (materials) => {
                        console.log('✅ Materiales cargados:', materials);
                        materials.preload();
                        
                        // Configurar loader con materiales
                        objLoader.setMaterials(materials);
                        
                        // Cargar modelo con materiales
                        objLoader.load(
                            objPath,
                            (object) => {
                                console.log('✅ Modelo 3D cargado con materiales:', object);
                                resolve(object);
                            },
                            (progress) => {
                                const percent = progress.loaded / progress.total * 100;
                                console.log('🏗️ Cargando modelo:', percent.toFixed(1) + '%');
                                this.showChatMessage(`🏗️ Cargando modelo: ${percent.toFixed(1)}%`);
                            },
                            (error) => {
                                console.error('❌ Error cargando modelo OBJ:', error);
                                reject(error);
                            }
                        );
                    },
                    (progress) => {
                        const percent = progress.loaded / progress.total * 100;
                        console.log('📦 Cargando materiales:', percent.toFixed(1) + '%');
                        this.showChatMessage(`📦 Cargando materiales: ${percent.toFixed(1)}%`);
                    },
                    (error) => {
                        console.warn('⚠️ Error cargando materiales, intentando sin texturas:', error);
                        this.showChatMessage('⚠️ Cargando sin texturas...');
                        
                        // Cargar modelo sin materiales
                        objLoader.load(
                            objPath,
                            (object) => {
                                console.log('✅ Modelo 3D cargado sin materiales:', object);
                                resolve(object);
                            },
                            (progress) => {
                                const percent = progress.loaded / progress.total * 100;
                                console.log('🏗️ Cargando modelo:', percent.toFixed(1) + '%');
                                this.showChatMessage(`🏗️ Cargando modelo: ${percent.toFixed(1)}%`);
                            },
                            (error) => {
                                console.error('❌ Error cargando modelo OBJ:', error);
                                reject(error);
                            }
                        );
                    }
                );
            });
            
            // Configurar el modelo con escala apropiada
            model.scale.set(1, 1, 1); // Escala mucho más grande
            model.position.set(0, 0, 0); // Centrar en el origen
            model.rotation.y = 0; // Rotación si es necesario
            
            console.log('📏 Modelo configurado con escala:', model.scale);
            
            // Habilitar sombras y colisiones para todos los objetos del modelo
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Agregar colisiones al modelo
                    child.userData.isCollisionObject = true;
                    child.userData.isEnvironmentObject = true;
                    
                    // Mejorar materiales
                    if (!child.material) {
                        // Material básico si no tiene material
                        child.material = new THREE.MeshLambertMaterial({ 
                            color: 0x888888,
                            side: THREE.DoubleSide 
                        });
                    } else {
                        // Mejorar material existente
                        child.material.side = THREE.DoubleSide;
                        
                        // Verificar si tiene textura
                        if (child.material.map) {
                            console.log('🎨 Textura encontrada para:', child.name, 'textura:', child.material.map.source.data?.src || 'sin src');
                            // Configurar la textura correctamente
                            child.material.map.wrapS = THREE.RepeatWrapping;
                            child.material.map.wrapT = THREE.RepeatWrapping;
                            child.material.map.flipY = false; // Importante para archivos TGA
                        } else {
                            // Si el material no tiene textura, usar colores básicos
                            let color = 0x888888; // Color por defecto
                            
                            if (child.name.toLowerCase().includes('road') || child.name.toLowerCase().includes('street')) {
                                color = 0x333333; // Asfalto oscuro
                            } else if (child.name.toLowerCase().includes('building') || child.name.toLowerCase().includes('wall')) {
                                color = 0x666666; // Edificio gris
                            } else if (child.name.toLowerCase().includes('window')) {
                                color = 0x87CEEB; // Ventana azul claro
                            } else if (child.name.toLowerCase().includes('door')) {
                                color = 0x8B4513; // Puerta marrón
                            } else if (child.name.toLowerCase().includes('roof')) {
                                color = 0x444444; // Techo oscuro
                            }
                            
                            child.material.color.setHex(color);
                        }
                    }
                    
                    console.log('🏗️ Mesh procesado:', child.name || 'sin nombre', 'color:', child.material.color.getHexString(), 'colisión:', !!child.userData.isCollisionObject);
                }
            });
            
            // Agregar a la escena
            this.scene.add(model);
            
            // Guardar referencia del modelo
            this.environmentModel = model;
            
            console.log('🏙️ Ambiente 3D cargado exitosamente');
            this.showChatMessage('✅ Ambiente 3D cargado con texturas reales');
            this.showChatMessage('🏙️ ¡Modelo urbano completo cargado!');
            
        } catch (error) {
            console.error('❌ Error cargando ambiente 3D:', error);
            this.showChatMessage('❌ Error cargando ambiente 3D: ' + error.message);
            
            // Crear un objeto de prueba para verificar que la escena funciona
            this.createTestEnvironment();
        }
    }
    
    createTestEnvironment() {
        console.log('🧪 Creando ambiente de prueba...');
        
        // Crear algunos edificios básicos
        const buildingGeometry = new THREE.BoxGeometry(10, 20, 10);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        // Crear material para edificios con colores diferentes
        const buildingMaterial1 = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const buildingMaterial2 = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const buildingMaterial3 = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        // Edificio 1
        const building1 = new THREE.Mesh(buildingGeometry, buildingMaterial1);
        building1.position.set(-15, 10, -15);
        building1.castShadow = true;
        building1.receiveShadow = true;
        building1.name = 'test_building_1';
        this.scene.add(building1);
        
        // Edificio 2
        const building2 = new THREE.Mesh(buildingGeometry, buildingMaterial2);
        building2.position.set(15, 10, 15);
        building2.castShadow = true;
        building2.receiveShadow = true;
        building2.name = 'test_building_2';
        this.scene.add(building2);
        
        // Edificio 3 (más cerca)
        const building3 = new THREE.Mesh(buildingGeometry, buildingMaterial3);
        building3.position.set(0, 10, -20);
        building3.castShadow = true;
        building3.receiveShadow = true;
        building3.name = 'test_building_3';
        this.scene.add(building3);
        
        // Calle principal
        const roadGeometry = new THREE.PlaneGeometry(50, 50);
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.1;
        road.receiveShadow = true;
        road.name = 'test_road';
        this.scene.add(road);
        
        // Líneas de la calle
        const lineGeometry = new THREE.PlaneGeometry(40, 0.5);
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.y = 0.15;
        line.name = 'test_road_line';
        this.scene.add(line);
        
        // Farolas
        const lampGeometry = new THREE.CylinderGeometry(0.2, 0.2, 8);
        const lampMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        for (let i = 0; i < 4; i++) {
            const lamp = new THREE.Mesh(lampGeometry, lampMaterial);
            const angle = (i * Math.PI) / 2;
            lamp.position.set(Math.cos(angle) * 20, 4, Math.sin(angle) * 20);
            lamp.castShadow = true;
            lamp.receiveShadow = true;
            lamp.name = `test_lamp_${i}`;
            this.scene.add(lamp);
        }
        
        // Bancas en el parque
        const benchGeometry = new THREE.BoxGeometry(3, 0.5, 1);
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 3; i++) {
            const bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.set(-5 + i * 5, 0.25, 10);
            bench.castShadow = true;
            bench.receiveShadow = true;
            bench.name = `test_bench_${i}`;
            this.scene.add(bench);
        }
        
        // Árboles
        const treeTrunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4);
        const treeTrunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const treeLeavesGeometry = new THREE.SphereGeometry(2, 8, 8);
        const treeLeavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < 4; i++) {
            const trunk = new THREE.Mesh(treeTrunkGeometry, treeTrunkMaterial);
            const leaves = new THREE.Mesh(treeLeavesGeometry, treeLeavesMaterial);
            
            const angle = (i * Math.PI) / 2 + Math.PI / 4;
            const radius = 25;
            trunk.position.set(Math.cos(angle) * radius, 2, Math.sin(angle) * radius);
            leaves.position.set(Math.cos(angle) * radius, 5, Math.sin(angle) * radius);
            
            trunk.castShadow = true;
            trunk.receiveShadow = true;
            leaves.castShadow = true;
            leaves.receiveShadow = true;
            
            trunk.name = `test_tree_trunk_${i}`;
            leaves.name = `test_tree_leaves_${i}`;
            
            this.scene.add(trunk);
            this.scene.add(leaves);
        }
        
        console.log('🧪 Ambiente de prueba creado con 21 objetos');
        this.showChatMessage('🧪 Ambiente de prueba creado: 3 edificios, calle, 4 farolas, 3 bancas, 4 árboles');
    }
    
    clearTestEnvironment() {
        console.log('🧹 Limpiando objetos del ambiente de prueba...');
        
        const objectsToRemove = [];
        this.scene.traverse((object) => {
            if (object.isMesh && object.name && object.name.startsWith('test_')) {
                objectsToRemove.push(object);
            }
        });
        
        objectsToRemove.forEach((object) => {
            this.scene.remove(object);
            console.log('🗑️ Removido:', object.name);
        });
        
        console.log(`🧹 Limpiados ${objectsToRemove.length} objetos del ambiente`);
        this.showChatMessage(`🧹 Limpiados ${objectsToRemove.length} objetos del ambiente`);
    }
    
    showEnvironmentInfo() {
        const environmentObjects = {};
        
        this.scene.traverse((object) => {
            if (object.isMesh && object.name && object.name.startsWith('test_')) {
                const type = object.name.split('_')[1];
                environmentObjects[type] = (environmentObjects[type] || 0) + 1;
            }
        });
        
        let info = '🏙️ Objetos del ambiente:\n';
        for (const [type, count] of Object.entries(environmentObjects)) {
            info += `• ${type}: ${count}\n`;
        }
        
        console.log(info);
        this.showChatMessage(info);
    }
    
    async extractTextures() {
        try {
            console.log('📦 Intentando extraer texturas...');
            this.showChatMessage('📦 Intentando extraer texturas...');
            
            // Verificar si existe el archivo RAR
            const rarPath = '/assets/9btvoxf8n0cg-3dt/textures.rar';
            const response = await fetch(rarPath, { method: 'HEAD' });
            
            if (!response.ok) {
                throw new Error('Archivo textures.rar no encontrado');
            }
            
            console.log('✅ Archivo textures.rar encontrado');
            this.showChatMessage('✅ Archivo encontrado. Para extraer:');
            this.showChatMessage('1. Instala "The Unarchiver" desde Mac App Store');
            this.showChatMessage('2. Haz doble clic en textures.rar');
            this.showChatMessage('3. Escribe "cargar ambiente" para recargar');
            
        } catch (error) {
            console.error('❌ Error verificando texturas:', error);
            this.showChatMessage('❌ Error: ' + error.message);
        }
    }
    
    async checkTextures() {
        try {
            console.log('🔍 Verificando texturas...');
            this.showChatMessage('🔍 Verificando texturas...');
            
            // Verificar si existe la carpeta de texturas
            const texturePath = '/assets/9btvoxf8n0cg-3dt/textures/';
            const response = await fetch(texturePath, { method: 'HEAD' });
            
            if (response.ok) {
                console.log('✅ Carpeta de texturas encontrada');
                this.showChatMessage('✅ Texturas disponibles');
                this.showChatMessage('Escribe "cargar ambiente" para aplicar');
            } else {
                console.log('❌ Carpeta de texturas no encontrada');
                this.showChatMessage('❌ Texturas no encontradas');
            }
            
        } catch (error) {
            console.error('❌ Error verificando texturas:', error);
            this.showChatMessage('❌ Error: ' + error.message);
        }
    }
    
    diagnoseLoaders() {
        console.log('🔍 Diagnóstico de loaders...');
        this.showChatMessage('🔍 Diagnóstico de loaders...');
        
        // Verificar importaciones
        console.log('📦 OBJLoader disponible:', !!OBJLoader);
        console.log('📦 MTLLoader disponible:', !!MTLLoader);
        console.log('📦 THREE disponible:', !!THREE);
        
        this.showChatMessage(`📦 OBJLoader: ${!!OBJLoader ? '✅' : '❌'}`);
        this.showChatMessage(`📦 MTLLoader: ${!!MTLLoader ? '✅' : '❌'}`);
        this.showChatMessage(`📦 THREE: ${!!THREE ? '✅' : '❌'}`);
        
        // Verificar constructores
        try {
            const testObjLoader = new OBJLoader();
            console.log('✅ OBJLoader constructor funciona');
            this.showChatMessage('✅ OBJLoader constructor funciona');
        } catch (error) {
            console.error('❌ Error con OBJLoader constructor:', error);
            this.showChatMessage('❌ Error con OBJLoader constructor');
        }
        
        try {
            const testMtlLoader = new MTLLoader();
            console.log('✅ MTLLoader constructor funciona');
            this.showChatMessage('✅ MTLLoader constructor funciona');
        } catch (error) {
            console.error('❌ Error con MTLLoader constructor:', error);
            this.showChatMessage('❌ Error con MTLLoader constructor');
        }
    }
    
    checkEnvironmentCollisions() {
        console.log('🔍 Verificando colisiones del ambiente...');
        this.showChatMessage('🔍 Verificando colisiones del ambiente...');
        
        if (!this.environmentModel) {
            this.showChatMessage('❌ No hay modelo de ambiente cargado');
            return;
        }
        
        let collisionCount = 0;
        let meshCount = 0;
        
        this.environmentModel.traverse((child) => {
            if (child.isMesh) {
                meshCount++;
                if (child.userData.isCollisionObject) {
                    collisionCount++;
                    console.log('✅ Colisión activa en:', child.name || 'sin nombre');
                } else {
                    console.log('❌ Sin colisión en:', child.name || 'sin nombre');
                }
            }
        });
        
        console.log(`📊 Total de meshes: ${meshCount}, Con colisiones: ${collisionCount}`);
        this.showChatMessage(`📊 Meshes: ${meshCount}, Colisiones: ${collisionCount}`);
        
        if (collisionCount === 0) {
            this.showChatMessage('⚠️ ¡No hay colisiones activas!');
        } else {
            this.showChatMessage('✅ Colisiones configuradas correctamente');
        }
    }
    
    createTestObject() {
        console.log('🔍 Creando objeto de prueba...');
        
        // Crear un cubo rojo grande y visible
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0xff0000, // Rojo brillante
            transparent: true,
            opacity: 0.9
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1, 0); // En el centro, sobre el suelo
        cube.castShadow = true;
        cube.receiveShadow = true;
        this.scene.add(cube);
        
        console.log('✅ Cubo de prueba creado en posición:', cube.position);
        
        // Crear una esfera azul
        const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
        const sphereMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x0000ff, // Azul brillante
            transparent: true,
            opacity: 0.9
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(5, 1, 0); // A la derecha del cubo
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        this.scene.add(sphere);
        
        console.log('✅ Esfera de prueba creada en posición:', sphere.position);
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
        
        // Eventos del juego (minijuegos)
        this.networkManager.on('onGameEvent', (event) => {
            console.log('🎮 Callback onGameEvent ejecutado con evento:', event.type);
            this.processGameEvent(event);
        });
        console.log('✅ Callback onGameEvent registrado');
        
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
                effects: [],
                description: objectData.name, // Agregar descripción para assets
                specificAsset: objectData.specificAsset // Agregar asset específico
            };
            
            // Crear el mesh usando el mismo sistema que generateObject
            const mesh = await this.createMeshFromData(analysis);
            
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
                const normalizedScale = this.normalizeScale(objectData.scale);
                
                console.log(`Aplicando escala a objeto ${objectData.name}:`, {
                    original: objectData.scale,
                    normalized: normalizedScale
                });
                
                mesh.scale.set(normalizedScale.x, normalizedScale.y, normalizedScale.z);
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
    
    async generateObject(description, customPosition = null) {
        try {
            // Verificar límite de objetos
            if (this.objects.size >= this.config.maxObjects) {
                this.showChatMessage('⚠️ Límite de objetos alcanzado');
                return;
            }
            
            // Parsear el comando usando el CommandParser
            const parsedCommand = this.commandParser.parseCommand(description);
            
            // Si no se encontró un objeto válido, mostrar error
            if (!parsedCommand.object || parsedCommand.object.trim() === '') {
                this.showChatMessage('❌ No se pudo identificar el objeto a crear');
                return;
            }
            
            // Calcular posición de spawn
            let spawnPosition;
            if (customPosition) {
                spawnPosition = new THREE.Vector3(customPosition.x, customPosition.y, customPosition.z);
            } else {
                // Obtener posición del jugador
                const playerPosition = this.playerController.getPosition();
                const cameraDirection = new THREE.Vector3();
                this.camera.getWorldDirection(cameraDirection);
                
                // Posición delante del jugador (a 3 metros de distancia)
                spawnPosition = playerPosition.clone().add(cameraDirection.multiplyScalar(3));
                spawnPosition.y = 1; // Elevar un poco del suelo
            }
            
            // Usar el objeto parseado y aplicar modificadores
            const finalDescription = this.commandParser.generateDescription(parsedCommand);
            const objectData = this.analyzeAndCreateObjectWithModifiers(parsedCommand, spawnPosition);
            
            // Crear el objeto en la escena
            const mesh = await this.createMeshFromData(objectData);
            
            // Verificar colisiones y encontrar posición libre
            console.log(`🔍 Verificando colisiones para: ${description}`);
            console.log(`📍 Posición base: ${spawnPosition.x.toFixed(2)}, ${spawnPosition.y.toFixed(2)}, ${spawnPosition.z.toFixed(2)}`);
            console.log(`📦 Objetos existentes: ${this.objects.size}`);
            
            const freePosition = this.findFreeSpawnPosition(spawnPosition, mesh);
            console.log(`✅ Posición final: ${freePosition.x.toFixed(2)}, ${freePosition.y.toFixed(2)}, ${freePosition.z.toFixed(2)}`);
            
            mesh.position.copy(freePosition);
            
            // Capturar el asset específico usado si es un asset 3D
            let specificAsset = null;
            if (mesh.userData && mesh.userData.assetName) {
                specificAsset = mesh.userData.assetName;
            }
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
            
            // Registrar obstáculo en el minijuego si está activo
            if (this.obstacleGame && this.obstacleGame.isActive) {
                this.obstacleGame.registerObstacle(objectId, description, 'local');
            }
            
            // Agregar para interacción
            this.playerController.addInteractableObject(simpleObject);
            
            // Enviar al servidor si estamos en multijugador
            if (this.isMultiplayer && this.networkManager && this.networkManager.isConnected) {
                const normalizedScale = this.normalizeScale(mesh.scale);
                
                console.log(`Enviando objeto al servidor: ${description}`, {
                    originalScale: mesh.scale,
                    normalizedScale: normalizedScale
                });
                
                this.networkManager.sendObjectCreate({
                    type: objectData.type,
                    name: description,
                    specificAsset: specificAsset, // Incluir el asset específico
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
                    scale: normalizedScale,
                    material: objectData.material,
                    color: objectData.color,
                    physics: true
                });
            }
            
            this.showChatMessage(`🎨 Creado: ${finalDescription}`);
            
            // Retornar el objectId para que otros sistemas puedan usarlo
            return objectId;
            
        } catch (error) {
            console.error('❌ Error al generar objeto:', error);
            this.showChatMessage('❌ Error al crear objeto');
            return null;
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
        
        // Análisis avanzado de la descripción
        const analysis = {
            type: 'cube',
            size: { x: 1, y: 1, z: 1 },
            color: this.generateRandomColor(),
            material: 'basic',
            effects: [],
            complexity: 'medium',
            texture: null,
            animation: null,
            description: description // Agregar la descripción original
        };
        
        // Sistema expandido de detección de tipos (50+ categorías)
        const typePatterns = {
            // NATURALEZA
            'tree': ['árbol', 'tree', 'planta', 'roble', 'pino', 'palmera', 'sauce', 'cedro', 'abeto', 'olivo'],
            'flower': ['flor', 'flower', 'rosa', 'tulipán', 'margarita', 'girasol', 'lirio', 'orquídea', 'crisantemo'],
            'rock': ['roca', 'rock', 'piedra', 'peña', 'montaña', 'colina', 'acantilado', 'guijarro'],
            'water': ['agua', 'water', 'río', 'lago', 'mar', 'océano', 'cascada', 'fuente', 'estanque', 'arroyo'],
            
            // CONSTRUCCIONES
            'house': ['casa', 'house', 'hogar', 'vivienda', 'cabaña', 'chalet', 'mansión', 'palacio', 'castillo'],
            'tower': ['torre', 'tower', 'campanario', 'minarete', 'faro', 'observatorio', 'fortaleza'],
            'bridge': ['puente', 'bridge', 'viaducto', 'pasarela', 'acueducto'],
            'wall': ['muro', 'wall', 'pared', 'valla', 'empalizada', 'fortificación'],
            'door': ['puerta', 'door', 'portal', 'entrada', 'portón', 'verja'],
            'window': ['ventana', 'window', 'vidriera', 'lucernario', 'ojo de buey'],
            
            // VEHÍCULOS
            'car': ['coche', 'car', 'auto', 'automóvil', 'sedán', 'deportivo', 'camión', 'furgoneta'],
            'airplane': ['avión', 'airplane', 'aeroplano', 'jet', 'helicóptero', 'dirigible', 'globo'],
            'ship': ['barco', 'ship', 'navío', 'velero', 'yate', 'submarino', 'bote', 'canoa'],
            'train': ['tren', 'train', 'locomotora', 'vagón', 'metro', 'tranvía'],
            'bicycle': ['bicicleta', 'bicycle', 'bike', 'moto', 'motocicleta', 'scooter'],
            'spaceship': ['nave', 'spaceship', 'cohete', 'satélite', 'estación espacial', 'ovni'],
            
            // ANIMALES
            'mammal': ['mamífero', 'mammal', 'perro', 'gato', 'caballo', 'vaca', 'cerdo', 'oveja', 'conejo'],
            'bird': ['ave', 'bird', 'pájaro', 'águila', 'halcón', 'búho', 'cuervo', 'paloma', 'loro'],
            'fish': ['pez', 'fish', 'tiburón', 'ballena', 'delfín', 'trucha', 'salmón', 'atún'],
            'reptile': ['reptil', 'reptile', 'serpiente', 'lagarto', 'tortuga', 'cocodrilo', 'iguana'],
            'dragon': ['dragón', 'dragon', 'wyvern', 'serpiente alada', 'bestia mítica'],
            'unicorn': ['unicornio', 'unicorn', 'caballo mágico', 'criatura mítica'],
            
            // OBJETOS MÁGICOS
            'crystal': ['cristal', 'crystal', 'gema', 'joya', 'diamante', 'rubí', 'esmeralda', 'zafiro'],
            'wand': ['varita', 'wand', 'bastón', 'cetro', 'báculo', 'cayado'],
            'potion': ['poción', 'potion', 'elixir', 'brebaje', 'tintura', 'medicina'],
            'scroll': ['pergamino', 'scroll', 'libro', 'tomo', 'grimorio', 'enciclopedia'],
            'orb': ['orbe', 'orb', 'esfera mágica', 'bola de cristal', 'globo'],
            
            // MUEBLES
            'chair': ['silla', 'chair', 'asiento', 'taburete', 'sofá', 'butaca', 'trono'],
            'table': ['mesa', 'table', 'escritorio', 'mostrador', 'mesita', 'pedestal'],
            'bed': ['cama', 'bed', 'lecho', 'hamaca', 'colchón', 'litera'],
            'cabinet': ['armario', 'cabinet', 'gabinete', 'estantería', 'biblioteca', 'cómoda'],
            'lamp': ['lámpara', 'lamp', 'farol', 'linterna', 'candelabro', 'vela'],
            
            // INSTRUMENTOS
            'piano': ['piano', 'teclado', 'órgano', 'sintetizador', 'acordeón'],
            'guitar': ['guitarra', 'guitar', 'violín', 'viola', 'cello', 'contrabajo'],
            'drum': ['tambor', 'drum', 'batería', 'timbal', 'bongo', 'pandereta'],
            'flute': ['flauta', 'flute', 'clarinete', 'saxofón', 'trompeta', 'trombón'],
            
            // HERRAMIENTAS
            'hammer': ['martillo', 'hammer', 'mazo', 'machacador', 'pilon'],
            'axe': ['hacha', 'axe', 'machete', 'espada', 'daga', 'cuchillo'],
            'saw': ['sierra', 'saw', 'serrucho', 'cortador', 'tijera'],
            'drill': ['taladro', 'drill', 'perforador', 'broca', 'destornillador'],
            
            // TECNOLOGÍA
            'computer': ['computadora', 'computer', 'ordenador', 'laptop', 'tablet', 'smartphone'],
            'robot': ['robot', 'androide', 'autómata', 'cyborg', 'dron'],
            'screen': ['pantalla', 'screen', 'monitor', 'televisor', 'proyector'],
            'console': ['consola', 'console', 'controlador', 'joystick', 'gamepad'],
            
            // ALIMENTOS
            'fruit': ['fruta', 'fruit', 'manzana', 'naranja', 'plátano', 'uva', 'fresa'],
            'cake': ['pastel', 'cake', 'torta', 'galleta', 'pan', 'bollo', 'dulce'],
            'drink': ['bebida', 'drink', 'agua', 'leche', 'jugo', 'refresco', 'café'],
            
            // FORMAS GEOMÉTRICAS
            'sphere': ['esfera', 'sphere', 'bola', 'globo', 'pelota', 'mármol'],
            'cube': ['cubo', 'cube', 'caja', 'dado', 'bloque', 'ladrillo'],
            'cylinder': ['cilindro', 'cylinder', 'tubo', 'pilar', 'columna', 'poste'],
            'cone': ['cono', 'cone', 'pirámide', 'campana', 'embudo'],
            'torus': ['toro', 'torus', 'donut', 'anillo', 'aro', 'rosquilla'],
            'pyramid': ['pirámide', 'pyramid', 'tetraedro', 'octaedro', 'dodecaedro'],
            
            // ELEMENTOS NATURALES
            'fire': ['fuego', 'fire', 'llama', 'hoguera', 'antorcha', 'vela'],
            'ice': ['hielo', 'ice', 'nieve', 'glaciar', 'carámbano', 'cristal de hielo'],
            'cloud': ['nube', 'cloud', 'niebla', 'vapor', 'humo', 'bruma'],
            'lightning': ['rayo', 'lightning', 'electricidad', 'chispa', 'relámpago'],
            
            // OBJETOS DECORATIVOS
            'statue': ['estatua', 'statue', 'escultura', 'busto', 'figura', 'monumento'],
            'painting': ['pintura', 'painting', 'cuadro', 'retrato', 'paisaje', 'mural'],
            'mirror': ['espejo', 'mirror', 'reflejo', 'superficie reflectante'],
            'clock': ['reloj', 'clock', 'cronómetro', 'temporizador', 'sundial'],
            
            // OBJETOS MISCELÁNEOS
            'balloon': ['globo', 'balloon', 'burbuja', 'bomba', 'pompa'],
            'umbrella': ['paraguas', 'umbrella', 'sombrilla', 'quitasol'],
            'flag': ['bandera', 'flag', 'estandarte', 'pancarta', 'pendón'],
            'key': ['llave', 'key', 'candado', 'cerradura', 'cerrojo'],
            'book': ['libro', 'book', 'revista', 'periódico', 'diario', 'cuaderno'],
            'phone': ['teléfono', 'phone', 'móvil', 'celular', 'walkie-talkie'],
            'bag': ['bolsa', 'bag', 'mochila', 'maleta', 'cartera', 'billetera'],
            'hat': ['sombrero', 'hat', 'gorra', 'casco', 'corona', 'tiara'],
            'shoe': ['zapato', 'shoe', 'bota', 'sandalia', 'tenis', 'zapatilla']
        };

        for (const [type, keywords] of Object.entries(typePatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.type = type;
                break;
            }
        }
        
        // Detectar tema
        const themePatterns = {
            'fantasy': ['mágico', 'magical', 'fantasía', 'fantasy', 'hechizo', 'encantado', 'místico', 'sobrenatural'],
            'sci-fi': ['futurista', 'futuristic', 'tecnológico', 'technological', 'espacial', 'space', 'robot', 'cyber'],
            'nature': ['natural', 'nature', 'orgánico', 'organic', 'silvestre', 'wild', 'rústico', 'rustic'],
            'medieval': ['medieval', 'antiguo', 'ancient', 'castillo', 'castle', 'caballero', 'knight', 'armadura'],
            'modern': ['moderno', 'modern', 'contemporáneo', 'contemporary', 'urbano', 'urban', 'industrial'],
            'steampunk': ['steampunk', 'vapor', 'steam', 'mecánico', 'mechanical', 'engranaje', 'gear'],
            'cute': ['lindo', 'cute', 'adorable', 'adorable', 'tierno', 'sweet', 'kawaii'],
            'scary': ['aterrador', 'scary', 'horror', 'terror', 'siniestro', 'sinister', 'oscuro', 'dark'],
            'elegant': ['elegante', 'elegant', 'sofisticado', 'sophisticated', 'lujoso', 'luxury', 'refinado'],
            'cartoon': ['cartoon', 'animado', 'animated', 'caricatura', 'dibujo', 'drawing', 'comic']
        };

        for (const [theme, keywords] of Object.entries(themePatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.theme = theme;
                break;
            }
        }

        // Detectar tamaño
        if (lowerDesc.includes('grande') || lowerDesc.includes('big') || lowerDesc.includes('enorme')) {
            analysis.size = { x: 2, y: 2, z: 2 };
        } else if (lowerDesc.includes('pequeño') || lowerDesc.includes('small') || lowerDesc.includes('mini')) {
            analysis.size = { x: 0.5, y: 0.5, z: 0.5 };
        } else if (lowerDesc.includes('gigante') || lowerDesc.includes('huge')) {
            analysis.size = { x: 3, y: 3, z: 3 };
        }

        // Detectar color expandido
        const colorPatterns = {
            'rojo': ['rojo', 'red', 'carmesí', 'crimson', 'escarlata', 'scarlet', 'granate', 'burgundy'],
            'azul': ['azul', 'blue', 'celeste', 'sky blue', 'navy', 'marino', 'cobalto', 'cobalt'],
            'verde': ['verde', 'green', 'esmeralda', 'emerald', 'oliva', 'olive', 'menta', 'mint'],
            'amarillo': ['amarillo', 'yellow', 'dorado', 'golden', 'lima', 'lime', 'crema', 'cream'],
            'naranja': ['naranja', 'orange', 'mandarina', 'tangerine', 'melocotón', 'peach', 'coral'],
            'morado': ['morado', 'purple', 'violeta', 'violet', 'lavanda', 'lavender', 'púrpura'],
            'rosa': ['rosa', 'pink', 'fucsia', 'fuchsia', 'magenta', 'salmon', 'salmón'],
            'marrón': ['marrón', 'brown', 'café', 'coffee', 'chocolate', 'caramelo', 'caramel'],
            'negro': ['negro', 'black', 'ébano', 'ebony', 'carbón', 'charcoal'],
            'blanco': ['blanco', 'white', 'nieve', 'snow', 'perla', 'pearl', 'hueso', 'bone'],
            'gris': ['gris', 'gray', 'gris', 'grey', 'plata', 'silver', 'acero', 'steel'],
            'dorado': ['dorado', 'gold', 'oro', 'bronce', 'bronze', 'latón', 'brass'],
            'plateado': ['plateado', 'silver', 'plata', 'aluminio', 'aluminum', 'cromo', 'chrome'],
            'cobre': ['cobre', 'copper', 'bronce', 'bronze', 'latón', 'brass'],
            'turquesa': ['turquesa', 'turquoise', 'aguamarina', 'aquamarine', 'cian', 'cyan'],
            'magenta': ['magenta', 'fucsia', 'fuchsia', 'púrpura', 'purple'],
            'cyan': ['cyan', 'cian', 'turquesa', 'turquoise', 'aguamarina'],
            'índigo': ['índigo', 'indigo', 'añil', 'azul profundo', 'deep blue'],
            'ámbar': ['ámbar', 'amber', 'ámbar', 'miel', 'honey', 'caramelo'],
            'jade': ['jade', 'esmeralda', 'emerald', 'verde jade', 'jade green'],
            'rubí': ['rubí', 'ruby', 'rojo rubí', 'ruby red', 'granate'],
            'zafiro': ['zafiro', 'sapphire', 'azul zafiro', 'sapphire blue'],
            'diamante': ['diamante', 'diamond', 'cristal', 'crystal', 'transparente'],
            'perla': ['perla', 'pearl', 'nacar', 'mother of pearl', 'iridiscente'],
            'arcoíris': ['arcoíris', 'rainbow', 'multicolor', 'multicolor', 'policromático'],
            'neón': ['neón', 'neon', 'fluorescente', 'fluorescent', 'brillante'],
            'pastel': ['pastel', 'suave', 'soft', 'claro', 'light', 'pálido'],
            'metálico': ['metálico', 'metallic', 'brillante', 'shiny', 'reflectante'],
            'transparente': ['transparente', 'transparent', 'cristalino', 'crystalline', 'claro'],
            'translúcido': ['translúcido', 'translucent', 'semi-transparente', 'semi-transparent']
        };

        for (const [color, keywords] of Object.entries(colorPatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.color = this.getColorValue(color);
                break;
            }
        }

        // Detectar material expandido
        const materialPatterns = {
            'madera': ['madera', 'wood', 'pino', 'pine', 'roble', 'oak', 'cedro', 'cedar', 'caoba', 'mahogany'],
            'piedra': ['piedra', 'stone', 'mármol', 'marble', 'granito', 'granite', 'pizarra', 'slate'],
            'metal': ['metal', 'hierro', 'iron', 'acero', 'steel', 'aluminio', 'aluminum', 'cobre', 'copper'],
            'cristal': ['cristal', 'glass', 'vidrio', 'cristalino', 'crystalline', 'transparente'],
            'tela': ['tela', 'fabric', 'algodón', 'cotton', 'seda', 'silk', 'lana', 'wool', 'lino', 'linen'],
            'cuero': ['cuero', 'leather', 'piel', 'skin', 'ante', 'suede'],
            'plástico': ['plástico', 'plastic', 'pvc', 'poliéster', 'polyester', 'nylon', 'nylon'],
            'goma': ['goma', 'rubber', 'caucho', 'elástico', 'elastic', 'flexible'],
            'cerámica': ['cerámica', 'ceramic', 'porcelana', 'porcelain', 'arcilla', 'clay'],
            'papel': ['papel', 'paper', 'cartón', 'cardboard', 'pergamino', 'parchment'],
            'oro': ['oro', 'gold', 'dorado', 'golden', 'precioso', 'precious'],
            'plata': ['plata', 'silver', 'plateado', 'silvered', 'metálico'],
            'bronce': ['bronce', 'bronze', 'latón', 'brass', 'cobre', 'copper'],
            'diamante': ['diamante', 'diamond', 'cristal', 'crystal', 'gema', 'gem'],
            'perla': ['perla', 'pearl', 'nacar', 'mother of pearl', 'iridiscente'],
            'mágico': ['mágico', 'magical', 'encantado', 'enchanted', 'místico', 'mystical'],
            'etéreo': ['etéreo', 'ethereal', 'espiritual', 'spiritual', 'divino', 'divine'],
            'cristal_mágico': ['cristal mágico', 'magical crystal', 'gema mágica', 'magical gem'],
            'hielo_mágico': ['hielo mágico', 'magical ice', 'cristal de hielo', 'ice crystal'],
            'fuego_mágico': ['fuego mágico', 'magical fire', 'llama eterna', 'eternal flame'],
            'circuito': ['circuito', 'circuit', 'electrónico', 'electronic', 'digital', 'digital'],
            'neón': ['neón', 'neon', 'fluorescente', 'fluorescent', 'led', 'led'],
            'holograma': ['holograma', 'hologram', 'virtual', 'virtual', 'proyección'],
            'nanotecnología': ['nanotecnología', 'nanotechnology', 'nano', 'nano', 'microscópico'],
            'brillante': ['brillante', 'shiny', 'reflectante', 'reflective', 'pulido', 'polished'],
            'mate': ['mate', 'matte', 'opaco', 'opaque', 'sin brillo', 'dull'],
            'transparente': ['transparente', 'transparent', 'cristalino', 'crystalline'],
            'translúcido': ['translúcido', 'translucent', 'semi-transparente']
        };

        for (const [material, keywords] of Object.entries(materialPatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.material = material;
                break;
            }
        }

        // Detectar efectos
        const effectPatterns = {
            'rotación': ['rotación', 'rotation', 'girando', 'spinning', 'rotativo', 'rotary', 'gira', 'turns'],
            'flotación': ['flotante', 'floating', 'flota', 'floats', 'levitación', 'levitation', 'suspendido'],
            'oscilación': ['oscila', 'oscillates', 'balanceo', 'swinging', 'pendular', 'pendulum'],
            'vibración': ['vibra', 'vibrates', 'temblor', 'tremor', 'estremecimiento', 'shaking'],
            'pulsación': ['pulsa', 'pulses', 'latido', 'heartbeat', 'ritmo', 'rhythm'],
            'brillo': ['brillante', 'shiny', 'luminoso', 'luminous', 'resplandeciente', 'radiant'],
            'resplandor': ['resplandece', 'glows', 'aura', 'halo', 'corona', 'corona'],
            'parpadeo': ['parpadea', 'blinks', 'intermitente', 'flashing', 'titila', 'twinkles'],
            'arcoíris': ['arcoíris', 'rainbow', 'multicolor', 'prismatic', 'iridiscente'],
            'neón': ['neón', 'neon', 'fluorescente', 'fluorescent', 'led', 'bright'],
            'partículas': ['partículas', 'particles', 'polvo', 'dust', 'cenizas', 'ashes'],
            'chispas': ['chispas', 'sparks', 'electricidad', 'electricity', 'rayos', 'lightning'],
            'humo': ['humo', 'smoke', 'vapor', 'steam', 'niebla', 'mist'],
            'fuego': ['fuego', 'fire', 'llama', 'flame', 'ardiente', 'burning'],
            'hielo': ['hielo', 'ice', 'escarcha', 'frost', 'cristal de hielo', 'ice crystal'],
            'mágico': ['mágico', 'magical', 'encantado', 'enchanted', 'hechizado', 'spelled'],
            'etéreo': ['etéreo', 'ethereal', 'espiritual', 'spiritual', 'divino', 'divine'],
            'portal': ['portal', 'gateway', 'teletransporte', 'teleport', 'agujero de gusano'],
            'transformación': ['transforma', 'transforms', 'cambio', 'change', 'metamorfosis'],
            'invisibilidad': ['invisible', 'invisible', 'oculto', 'hidden', 'camuflado'],
            'sonido': ['sonido', 'sound', 'música', 'music', 'melodía', 'melody', 'armonía'],
            'eco': ['eco', 'echo', 'resonancia', 'resonance', 'reverberación'],
            'silbido': ['silba', 'whistles', 'zumbido', 'buzzing', 'vibración', 'vibration'],
            'antigravedad': ['antigravedad', 'antigravity', 'flota', 'floats', 'sin peso'],
            'gravedad': ['gravedad', 'gravity', 'pesado', 'heavy', 'atracción'],
            'lentitud': ['lento', 'slow', 'ralentizado', 'slow motion', 'congelado'],
            'velocidad': ['rápido', 'fast', 'acelerado', 'accelerated', 'turbo'],
            'pausa': ['pausa', 'pause', 'detenido', 'stopped', 'congelado', 'frozen'],
            'crecimiento': ['crece', 'grows', 'expansión', 'expansion', 'agranda'],
            'reducción': ['reduce', 'shrinks', 'contracción', 'contraction', 'encoge'],
            'escala': ['escala', 'scale', 'tamaño', 'size', 'proporción'],
            'cambio_color': ['cambia color', 'color change', 'cromático', 'chromatic'],
            'fade': ['desvanece', 'fades', 'transparencia', 'transparency', 'desaparece'],
            'gradiente': ['gradiente', 'gradient', 'degradado', 'degraded', 'mezcla'],
            'holograma': ['holograma', 'hologram', 'virtual', 'virtual', 'proyección'],
            'espejo': ['espejo', 'mirror', 'reflejo', 'reflection', 'reflectante'],
            'lente': ['lente', 'lens', 'amplificación', 'magnification', 'zoom'],
            'prisma': ['prisma', 'prism', 'refracción', 'refraction', 'dispersión'],
            'cristal': ['cristal', 'crystal', 'transparente', 'transparent', 'claro']
        };

        for (const [effect, keywords] of Object.entries(effectPatterns)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.effects.push(effect);
            }
        }

        // Detectar complejidad
        if (lowerDesc.includes('complejo') || lowerDesc.includes('complex') || lowerDesc.includes('detallado')) {
            analysis.complexity = 'high';
        } else if (lowerDesc.includes('simple') || lowerDesc.includes('básico')) {
            analysis.complexity = 'low';
        }

        return analysis;
    }
    
    /**
     * Analiza y crea un objeto con modificadores del CommandParser
     * @param {object} parsedCommand - Comando parseado por CommandParser
     * @param {THREE.Vector3} position - Posición donde crear el objeto
     * @returns {object} - Datos del objeto con modificadores aplicados
     */
    analyzeAndCreateObjectWithModifiers(parsedCommand, position) {
        // Usar el objeto base del comando parseado
        const baseDescription = parsedCommand.object;
        
        // Crear análisis base
        const analysis = this.analyzeAndCreateObject(baseDescription, position);
        
        // Aplicar modificadores del comando parseado
        
        // 1. Aplicar variante específica si se especificó
        if (parsedCommand.variant) {
            analysis.specificAsset = parsedCommand.variant.asset;
            console.log(`🎯 Aplicando variante específica: ${parsedCommand.variant.name} -> ${parsedCommand.variant.asset}`);
        }
        
        // 2. Aplicar color si se especificó
        if (parsedCommand.color) {
            analysis.color = parsedCommand.color.value;
            console.log(`🎨 Aplicando color: ${parsedCommand.color.name} (${parsedCommand.color.value.toString(16)})`);
        }
        
        // 3. Aplicar tamaño si se especificó
        if (parsedCommand.size && parsedCommand.size.name !== 'normal') {
            const sizeMultiplier = parsedCommand.size.value;
            analysis.size.x *= sizeMultiplier;
            analysis.size.y *= sizeMultiplier;
            analysis.size.z *= sizeMultiplier;
            console.log(`📏 Aplicando tamaño: ${parsedCommand.size.name} (x${sizeMultiplier})`);
        }
        
        // 4. Aplicar material si se especificó
        if (parsedCommand.material && parsedCommand.material.type !== 'basic') {
            analysis.material = parsedCommand.material.type;
            analysis.effects = analysis.effects || [];
            
            // Agregar efectos especiales según el material
            if (parsedCommand.material.emissive) {
                analysis.effects.push('emissive');
            }
            if (parsedCommand.material.transparent) {
                analysis.effects.push('transparent');
                analysis.opacity = parsedCommand.material.opacity || 0.5;
            }
            if (parsedCommand.material.metalness) {
                analysis.effects.push('metallic');
            }
            
            console.log(`✨ Aplicando material: ${parsedCommand.material.type}`);
        }
        
        // 5. Actualizar descripción para incluir modificadores
        analysis.description = this.commandParser.generateDescription(parsedCommand);
        
        console.log('🔧 Objeto con modificadores aplicados:', analysis);
        
        return analysis;
    }
    
    getColorValue(colorName) {
        const colorMap = {
            'rojo': 0xff0000,
            'azul': 0x0000ff,
            'verde': 0x00ff00,
            'amarillo': 0xffff00,
            'naranja': 0xff8000,
            'morado': 0x8000ff,
            'rosa': 0xff80ff,
            'marrón': 0x8b4513,
            'negro': 0x000000,
            'blanco': 0xffffff,
            'gris': 0x808080,
            'dorado': 0xffd700,
            'plateado': 0xc0c0c0,
            'cobre': 0xb87333,
            'turquesa': 0x40e0d0,
            'magenta': 0xff00ff,
            'cyan': 0x00ffff,
            'índigo': 0x4b0082,
            'ámbar': 0xffbf00,
            'jade': 0x00a86b,
            'rubí': 0xe0115f,
            'zafiro': 0x0f52ba,
            'diamante': 0xb9f2ff,
            'perla': 0xf0e6e6,
            'arcoíris': 0xff0000, // Cambiará dinámicamente
            'neón': 0x00ff00,
            'pastel': 0xffb6c1,
            'metálico': 0x708090,
            'transparente': 0xffffff,
            'translúcido': 0xffffff
        };
        
        return colorMap[colorName] || this.generateRandomColor();
    }
    
    async createMeshFromData(objectData) {
        // Primero intentar usar assets 3D si tenemos una descripción
        if (objectData.description && this.assetManager) {
            try {
                const assetObject = await this.assetManager.createObjectFromAssets(
                    objectData.description, 
                    Math.max(objectData.size.x, objectData.size.y, objectData.size.z),
                    objectData.specificAsset // Pasar el asset específico si está disponible
                );
                
                if (assetObject) {
                    // Aplicar color si se especifica
                    if (objectData.color) {
                        assetObject.traverse((child) => {
                            if (child.isMesh && child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(mat => {
                                        if (mat.color) mat.color.setHex(objectData.color);
                                    });
                                } else {
                                    child.material.color.setHex(objectData.color);
                                }
                            }
                        });
                    }
                    
                    return assetObject;
                }
            } catch (error) {
                console.warn('Error al cargar asset, usando geometría básica:', error);
            }
        }
        
        // Si no hay assets disponibles, usar geometrías básicas
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
                // Árbol simple: cilindro para tronco + esfera para copa
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
                // Casa simple: cubo principal + techo triangular
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
                
            case 'dragon':
                // Dragón simple: cuerpo alargado + cabeza
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
                
                dragonGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return dragonGroup;
                
            case 'crystal':
                geometry = new THREE.OctahedronGeometry(objectData.size.x / 2);
                break;
                
            case 'flower':
                // Flor simple: tallo + pétalos
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
                
            case 'fish':
            case 'pez':
            case 'shark':
            case 'tiburon':
            case 'dolphin':
            case 'delfin':
            case 'whale':
            case 'ballena':
                // Pez simple: cuerpo alargado + cola
                const fishGroup = new THREE.Group();
                const fishBodyGeometry = new THREE.CylinderGeometry(0.2, 0.1, 1.5, 8);
                const fishBodyMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const fishBody = new THREE.Mesh(fishBodyGeometry, fishBodyMaterial);
                fishBody.rotation.z = Math.PI / 2;
                fishGroup.add(fishBody);
                
                // Cola del pez
                const tailGeometry = new THREE.ConeGeometry(0.15, 0.4, 4);
                const tailMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const tail = new THREE.Mesh(tailGeometry, tailMaterial);
                tail.position.set(-0.8, 0, 0);
                tail.rotation.z = Math.PI / 2;
                fishGroup.add(tail);
                
                // Aletas laterales
                const finGeometry = new THREE.ConeGeometry(0.1, 0.3, 4);
                const finMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const fin1 = new THREE.Mesh(finGeometry, finMaterial);
                fin1.position.set(0, 0.2, 0);
                fin1.rotation.x = Math.PI / 2;
                fishGroup.add(fin1);
                
                const fin2 = new THREE.Mesh(finGeometry, finMaterial);
                fin2.position.set(0, -0.2, 0);
                fin2.rotation.x = -Math.PI / 2;
                fishGroup.add(fin2);
                
                fishGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return fishGroup;
                
            case 'robot':
                // Robot simple: cuerpo + cabeza
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
                
                robotGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return robotGroup;
                
            case 'spaceship':
                // Nave simple: cilindro + cono
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
                
            case 'bird':
            case 'pajaro':
            case 'eagle':
            case 'aguila':
                // Ave simple: cuerpo + alas
                const birdGroup = new THREE.Group();
                const birdBodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
                const birdBodyMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const birdBody = new THREE.Mesh(birdBodyGeometry, birdBodyMaterial);
                birdGroup.add(birdBody);
                
                // Alas
                const wingGeometry = new THREE.ConeGeometry(0.2, 0.8, 4);
                const wingMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const wing1 = new THREE.Mesh(wingGeometry, wingMaterial);
                wing1.position.set(0, 0.3, 0);
                wing1.rotation.z = Math.PI / 4;
                birdGroup.add(wing1);
                
                const wing2 = new THREE.Mesh(wingGeometry, wingMaterial);
                wing2.position.set(0, -0.3, 0);
                wing2.rotation.z = -Math.PI / 4;
                birdGroup.add(wing2);
                
                birdGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return birdGroup;
                
            case 'car':
            case 'coche':
            case 'auto':
                // Auto simple: cuerpo + ruedas
                const carGroup = new THREE.Group();
                const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 1);
                const carBodyMaterial = new THREE.MeshLambertMaterial({ color: objectData.color });
                const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
                carBody.position.y = 0.25;
                carGroup.add(carBody);
                
                // Ruedas
                const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8);
                const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
                const wheel1 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel1.position.set(-0.5, 0.2, 0.6);
                wheel1.rotation.z = Math.PI / 2;
                carGroup.add(wheel1);
                
                const wheel2 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel2.position.set(0.5, 0.2, 0.6);
                wheel2.rotation.z = Math.PI / 2;
                carGroup.add(wheel2);
                
                const wheel3 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel3.position.set(-0.5, 0.2, -0.6);
                wheel3.rotation.z = Math.PI / 2;
                carGroup.add(wheel3);
                
                const wheel4 = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel4.position.set(0.5, 0.2, -0.6);
                wheel4.rotation.z = Math.PI / 2;
                carGroup.add(wheel4);
                
                carGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return carGroup;
                
            case 'castle':
                // Castillo simple: torre principal
                const castleGroup = new THREE.Group();
                const mainTowerGeometry = new THREE.CylinderGeometry(1, 1, 3, 8);
                const mainTowerMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
                const mainTower = new THREE.Mesh(mainTowerGeometry, mainTowerMaterial);
                mainTower.position.y = 1.5;
                castleGroup.add(mainTower);
                
                castleGroup.scale.set(objectData.size.x, objectData.size.y, objectData.size.z);
                return castleGroup;
                
            case 'fire':
                geometry = new THREE.ConeGeometry(0.5, 1, 8);
                break;
                
            case 'ice':
                geometry = new THREE.BoxGeometry(1, 1, 1);
                break;
                
            case 'water':
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
    
    applyEffects(group, data) {
        // Aplicar efectos especiales
        data.effects.forEach(effect => {
            switch (effect) {
                case 'brillo':
                    group.children.forEach(child => {
                        if (child.material) {
                            child.material.emissive = child.material.color;
                            child.material.emissiveIntensity = 0.2;
                        }
                    });
                    break;
                case 'flotación':
                    // El objeto flotará en la animación
                    group.userData.floating = true;
                    break;
                case 'rotación':
                    // El objeto rotará en la animación
                    group.userData.rotating = true;
                    break;
                case 'oscilación':
                    // El objeto oscilará en la animación
                    group.userData.oscillating = true;
                    break;
            }
        });
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
        if (!this.isInitialized) {
            return;
        }
        
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Verificar que el renderer existe
        if (!this.renderer || !this.scene || !this.camera) {
            return;
        }
        
        // Actualizar controlador del jugador
        if (this.playerController) {
            this.playerController.update(deltaTime / 1000);
        }
        
        // Animar objetos con efectos especiales
        this.objects.forEach((object, id) => {
            if (object.mesh && object.mesh.userData) {
                const userData = object.mesh.userData;
                
                // Efecto de flotación
                if (userData.floating) {
                    object.mesh.position.y += Math.sin(currentTime * 0.003) * 0.001;
                }
                
                // Efecto de rotación
                if (userData.rotating) {
                    object.mesh.rotation.y += 0.01;
                }
                
                // Efecto de oscilación
                if (userData.oscillating) {
                    object.mesh.rotation.z = Math.sin(currentTime * 0.002) * 0.1;
                }
                
                // Efecto de pulsación
                if (userData.pulsating) {
                    const scale = 1 + Math.sin(currentTime * 0.005) * 0.1;
                    object.mesh.scale.set(scale, scale, scale);
                }
                
                // Efecto de cambio de color (arcoíris)
                if (userData.rainbow) {
                    const hue = (currentTime * 0.1) % 360;
                    const color = new THREE.Color().setHSL(hue / 360, 1, 0.5);
                    object.mesh.children.forEach(child => {
                        if (child.material) {
                            child.material.color = color;
                        }
                    });
                }
            }
        });
        
        // Actualizar jugadores remotos
        this.remotePlayers.forEach(player => {
            if (player.update) {
                player.update(deltaTime / 1000);
            }
        });
        
        // Renderizar escena
        try {
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('❌ Error al renderizar:', error);
        }
        
        // Continuar loop
        requestAnimationFrame(() => this.animate());
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

    getItemCatalog() {
        return this.itemCatalog;
    }
    
    onModalClosed() {
        // Restaurar el estado del juego cuando se cierra el modal
        if (this.playerController) {
            // El PlayerController manejará la restauración del puntero si es necesario
            this.playerController.onModalClosed();
        }
    }
    
    // Método para normalizar escalas extremadamente pequeñas o grandes
    normalizeScale(scale) {
        const minScale = 0.1;
        const maxScale = 5.0;
        
        return {
            x: Math.max(minScale, Math.min(maxScale, Math.abs(scale.x) < 0.01 ? 1 : scale.x)),
            y: Math.max(minScale, Math.min(maxScale, Math.abs(scale.y) < 0.01 ? 1 : scale.y)),
            z: Math.max(minScale, Math.min(maxScale, Math.abs(scale.z) < 0.01 ? 1 : scale.z))
        };
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
        // Procesar comandos del minijuego primero
        if (this.obstacleGame && this.obstacleGame.processCommand(message, 'local')) {
            return; // El comando fue procesado por el minijuego
        }
        
        // Comando simple para probar el minijuego
        if (message.toLowerCase() === 'iniciar juego' || message.toLowerCase() === 'start game') {
            if (this.simpleTreasureGame) {
                this.simpleTreasureGame.start();
                return;
            }
        }
        
        // Comando para forzar sincronización del minijuego
        if (message.toLowerCase() === 'sync juego' || message.toLowerCase() === 'sync game') {
            if (this.simpleTreasureGame && this.simpleTreasureGame.isActive) {
                console.log('🔄 Forzando sincronización del minijuego...');
                if (this.simpleTreasureGame.isHost) {
                    this.simpleTreasureGame.broadcastGameState();
                } else {
                    this.simpleTreasureGame.game.networkManager.sendGameEvent({
                        type: 'treasure_game_request_info',
                        gameId: this.simpleTreasureGame.gameId
                    });
                }
                return;
            }
        }
        
        // Comando para probar eventos de red
        if (message.toLowerCase() === 'test evento' || message.toLowerCase() === 'test event') {
            console.log('🧪 Enviando evento de prueba...');
            if (this.networkManager && this.networkManager.isConnected) {
                this.networkManager.sendGameEvent({
                    type: 'test_event',
                    gameId: 'test_' + Date.now(),
                    message: 'Evento de prueba desde ' + this.networkManager.playerId
                });
                this.showChatMessage('🧪 Evento de prueba enviado');
            } else {
                this.showChatMessage('❌ No se pudo enviar evento de prueba');
            }
            return;
        }
        
        // Comando para verificar estado del host
        if (message.toLowerCase() === 'estado host' || message.toLowerCase() === 'host status') {
            if (this.simpleTreasureGame) {
                const status = {
                    isActive: this.simpleTreasureGame.isActive,
                    isHost: this.simpleTreasureGame.isHost,
                    gameId: this.simpleTreasureGame.gameId,
                    treasures: this.simpleTreasureGame.treasures.length,
                    networkConnected: this.networkManager?.isConnected,
                    playerCount: this.networkManager?.getPlayerCount()
                };
                console.log('🏠 Estado del host:', status);
                this.showChatMessage(`🏠 Host: ${status.isActive ? 'Activo' : 'Inactivo'}, ${status.isHost ? 'Es Host' : 'No es Host'}, Tesoros: ${status.treasures}, Jugadores: ${status.playerCount}`);
            } else {
                this.showChatMessage('❌ Minijuego no disponible');
            }
            return;
        }
        
        // Comando para forzar envío de evento desde host
        if (message.toLowerCase() === 'forzar evento' || message.toLowerCase() === 'force event') {
            if (this.simpleTreasureGame && this.simpleTreasureGame.isActive && this.simpleTreasureGame.isHost) {
                console.log('🚀 Forzando envío de evento desde host...');
                this.networkManager.sendGameEvent({
                    type: 'treasure_game_start',
                    gameId: this.simpleTreasureGame.gameId,
                    isHost: true
                });
                this.showChatMessage('🚀 Evento forzado enviado desde host');
            } else {
                this.showChatMessage('❌ No eres host o el juego no está activo');
            }
            return;
        }
        
        // Comando para transmitir gameId desde host
        if (message.toLowerCase() === 'transmitir id' || message.toLowerCase() === 'broadcast id') {
            if (this.simpleTreasureGame && this.simpleTreasureGame.isActive && this.simpleTreasureGame.isHost) {
                console.log('📡 Transmitiendo gameId desde host...');
                this.networkManager.sendGameEvent({
                    type: 'treasure_game_id',
                    gameId: this.simpleTreasureGame.gameId,
                    isHost: true
                });
                this.showChatMessage('📡 GameId transmitido desde host');
            } else {
                this.showChatMessage('❌ No eres host o el juego no está activo');
            }
            return;
        }
        
        // Comando para enviar evento de prueba específico
        if (message.toLowerCase() === 'test cliente' || message.toLowerCase() === 'test client') {
            console.log('🧪 Enviando evento de prueba específico al cliente...');
            if (this.networkManager && this.networkManager.isConnected) {
                const players = this.networkManager.getAllPlayers();
                console.log('👥 Jugadores disponibles:', players);
                
                this.networkManager.sendGameEvent({
                    type: 'test_client_event',
                    gameId: 'test_' + Date.now(),
                    message: 'Evento de prueba desde host',
                    timestamp: Date.now()
                });
                this.showChatMessage('🧪 Evento de prueba enviado al cliente');
            } else {
                this.showChatMessage('❌ No se pudo enviar evento de prueba');
            }
            return;
        }
        
        // Comando para verificar recepción de eventos
        if (message.toLowerCase() === 'verificar eventos' || message.toLowerCase() === 'check events') {
            console.log('🔍 Verificando recepción de eventos...');
            this.showChatMessage('🔍 Verificando eventos... Revisa la consola');
            
            // Verificar si hemos recibido algún evento recientemente
            if (this.networkManager) {
                console.log('📡 Estado del NetworkManager:', {
                    isConnected: this.networkManager.isConnected,
                    playerId: this.networkManager.playerId,
                    callbacks: Array.from(this.networkManager.callbacks.keys())
                });
                
                // Verificar jugadores y objetos
                const players = this.networkManager.getAllPlayers();
                const objects = this.networkManager.getAllObjects();
                console.log('👥 Jugadores conectados:', players);
                console.log('📦 Objetos en la red:', objects.length);
            }
            return;
        }
        
        // Comando para verificar conexión entre jugadores
        if (message.toLowerCase() === 'verificar conexion' || message.toLowerCase() === 'check connection') {
            console.log('🔗 Verificando conexión entre jugadores...');
            this.showChatMessage('🔗 Verificando conexión... Revisa la consola');
            
            if (this.networkManager) {
                const playerCount = this.networkManager.getPlayerCount();
                const players = this.networkManager.getAllPlayers();
                
                console.log('🔗 Información de conexión:', {
                    miPlayerId: this.networkManager.playerId,
                    totalJugadores: playerCount,
                    jugadores: players.map(p => ({ id: p.id, name: p.name }))
                });
                
                if (playerCount === 0) {
                    this.showChatMessage('❌ No hay otros jugadores conectados');
                } else {
                    this.showChatMessage(`✅ ${playerCount} jugador(es) conectado(s)`);
                }
            }
            return;
        }
        
        // Comando para forzar reconexión
        if (message.toLowerCase() === 'reconectar' || message.toLowerCase() === 'reconnect') {
            console.log('🔄 Forzando reconexión...');
            this.showChatMessage('🔄 Reconectando...');
            
            if (this.networkManager) {
                this.networkManager.disconnect();
                setTimeout(() => {
                    this.networkManager.connect();
                    this.showChatMessage('✅ Reconexión completada');
                }, 1000);
            }
            return;
        }
        
        // Comando para forzar unión al juego (para clientes)
        if (message.toLowerCase() === 'unirse juego' || message.toLowerCase() === 'join game') {
            if (this.simpleTreasureGame && !this.simpleTreasureGame.isActive) {
                console.log('🎯 Forzando unión al juego...');
                // Buscar un gameId válido (podríamos obtenerlo del host)
                const gameId = 'treasure_game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                this.simpleTreasureGame.joinGame(gameId);
                this.showChatMessage('🎯 Unión forzada al juego');
            } else {
                this.showChatMessage('❌ Ya estás en un juego o minijuego no disponible');
            }
            return;
        }
        
        // Comando para escuchar eventos (para clientes)
        if (message.toLowerCase() === 'escuchar eventos' || message.toLowerCase() === 'listen events') {
            console.log('🎧 Activando escucha de eventos...');
            this.showChatMessage('🎧 Escuchando eventos del host...');
            
            // Verificar si hay un host activo
            if (this.networkManager) {
                const players = this.networkManager.getAllPlayers();
                console.log('👥 Jugadores conectados:', players);
                
                if (players.length > 0) {
                    this.showChatMessage(`🎧 Escuchando eventos de ${players.length} jugador(es)`);
                } else {
                    this.showChatMessage('❌ No hay jugadores para escuchar');
                }
            }
            return;
        }
        
        // Comando para recargar ambiente 3D
        if (message.toLowerCase() === 'cargar ambiente' || message.toLowerCase() === 'load environment') {
            console.log('🏙️ Recargando ambiente 3D...');
            this.showChatMessage('🏙️ Recargando ambiente 3D...');
            
            // Remover modelo anterior si existe
            if (this.environmentModel) {
                this.scene.remove(this.environmentModel);
                this.environmentModel = null;
            }
            
            // Cargar nuevo ambiente
            this.loadEnvironment3D().then(() => {
                this.showChatMessage('✅ Ambiente 3D recargado exitosamente');
            }).catch((error) => {
                this.showChatMessage('❌ Error recargando ambiente 3D');
                console.error('❌ Error recargando ambiente:', error);
            });
            return;
        }
        
        // Comando para ajustar escala del ambiente
        if (message.toLowerCase().startsWith('escala ambiente ')) {
            const scale = parseFloat(message.split(' ')[2]);
            if (this.environmentModel && !isNaN(scale)) {
                this.environmentModel.scale.set(scale, scale, scale);
                this.showChatMessage(`📏 Escala del ambiente ajustada a: ${scale}`);
                console.log('📏 Escala ajustada:', scale);
            } else {
                this.showChatMessage('❌ Ambiente no disponible o escala inválida');
            }
            return;
        }
        
        // Comando para escalas predefinidas
        if (message.toLowerCase() === 'ambiente pequeño') {
            if (this.environmentModel) {
                this.environmentModel.scale.set(2, 2, 2);
                this.showChatMessage('📏 Ambiente configurado como pequeño');
            }
            return;
        }
        
        if (message.toLowerCase() === 'ambiente normal') {
            if (this.environmentModel) {
                this.environmentModel.scale.set(5, 5, 5);
                this.showChatMessage('📏 Ambiente configurado como normal');
            }
            return;
        }
        
        if (message.toLowerCase() === 'ambiente grande') {
            if (this.environmentModel) {
                this.environmentModel.scale.set(10, 10, 10);
                this.showChatMessage('📏 Ambiente configurado como grande');
            }
            return;
        }
        
        // Comando para crear ambiente de prueba
        if (message.toLowerCase() === 'ambiente prueba' || message.toLowerCase() === 'test environment') {
            this.createTestEnvironment();
            return;
        }
        
        // Comando para limpiar solo objetos del ambiente de prueba
        if (message.toLowerCase() === 'limpiar ambiente' || message.toLowerCase() === 'clear environment') {
            this.clearTestEnvironment();
            return;
        }
        
        // Comando para mostrar información del ambiente
        if (message.toLowerCase() === 'info ambiente' || message.toLowerCase() === 'environment info') {
            this.showEnvironmentInfo();
            return;
        }
        
        // Comando para extraer texturas
        if (message.toLowerCase() === 'extraer texturas' || message.toLowerCase() === 'extract textures') {
            this.extractTextures();
            return;
        }
        
        // Comando para verificar texturas
        if (message.toLowerCase() === 'verificar texturas' || message.toLowerCase() === 'check textures') {
            this.checkTextures();
            return;
        }
        
        // Comando para diagnosticar loaders
        if (message.toLowerCase() === 'diagnosticar loaders' || message.toLowerCase() === 'diagnose loaders') {
            this.diagnoseLoaders();
            return;
        }
        
        // Comando para verificar colisiones del ambiente
        if (message.toLowerCase() === 'verificar colisiones' || message.toLowerCase() === 'check collisions') {
            this.checkEnvironmentCollisions();
            return;
        }
        
        // Procesar comandos del minijuego simple
        if (this.simpleTreasureGame && this.simpleTreasureGame.processCommand && this.simpleTreasureGame.processCommand(message, 'local')) {
            return; // El comando fue procesado por el minijuego
        }
        
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

        // Agregar indicador del catálogo
        this.catalogIndicator = document.createElement('div');
        this.catalogIndicator.id = 'catalogIndicator';
        this.catalogIndicator.style.cssText = `
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
            font-size: 12px;
            border-left: 3px solid #667eea;
        `;
        this.catalogIndicator.innerHTML = `
            <div style="color: #667eea; font-weight: bold;">📋 Catálogo de Items</div>
            <div>Presiona <strong>I</strong> para abrir</div>
        `;
        this.hud.appendChild(this.catalogIndicator);
        
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
                const assetStats = this.assetManager.getCacheStats();
                
                indicator.innerHTML = `
                    <div style="color: #00ff00;">🌐 Multijugador Activo</div>
                    <div>👥 Jugadores: ${playerCount}</div>
                    <div>🎨 Objetos: ${objectCount}</div>
                    <div>📦 Assets: ${assetStats.cached}/${assetStats.total}</div>
                `;
            } else {
                const assetStats = this.assetManager.getCacheStats();
                indicator.innerHTML = `
                    <div style="color: #ff0000;">🔌 Modo Local</div>
                    <div>Servidor no disponible</div>
                    <div>📦 Assets: ${assetStats.cached}/${assetStats.total}</div>
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
    
    // Sistema de colisiones
    checkCollision(newPosition, newMesh, excludeObjectId = null) {
        const collisionThreshold = 1.0; // Aumentar threshold para ser más estricto
        
        console.log(`🔍 Verificando colisión en posición: ${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}`);
        console.log(`📦 Objetos a verificar: ${this.objects.size}`);
        
        for (const [id, object] of this.objects) {
            // Saltar el objeto que se está moviendo
            if (excludeObjectId && id === excludeObjectId) {
                console.log(`⏭️ Saltando objeto propio: ${id}`);
                continue;
            }
            
            if (!object.mesh || !object.mesh.position) {
                console.log(`⚠️ Objeto sin mesh válido: ${id}`);
                continue;
            }
            
            // Calcular distancia entre centros
            const distance = newPosition.distanceTo(object.mesh.position);
            
            // Obtener tamaños aproximados de ambos objetos
            const newSize = this.getObjectSize(newMesh);
            const existingSize = this.getObjectSize(object.mesh);
            
            // Distancia mínima requerida (suma de radios + threshold)
            const minDistance = (newSize + existingSize) / 2 + collisionThreshold;
            
            console.log(`📏 Comparando con ${object.name || object.id}: distancia=${distance.toFixed(2)}m, mínima=${minDistance.toFixed(2)}m, tamaños=${newSize.toFixed(2)}/${existingSize.toFixed(2)}`);
            
            if (distance < minDistance) {
                console.log(`🚫 Colisión detectada: ${object.name || object.id} (distancia: ${distance.toFixed(2)}m, mínima: ${minDistance.toFixed(2)}m)`);
                return {
                    colliding: true,
                    object: object,
                    distance: distance,
                    minDistance: minDistance
                };
            }
        }
        
        // Verificar colisión con objetos del ambiente
        if (this.environmentModel) {
            this.environmentModel.traverse((child) => {
                if (child.isMesh && child.userData.isCollisionObject) {
                    const distance = newPosition.distanceTo(child.position);
                    const newSize = this.getObjectSize(newMesh);
                    const environmentSize = this.getObjectSize(child);
                    const minDistance = (newSize + environmentSize) / 2 + collisionThreshold;
                    
                    console.log(`🏗️ Comparando con ambiente ${child.name || 'sin nombre'}: distancia=${distance.toFixed(2)}m, mínima=${minDistance.toFixed(2)}m`);
                    
                    if (distance < minDistance) {
                        console.log(`🚫 Colisión con ambiente detectada: ${child.name || 'sin nombre'} (distancia: ${distance.toFixed(2)}m, mínima: ${minDistance.toFixed(2)}m)`);
                        return {
                            colliding: true,
                            object: { name: child.name || 'ambiente', mesh: child },
                            distance: distance,
                            minDistance: minDistance
                        };
                    }
                }
            });
        }
        
        console.log(`✅ Sin colisiones detectadas`);
        return { colliding: false };
    }
    
    // Obtener tamaño aproximado de un objeto
    getObjectSize(mesh) {
        if (!mesh) {
            console.log(`⚠️ Mesh nulo, usando tamaño por defecto: 1.0`);
            return 1.0;
        }
        
        try {
            // Usar boundingBox si está disponible
            const box = new THREE.Box3().setFromObject(mesh);
            const size = new THREE.Vector3();
            box.getSize(size);
            
            // Retornar el tamaño más grande
            const maxSize = Math.max(size.x, size.y, size.z);
            console.log(`📏 Tamaño calculado para ${mesh.name || 'objeto'}: ${maxSize.toFixed(2)} (${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)})`);
            
            // Asegurar un tamaño mínimo
            return Math.max(maxSize, 0.5);
        } catch (error) {
            console.error(`❌ Error calculando tamaño:`, error);
            return 1.0;
        }
    }
    
    // Verificar colisión con el jugador
    checkPlayerCollision(position, mesh) {
        if (!this.playerController) return false;
        
        const playerPosition = this.playerController.getPosition();
        const distance = position.distanceTo(playerPosition);
        
        // Obtener tamaños aproximados
        const objectSize = this.getObjectSize(mesh);
        const playerSize = 1.0; // Tamaño aproximado del jugador
        
        // Distancia mínima requerida
        const minDistance = (objectSize + playerSize) / 2 + 0.5; // 0.5m de margen
        
        if (distance < minDistance) {
            console.log(`🚫 Colisión con jugador detectada (distancia: ${distance.toFixed(2)}m, mínima: ${minDistance.toFixed(2)}m)`);
            return true;
        }
        
        return false;
    }
    
    // Encontrar posición libre para spawn
    findFreeSpawnPosition(basePosition, mesh, maxAttempts = 15) {
        const directions = [
            new THREE.Vector3(1, 0, 0),   // Derecha
            new THREE.Vector3(-1, 0, 0),  // Izquierda
            new THREE.Vector3(0, 0, 1),   // Adelante
            new THREE.Vector3(0, 0, -1),  // Atrás
            new THREE.Vector3(1, 0, 1),   // Diagonal
            new THREE.Vector3(-1, 0, 1),  // Diagonal
            new THREE.Vector3(1, 0, -1),  // Diagonal
            new THREE.Vector3(-1, 0, -1), // Diagonal
            new THREE.Vector3(2, 0, 0),   // Más lejos
            new THREE.Vector3(-2, 0, 0),  // Más lejos
            new THREE.Vector3(0, 0, 2),   // Más lejos
            new THREE.Vector3(0, 0, -2)   // Más lejos
        ];
        
        console.log(`🔍 Buscando posición libre para spawn (${maxAttempts} intentos)`);
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // Intentar posición base
            if (attempt === 0) {
                console.log(`📍 Intento ${attempt + 1}: Posición base`);
                const collision = this.checkCollision(basePosition, mesh);
                const playerCollision = this.checkPlayerCollision(basePosition, mesh);
                if (!collision.colliding && !playerCollision) {
                    console.log(`✅ Posición base libre encontrada`);
                    return basePosition.clone();
                }
            }
            
            // Intentar posiciones alternativas
            const direction = directions[attempt % directions.length];
            const distance = 1.5 + (attempt * 0.8); // Aumentar distancia más agresivamente
            const newPosition = basePosition.clone().add(direction.multiplyScalar(distance));
            
            console.log(`📍 Intento ${attempt + 1}: ${direction.x},${direction.y},${direction.z} * ${distance.toFixed(1)} = ${newPosition.x.toFixed(2)},${newPosition.y.toFixed(2)},${newPosition.z.toFixed(2)}`);
            
            const collision = this.checkCollision(newPosition, mesh);
            const playerCollision = this.checkPlayerCollision(newPosition, mesh);
            if (!collision.colliding && !playerCollision) {
                console.log(`✅ Posición libre encontrada en intento ${attempt + 1}`);
                return newPosition;
            }
        }
        
        console.warn('⚠️ No se encontró posición libre después de todos los intentos');
        // Intentar una posición muy lejana como último recurso
        const lastResort = basePosition.clone().add(new THREE.Vector3(5, 0, 5));
        console.log(`🆘 Usando posición de último recurso: ${lastResort.x.toFixed(2)}, ${lastResort.y.toFixed(2)}, ${lastResort.z.toFixed(2)}`);
        return lastResort;
    }
    
    // Debug del sistema de colisiones
    debugCollisions() {
        console.log('🔍 === DEBUG SISTEMA DE COLISIONES ===');
        console.log(`📦 Total de objetos: ${this.objects.size}`);
        
        for (const [id, object] of this.objects) {
            if (object.mesh) {
                const size = this.getObjectSize(object.mesh);
                console.log(`  ${id}: ${object.name || 'Sin nombre'} - Pos: ${object.mesh.position.x.toFixed(2)}, ${object.mesh.position.y.toFixed(2)}, ${object.mesh.position.z.toFixed(2)} - Tamaño: ${size.toFixed(2)}`);
            }
        }
        
        if (this.playerController) {
            const playerPos = this.playerController.getPosition();
            console.log(`👤 Jugador: ${playerPos.x.toFixed(2)}, ${playerPos.y.toFixed(2)}, ${playerPos.z.toFixed(2)}`);
        }
        
        console.log('🔍 === FIN DEBUG ===');
    }
    
    // Probar colisiones entre dos objetos específicos
    testCollisionBetweenObjects(objectId1, objectId2) {
        const obj1 = this.objects.get(objectId1);
        const obj2 = this.objects.get(objectId2);
        
        if (!obj1 || !obj2) {
            console.log('❌ Objetos no encontrados');
            return;
        }
        
        const distance = obj1.mesh.position.distanceTo(obj2.mesh.position);
        const size1 = this.getObjectSize(obj1.mesh);
        const size2 = this.getObjectSize(obj2.mesh);
        const minDistance = (size1 + size2) / 2 + 1.0; // Usar threshold de 1.0
        
        console.log(`🔍 === PRUEBA DE COLISIÓN ===`);
        console.log(`📦 Objeto 1: ${obj1.name || obj1.id} - Tamaño: ${size1.toFixed(2)}`);
        console.log(`📦 Objeto 2: ${obj2.name || obj2.id} - Tamaño: ${size2.toFixed(2)}`);
        console.log(`📏 Distancia: ${distance.toFixed(2)}m`);
        console.log(`📏 Mínima requerida: ${minDistance.toFixed(2)}m`);
        console.log(`🚫 ¿Colisión?: ${distance < minDistance ? 'SÍ' : 'NO'}`);
        console.log(`🔍 === FIN PRUEBA ===`);
    }
    
    // Procesar eventos del juego (minijuegos)
    processGameEvent(event) {
        console.log('🎮 Evento del juego recibido:', event);
        console.log('🎮 Tipo de evento:', event.type);
        console.log('🎮 GameId del evento:', event.gameId);
        
        // Procesar eventos del minijuego de tesoros
        if (this.simpleTreasureGame && this.simpleTreasureGame.processNetworkEvent) {
            console.log('🎮 Procesando con SimpleTreasureGame...');
            if (this.simpleTreasureGame.processNetworkEvent(event)) {
                console.log('✅ Evento procesado por SimpleTreasureGame');
                return; // Evento procesado por el minijuego
            } else {
                console.log('❌ SimpleTreasureGame no procesó el evento');
            }
        } else {
            console.log('❌ SimpleTreasureGame no disponible');
        }
        
        // Procesar eventos del minijuego de obstáculos
        if (this.obstacleGame && this.obstacleGame.processNetworkEvent) {
            if (this.obstacleGame.processNetworkEvent(event)) {
                return; // Evento procesado por el minijuego
            }
        }
    }
    
    // Método de emergencia para restaurar la escena básica
    emergencyRestore() {
        console.log('🚨 === RESTAURACIÓN DE EMERGENCIA ===');
        
        try {
            // Verificar que los componentes básicos existan
            if (!this.scene || !this.camera || !this.renderer) {
                console.error('❌ Componentes básicos faltantes, reiniciando...');
                this.init();
                return;
            }
            
            // Restaurar iluminación básica
            this.setupLighting();
            
            // Restaurar suelo
            this.createGround();
            
            // Restaurar posición del jugador
            if (this.playerController) {
                this.playerController.resetPosition();
            }
            
            // Limpiar objetos problemáticos
            this.objects.clear();
            
            // Forzar renderizado
            this.renderer.render(this.scene, this.camera);
            
            console.log('✅ Escena restaurada correctamente');
            
        } catch (error) {
            console.error('❌ Error en restauración de emergencia:', error);
            // Intentar reinicio completo
            this.init();
        }
    }
}

// Hacer la instancia globalmente accesible
window.Game3D = Game3D; 