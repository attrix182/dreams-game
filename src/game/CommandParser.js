/**
 * CommandParser.js - Sistema de interpretación de comandos naturales
 * Permite comandos como "crear couch en color rojo y gigante"
 */

export class CommandParser {
    constructor() {
        this.setupColorMapping();
        this.setupSizeMapping();
        this.setupActionMapping();
    }

    /**
     * Mapeo de colores en español
     */
    setupColorMapping() {
        this.colorMapping = {
            // Colores básicos
            'rojo': 0xff0000,
            'roja': 0xff0000,
            'azul': 0x0000ff,
            'azul': 0x0000ff,
            'verde': 0x00ff00,
            'verde': 0x00ff00,
            'amarillo': 0xffff00,
            'amarilla': 0xffff00,
            'naranja': 0xff8000,
            'naranja': 0xff8000,
            'morado': 0x8000ff,
            'morada': 0x8000ff,
            'rosa': 0xff0080,
            'rosa': 0xff0080,
            'negro': 0x000000,
            'negra': 0x000000,
            'blanco': 0xffffff,
            'blanca': 0xffffff,
            'gris': 0x808080,
            'gris': 0x808080,
            'marrón': 0x8b4513,
            'marrón': 0x8b4513,
            'café': 0x8b4513,
            'café': 0x8b4513,
            
            // Colores metálicos
            'dorado': 0xffd700,
            'dorada': 0xffd700,
            'plateado': 0xc0c0c0,
            'plateada': 0xc0c0c0,
            'bronce': 0xcd7f32,
            'bronce': 0xcd7f32,
            
            // Colores especiales
            'transparente': 0xffffff,
            'invisible': 0xffffff,
            'brillante': 0xffffcc,
            'brillante': 0xffffcc,
            'neón': 0x00ffff,
            'neón': 0x00ffff,
            'pastel': 0xffb6c1,
            'pastel': 0xffb6c1
        };
    }

    /**
     * Mapeo de tamaños
     */
    setupSizeMapping() {
        this.sizeMapping = {
            // Tamaños básicos
            'muy pequeño': 0.3,
            'muy pequeña': 0.3,
            'pequeño': 0.5,
            'pequeña': 0.5,
            'normal': 1.0,
            'mediano': 1.0,
            'mediana': 1.0,
            'grande': 2.0,
            'grande': 2.0,
            'muy grande': 3.0,
            'muy grande': 3.0,
            'enorme': 4.0,
            'enorme': 4.0,
            'gigante': 5.0,
            'gigante': 5.0,
            'masivo': 6.0,
            'masivo': 6.0,
            'colosal': 8.0,
            'colosal': 8.0,
            
            // Tamaños específicos
            'mini': 0.2,
            'micro': 0.1,
            'mega': 4.0,
            'ultra': 6.0,
            'titan': 10.0
        };
    }

    /**
     * Mapeo de acciones
     */
    setupActionMapping() {
        this.actionMapping = {
            'crear': 'create',
            'generar': 'create',
            'hacer': 'create',
            'poner': 'create',
            'colocar': 'create',
            'agregar': 'create',
            'añadir': 'create',
            'spawn': 'create',
            'spawnear': 'create'
        };
    }

    /**
     * Parsea un comando natural y extrae información
     * @param {string} command - Comando a parsear
     * @returns {object} - Información extraída
     */
    parseCommand(command) {
        const lowerCommand = command.toLowerCase().trim();
        
        // Extraer acción
        const action = this.extractAction(lowerCommand);
        
        // Extraer objeto principal
        const object = this.extractObject(lowerCommand, action);
        
        // Extraer color
        const color = this.extractColor(lowerCommand);
        
        // Extraer tamaño
        const size = this.extractSize(lowerCommand);
        
        // Extraer material/efectos
        const material = this.extractMaterial(lowerCommand);
        
        console.log('🔍 Comando parseado:', {
            original: command,
            action,
            object,
            color,
            size,
            material
        });

        return {
            action,
            object,
            color,
            size,
            material,
            original: command
        };
    }

    /**
     * Extrae la acción del comando
     */
    extractAction(command) {
        for (const [spanish, english] of Object.entries(this.actionMapping)) {
            if (command.includes(spanish)) {
                return english;
            }
        }
        return 'create'; // Por defecto
    }

    /**
     * Extrae el objeto principal del comando
     */
    extractObject(command, action) {
        // Remover la acción del comando
        let cleanCommand = command;
        for (const [spanish, english] of Object.entries(this.actionMapping)) {
            cleanCommand = cleanCommand.replace(spanish, '').trim();
        }
        
        // Remover palabras de color
        for (const color of Object.keys(this.colorMapping)) {
            cleanCommand = cleanCommand.replace(new RegExp(`\\b${color}\\b`, 'g'), '');
        }
        
        // Remover palabras de tamaño
        for (const size of Object.keys(this.sizeMapping)) {
            cleanCommand = cleanCommand.replace(new RegExp(`\\b${size}\\b`, 'g'), '');
        }
        
        // Remover palabras comunes
        const commonWords = [
            'en', 'de', 'con', 'y', 'o', 'color', 'tamaño', 'material',
            'textura', 'brillante', 'opaco', 'transparente', 'invisible'
        ];
        
        for (const word of commonWords) {
            cleanCommand = cleanCommand.replace(new RegExp(`\\b${word}\\b`, 'g'), '');
        }
        
        // Limpiar espacios extra y caracteres especiales
        cleanCommand = cleanCommand.replace(/\s+/g, ' ').trim();
        cleanCommand = cleanCommand.replace(/[^\w\s]/g, '');
        
        return cleanCommand;
    }

    /**
     * Extrae el color del comando
     */
    extractColor(command) {
        for (const [colorName, colorValue] of Object.entries(this.colorMapping)) {
            if (command.includes(colorName)) {
                return {
                    name: colorName,
                    value: colorValue
                };
            }
        }
        return null;
    }

    /**
     * Extrae el tamaño del comando
     */
    extractSize(command) {
        for (const [sizeName, sizeValue] of Object.entries(this.sizeMapping)) {
            if (command.includes(sizeName)) {
                return {
                    name: sizeName,
                    value: sizeValue
                };
            }
        }
        return {
            name: 'normal',
            value: 1.0
        };
    }

    /**
     * Extrae material/efectos del comando
     */
    extractMaterial(command) {
        const materials = {
            'brillante': { type: 'phong', emissive: 0x222222 },
            'opaco': { type: 'lambert' },
            'transparente': { type: 'basic', transparent: true, opacity: 0.5 },
            'invisible': { type: 'basic', transparent: true, opacity: 0.1 },
            'metálico': { type: 'phong', metalness: 1.0 },
            'metálica': { type: 'phong', metalness: 1.0 },
            'neón': { type: 'basic', emissive: 0x444444 }
        };

        for (const [materialName, materialProps] of Object.entries(materials)) {
            if (command.includes(materialName)) {
                return materialProps;
            }
        }
        
        return { type: 'basic' };
    }

    /**
     * Genera una descripción legible del comando parseado
     */
    generateDescription(parsed) {
        let description = parsed.object;
        
        if (parsed.color) {
            description += ` ${parsed.color.name}`;
        }
        
        if (parsed.size && parsed.size.name !== 'normal') {
            description += ` ${parsed.size.name}`;
        }
        
        return description;
    }
} 