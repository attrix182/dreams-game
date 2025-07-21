import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_MAPPING, COMMON_ASSETS, ASSET_CATEGORIES } from '../config/AssetConfig.js';

export class AssetManager {
    constructor() {
        this.loader = new GLTFLoader();
        this.cache = new Map();
        this.assetMapping = this.createAssetMapping();
        this.loadingPromises = new Map();
    }

    createAssetMapping() {
        return ASSET_MAPPING;
    }

    async loadAsset(assetName) {
        // Verificar si ya está en caché
        if (this.cache.has(assetName)) {
            return this.cache.get(assetName);
        }

        // Verificar si ya se está cargando
        if (this.loadingPromises.has(assetName)) {
            return this.loadingPromises.get(assetName);
        }
        
        // Verificar si el asset existe en el mapeo
        const assetExists = Object.values(this.assetMapping).some(config => 
            config.assets.includes(assetName)
        );
        
        if (!assetExists) {
            console.warn(`Asset ${assetName} no encontrado en el mapeo de assets`);
            return null;
        }
        
        // Verificar si el archivo está disponible en el servidor
        const isAvailable = await this.checkAssetAvailability(assetName);
        if (!isAvailable) {
            console.error(`Asset ${assetName} no está disponible en el servidor`);
            return null;
        }

        // Crear promesa de carga
        const loadPromise = new Promise((resolve, reject) => {
            // Determinar el directorio del asset
            let assetPath;
            if (assetName.includes('Food') || this.isFoodAsset(assetName)) {
                assetPath = `/assets/Ultimate Food Pack-glb/${assetName}`;
            } else {
                assetPath = `/assets/Office Pack-glb/${assetName}`;
            }
            
            // Debug: verificar que la ruta es correcta
            console.log(`Intentando cargar: ${assetPath}`);
            
            this.loader.load(
                assetPath,
                (gltf) => {
                    // Clonar la escena para evitar problemas de referencia
                    const clonedScene = gltf.scene.clone();
                    
                    // Configurar sombras para todos los objetos
                    clonedScene.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                        }
                    });

                    this.cache.set(assetName, clonedScene);
                    this.loadingPromises.delete(assetName);
                    resolve(clonedScene);
                },
                (progress) => {
                    console.log(`Cargando ${assetName}: ${(progress.loaded / progress.total * 100)}%`);
                },
                (error) => {
                    console.error(`Error cargando ${assetName} desde ${assetPath}:`, error);
                    console.error(`Ruta completa: ${window.location.origin}${assetPath}`);
                    console.error(`Verificar que el archivo existe en: public${assetPath}`);
                    this.loadingPromises.delete(assetName);
                    reject(error);
                }
            );
        });

        this.loadingPromises.set(assetName, loadPromise);
        return loadPromise;
    }

    findMatchingAssets(description) {
        const lowerDesc = description.toLowerCase();
        const matches = [];

        // Buscar coincidencias exactas y parciales con prioridad
        for (const [keyword, config] of Object.entries(this.assetMapping)) {
            if (lowerDesc.includes(keyword)) {
                matches.push({
                    assets: config.assets,
                    priority: config.priority,
                    category: config.category
                });
            }
        }

        // Ordenar por prioridad (mayor primero)
        matches.sort((a, b) => b.priority - a.priority);

        // Retornar assets del match con mayor prioridad
        if (matches.length > 0) {
            return matches[0].assets;
        }

        return [];
    }

    async createObjectFromAssets(description, size = 1, specificAsset = null) {
        const matchingAssets = this.findMatchingAssets(description);
        
        if (matchingAssets.length === 0) {
            return null; // No hay assets que coincidan
        }

        // Usar asset específico si se proporciona, sino seleccionar aleatoriamente
        let selectedAsset;
        if (specificAsset && matchingAssets.includes(specificAsset)) {
            selectedAsset = specificAsset;
        } else {
            selectedAsset = matchingAssets[Math.floor(Math.random() * matchingAssets.length)];
        }
        
        try {
            const assetScene = await this.loadAsset(selectedAsset);
            
            if (!assetScene) {
                console.warn(`No se pudo cargar el asset: ${selectedAsset}`);
                return null;
            }
            
            // Crear un grupo para el objeto
            const objectGroup = new THREE.Group();
            objectGroup.add(assetScene);

            // Ajustar escala basada en el tamaño solicitado
            const box = new THREE.Box3().setFromObject(assetScene);
            const sizeVector = new THREE.Vector3();
            box.getSize(sizeVector);
            
            // Usar el tamaño más grande como referencia
            const currentSize = Math.max(sizeVector.x, sizeVector.y, sizeVector.z);
            
            // Evitar escalas extremadamente pequeñas o grandes
            let scale = size / currentSize;
            
            // Limitar la escala a un rango razonable
            if (scale < 0.01) {
                console.warn(`Escala muy pequeña detectada (${scale}), ajustando a 0.1`);
                scale = 0.1;
            } else if (scale > 10) {
                console.warn(`Escala muy grande detectada (${scale}), ajustando a 2.0`);
                scale = 2.0;
            }
            
            console.log(`Asset: ${selectedAsset}, Tamaño actual: ${currentSize}, Escala calculada: ${scale}`);
            
            objectGroup.scale.setScalar(scale);
            
            // Guardar el nombre del asset en userData para referencia
            objectGroup.userData = {
                assetName: selectedAsset,
                isAsset: true
            };

            return objectGroup;
        } catch (error) {
            console.error(`Error al crear objeto desde asset ${selectedAsset}:`, error);
            return null;
        }
    }

    preloadCommonAssets() {
        COMMON_ASSETS.forEach(asset => {
            this.loadAsset(asset).catch(error => {
                console.warn(`No se pudo precargar ${asset}:`, error);
            });
        });
    }

    getCacheStats() {
        const totalAssets = Object.values(this.assetMapping).reduce((total, config) => {
            return total + config.assets.length;
        }, 0);

        return {
            cached: this.cache.size,
            loading: this.loadingPromises.size,
            total: totalAssets
        };
    }

    isFoodAsset(assetName) {
        const foodAssets = [
            'Waffle.glb', 'Turnip.glb', 'Tomato.glb', 'Tomato Slice.glb', 'Tentacle.glb',
            'Sushi.glb', 'Sushi Nigiri.glb', 'Steak.glb', 'Spoon.glb', 'Pumpkin.glb',
            'Popsicle.glb', 'Popsicle Chocolate.glb', 'Plate Square.glb', 'Pizza.glb',
            'Pizza Slice.glb', 'Pepper Green.glb', 'Pancakes Stack.glb', 'Mushroom Sliced.glb',
            'Lettuce.glb', 'Ketchup Bottle.glb', 'Ice Cream.glb', 'Hotdog.glb',
            'Frying Pan.glb', 'Fries.glb', 'Eggplant.glb', 'Egg.glb', 'Egg Fried.glb',
            'Cheeseburger.glb', 'Double Cheeseburger.glb', 'Burger.glb', 'Donut.glb', 
            'Cupcake.glb', 'Croissant.glb', 'Corndog.glb', 'Cooking Pot.glb', 
            'Cooking Pot-lMEdEOMg9L.glb', 'Chopsticks.glb', 'Chocolate Bar.glb', 
            'Chicken Leg.glb', 'Carrot.glb', 'Broccoli.glb', 'Bread.glb', 
            'Bread Slice.glb', 'Bottle.glb', 'Bottle-Pc8dM9Ja4V.glb', 'Soda.glb',
            'Banana.glb', 'Bacon.glb', 'Avocado.glb', 'Apple Green.glb'
        ];
        return foodAssets.includes(assetName);
    }

    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }
    
    // Método para verificar la disponibilidad de assets
    async checkAssetAvailability(assetName) {
        const assetPath = this.isFoodAsset(assetName) 
            ? `/assets/Ultimate Food Pack-glb/${assetName}`
            : `/assets/Office Pack-glb/${assetName}`;
            
        try {
            const response = await fetch(assetPath, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            console.error(`Error verificando disponibilidad de ${assetName}:`, error);
            return false;
        }
    }
} 