import { pipeline } from '@xenova/transformers';

export class AIService {
    constructor() {
        this.textClassifier = null;
        this.textGenerator = null;
        this.isInitialized = false;
        this.objectTemplates = this.createObjectTemplates();
    }

    async init() {
        try {
            console.log('🤖 Inicializando servicio de IA...');
            
            // Inicializar pipeline de clasificación de texto
            this.textClassifier = await pipeline('text-classification', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
            
            // Inicializar pipeline de generación de texto
            this.textGenerator = await pipeline('text-generation', 'Xenova/gpt2');
            
            this.isInitialized = true;
            console.log('✅ Servicio de IA inicializado');
            
        } catch (error) {
            console.error('❌ Error al inicializar IA:', error);
            // Fallback: usar lógica local si la IA no está disponible
            console.log('🔄 Usando lógica local como fallback');
        }
    }

    async generateObject(description) {
        if (!this.isInitialized) {
            return this.generateObjectLocal(description);
        }

        try {
            console.log('🤖 Procesando descripción con IA:', description);
            
            // Analizar la descripción para extraer características
            const analysis = await this.analyzeDescription(description);
            
            // Generar datos del objeto basados en el análisis
            const objectData = this.generateObjectData(description, analysis);
            
            return objectData;
            
        } catch (error) {
            console.error('❌ Error en IA, usando fallback:', error);
            return this.generateObjectLocal(description);
        }
    }

    async analyzeDescription(description) {
        const analysis = {
            type: 'unknown',
            size: 'medium',
            color: null,
            material: null,
            effects: [],
            complexity: 'medium',
            theme: 'neutral',
            properties: {}
        };

        const lowerDesc = description.toLowerCase();

        // Análisis de tipo de objeto (50+ categorías)
        analysis.type = this.detectObjectType(lowerDesc);
        
        // Análisis de tema
        analysis.theme = this.detectTheme(lowerDesc);
        
        // Análisis de propiedades físicas
        analysis.properties = this.detectProperties(lowerDesc);

        // Análisis de tamaño
        if (lowerDesc.includes('grande') || lowerDesc.includes('big') || lowerDesc.includes('enorme')) {
            analysis.size = 'large';
        } else if (lowerDesc.includes('pequeño') || lowerDesc.includes('small') || lowerDesc.includes('mini')) {
            analysis.size = 'small';
        }

        // Análisis de color expandido
        analysis.color = this.detectColor(lowerDesc);

        // Análisis de material expandido
        analysis.material = this.detectMaterial(lowerDesc);

        // Análisis de efectos expandido
        analysis.effects = this.detectEffects(lowerDesc);

        // Análisis de complejidad
        if (lowerDesc.includes('complejo') || lowerDesc.includes('complex') || lowerDesc.includes('detallado')) {
            analysis.complexity = 'high';
        } else if (lowerDesc.includes('simple') || lowerDesc.includes('básico')) {
            analysis.complexity = 'low';
        }

        return analysis;
    }

    detectObjectType(description) {
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
            if (keywords.some(keyword => description.includes(keyword))) {
                return type;
            }
        }

        return 'unknown';
    }

    detectTheme(description) {
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
            if (keywords.some(keyword => description.includes(keyword))) {
                return theme;
            }
        }

        return 'neutral';
    }

    detectProperties(description) {
        const properties = {
            weight: 'medium',
            buoyancy: 'neutral',
            conductivity: 'neutral',
            transparency: 'opaque',
            magnetism: 'none',
            radioactivity: 'none',
            temperature: 'normal'
        };

        // Peso
        if (description.includes('pesado') || description.includes('heavy')) {
            properties.weight = 'heavy';
        } else if (description.includes('ligero') || description.includes('light')) {
            properties.weight = 'light';
        }

        // Flotabilidad
        if (description.includes('flota') || description.includes('float') || description.includes('flotante')) {
            properties.buoyancy = 'floating';
        } else if (description.includes('se hunde') || description.includes('sink')) {
            properties.buoyancy = 'sinking';
        }

        // Conductividad
        if (description.includes('conductor') || description.includes('eléctrico')) {
            properties.conductivity = 'conductive';
        } else if (description.includes('aislante') || description.includes('insulator')) {
            properties.conductivity = 'insulating';
        }

        // Transparencia
        if (description.includes('transparente') || description.includes('transparent')) {
            properties.transparency = 'transparent';
        } else if (description.includes('translúcido') || description.includes('translucent')) {
            properties.transparency = 'translucent';
        }

        // Magnetismo
        if (description.includes('magnético') || description.includes('magnetic')) {
            properties.magnetism = 'magnetic';
        }

        // Radioactividad
        if (description.includes('radioactivo') || description.includes('radioactive')) {
            properties.radioactivity = 'radioactive';
        }

        // Temperatura
        if (description.includes('caliente') || description.includes('hot') || description.includes('ardiente')) {
            properties.temperature = 'hot';
        } else if (description.includes('frío') || description.includes('cold') || description.includes('helado')) {
            properties.temperature = 'cold';
        }

        return properties;
    }

    detectColor(description) {
        // Sistema expandido de colores (30+ colores)
        const colorPatterns = {
            // Colores básicos
            'rojo': ['rojo', 'red', 'carmesí', 'crimson', 'escarlata', 'scarlet', 'granate', 'burgundy'],
            'azul': ['azul', 'blue', 'celeste', 'sky blue', 'navy', 'marino', 'cobalto', 'cobalt'],
            'verde': ['verde', 'green', 'esmeralda', 'emerald', 'oliva', 'olive', 'menta', 'mint'],
            'amarillo': ['amarillo', 'yellow', 'dorado', 'golden', 'lima', 'lime', 'crema', 'cream'],
            'naranja': ['naranja', 'orange', 'mandarina', 'tangerine', 'melocotón', 'peach', 'coral'],
            'morado': ['morado', 'purple', 'violeta', 'violet', 'lavanda', 'lavender', 'púrpura'],
            'rosa': ['rosa', 'pink', 'fucsia', 'fuchsia', 'magenta', 'salmon', 'salmón'],
            'marrón': ['marrón', 'brown', 'café', 'coffee', 'chocolate', 'caramelo', 'caramel'],
            
            // Colores neutros
            'negro': ['negro', 'black', 'ébano', 'ebony', 'carbón', 'charcoal'],
            'blanco': ['blanco', 'white', 'nieve', 'snow', 'perla', 'pearl', 'hueso', 'bone'],
            'gris': ['gris', 'gray', 'gris', 'grey', 'plata', 'silver', 'acero', 'steel'],
            
            // Colores metálicos
            'dorado': ['dorado', 'gold', 'oro', 'bronce', 'bronze', 'latón', 'brass'],
            'plateado': ['plateado', 'silver', 'plata', 'aluminio', 'aluminum', 'cromo', 'chrome'],
            'cobre': ['cobre', 'copper', 'bronce', 'bronze', 'latón', 'brass'],
            
            // Colores especiales
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
            if (keywords.some(keyword => description.includes(keyword))) {
                return color;
            }
        }

        return null;
    }

    detectMaterial(description) {
        // Sistema expandido de materiales (25+ materiales)
        const materialPatterns = {
            // Materiales naturales
            'madera': ['madera', 'wood', 'pino', 'pine', 'roble', 'oak', 'cedro', 'cedar', 'caoba', 'mahogany'],
            'piedra': ['piedra', 'stone', 'mármol', 'marble', 'granito', 'granite', 'pizarra', 'slate'],
            'metal': ['metal', 'hierro', 'iron', 'acero', 'steel', 'aluminio', 'aluminum', 'cobre', 'copper'],
            'cristal': ['cristal', 'glass', 'vidrio', 'cristalino', 'crystalline', 'transparente'],
            'tela': ['tela', 'fabric', 'algodón', 'cotton', 'seda', 'silk', 'lana', 'wool', 'lino', 'linen'],
            'cuero': ['cuero', 'leather', 'piel', 'skin', 'ante', 'suede'],
            
            // Materiales sintéticos
            'plástico': ['plástico', 'plastic', 'pvc', 'poliéster', 'polyester', 'nylon', 'nylon'],
            'goma': ['goma', 'rubber', 'caucho', 'elástico', 'elastic', 'flexible'],
            'cerámica': ['cerámica', 'ceramic', 'porcelana', 'porcelain', 'arcilla', 'clay'],
            'papel': ['papel', 'paper', 'cartón', 'cardboard', 'pergamino', 'parchment'],
            
            // Materiales especiales
            'oro': ['oro', 'gold', 'dorado', 'golden', 'precioso', 'precious'],
            'plata': ['plata', 'silver', 'plateado', 'silvered', 'metálico'],
            'bronce': ['bronce', 'bronze', 'latón', 'brass', 'cobre', 'copper'],
            'diamante': ['diamante', 'diamond', 'cristal', 'crystal', 'gema', 'gem'],
            'perla': ['perla', 'pearl', 'nacar', 'mother of pearl', 'iridiscente'],
            
            // Materiales mágicos/fantásticos
            'mágico': ['mágico', 'magical', 'encantado', 'enchanted', 'místico', 'mystical'],
            'etéreo': ['etéreo', 'ethereal', 'espiritual', 'spiritual', 'divino', 'divine'],
            'cristal_mágico': ['cristal mágico', 'magical crystal', 'gema mágica', 'magical gem'],
            'hielo_mágico': ['hielo mágico', 'magical ice', 'cristal de hielo', 'ice crystal'],
            'fuego_mágico': ['fuego mágico', 'magical fire', 'llama eterna', 'eternal flame'],
            
            // Materiales tecnológicos
            'circuito': ['circuito', 'circuit', 'electrónico', 'electronic', 'digital', 'digital'],
            'neón': ['neón', 'neon', 'fluorescente', 'fluorescent', 'led', 'led'],
            'holograma': ['holograma', 'hologram', 'virtual', 'virtual', 'digital', 'digital'],
            'nanotecnología': ['nanotecnología', 'nanotechnology', 'nano', 'nano', 'microscópico'],
            
            // Propiedades de materiales
            'brillante': ['brillante', 'shiny', 'reflectante', 'reflective', 'pulido', 'polished'],
            'mate': ['mate', 'matte', 'opaco', 'opaque', 'sin brillo', 'dull'],
            'transparente': ['transparente', 'transparent', 'cristalino', 'crystalline'],
            'translúcido': ['translúcido', 'translucent', 'semi-transparente']
        };

        for (const [material, keywords] of Object.entries(materialPatterns)) {
            if (keywords.some(keyword => description.includes(keyword))) {
                return material;
            }
        }

        return null;
    }

    detectEffects(description) {
        // Sistema expandido de efectos (20+ efectos)
        const effects = [];
        
        const effectPatterns = {
            // Efectos de movimiento
            'rotación': ['rotación', 'rotation', 'girando', 'spinning', 'rotativo', 'rotary', 'gira', 'turns'],
            'flotación': ['flotante', 'floating', 'flota', 'floats', 'levitación', 'levitation', 'suspendido'],
            'oscilación': ['oscila', 'oscillates', 'balanceo', 'swinging', 'pendular', 'pendulum'],
            'vibración': ['vibra', 'vibrates', 'temblor', 'tremor', 'estremecimiento', 'shaking'],
            'pulsación': ['pulsa', 'pulses', 'latido', 'heartbeat', 'ritmo', 'rhythm'],
            
            // Efectos de luz
            'brillo': ['brillante', 'shiny', 'luminoso', 'luminous', 'resplandeciente', 'radiant'],
            'resplandor': ['resplandece', 'glows', 'aura', 'halo', 'corona', 'corona'],
            'parpadeo': ['parpadea', 'blinks', 'intermitente', 'flashing', 'titila', 'twinkles'],
            'arcoíris': ['arcoíris', 'rainbow', 'multicolor', 'prismatic', 'iridiscente'],
            'neón': ['neón', 'neon', 'fluorescente', 'fluorescent', 'led', 'bright'],
            
            // Efectos de partículas
            'partículas': ['partículas', 'particles', 'polvo', 'dust', 'cenizas', 'ashes'],
            'chispas': ['chispas', 'sparks', 'electricidad', 'electricity', 'rayos', 'lightning'],
            'humo': ['humo', 'smoke', 'vapor', 'steam', 'niebla', 'mist'],
            'fuego': ['fuego', 'fire', 'llama', 'flame', 'ardiente', 'burning'],
            'hielo': ['hielo', 'ice', 'escarcha', 'frost', 'cristal de hielo', 'ice crystal'],
            
            // Efectos mágicos
            'mágico': ['mágico', 'magical', 'encantado', 'enchanted', 'hechizado', 'spelled'],
            'etéreo': ['etéreo', 'ethereal', 'espiritual', 'spiritual', 'divino', 'divine'],
            'portal': ['portal', 'gateway', 'teletransporte', 'teleport', 'agujero de gusano'],
            'transformación': ['transforma', 'transforms', 'cambio', 'change', 'metamorfosis'],
            'invisibilidad': ['invisible', 'invisible', 'oculto', 'hidden', 'camuflado'],
            
            // Efectos de sonido
            'sonido': ['sonido', 'sound', 'música', 'music', 'melodía', 'melody', 'armonía'],
            'eco': ['eco', 'echo', 'resonancia', 'resonance', 'reverberación'],
            'silbido': ['silba', 'whistles', 'zumbido', 'buzzing', 'vibración', 'vibration'],
            
            // Efectos de gravedad
            'antigravedad': ['antigravedad', 'antigravity', 'flota', 'floats', 'sin peso'],
            'gravedad': ['gravedad', 'gravity', 'pesado', 'heavy', 'atracción'],
            
            // Efectos de tiempo
            'lentitud': ['lento', 'slow', 'ralentizado', 'slow motion', 'congelado'],
            'velocidad': ['rápido', 'fast', 'acelerado', 'accelerated', 'turbo'],
            'pausa': ['pausa', 'pause', 'detenido', 'stopped', 'congelado', 'frozen'],
            
            // Efectos de tamaño
            'crecimiento': ['crece', 'grows', 'expansión', 'expansion', 'agranda'],
            'reducción': ['reduce', 'shrinks', 'contracción', 'contraction', 'encoge'],
            'escala': ['escala', 'scale', 'tamaño', 'size', 'proporción'],
            
            // Efectos de color
            'cambio_color': ['cambia color', 'color change', 'cromático', 'chromatic'],
            'fade': ['desvanece', 'fades', 'transparencia', 'transparency', 'desaparece'],
            'gradiente': ['gradiente', 'gradient', 'degradado', 'degraded', 'mezcla'],
            
            // Efectos especiales
            'holograma': ['holograma', 'hologram', 'virtual', 'virtual', 'proyección'],
            'espejo': ['espejo', 'mirror', 'reflejo', 'reflection', 'reflectante'],
            'lente': ['lente', 'lens', 'amplificación', 'magnification', 'zoom'],
            'prisma': ['prisma', 'prism', 'refracción', 'refraction', 'dispersión'],
            'cristal': ['cristal', 'crystal', 'transparente', 'transparent', 'claro']
        };

        for (const [effect, keywords] of Object.entries(effectPatterns)) {
            if (keywords.some(keyword => description.includes(keyword))) {
                effects.push(effect);
            }
        }

        return effects;
    }

    generateObjectData(description, analysis) {
        const sizeMap = {
            'small': 0.5,
            'medium': 1.0,
            'large': 2.0
        };

        const objectData = {
            name: this.generateName(description),
            description: description,
            type: analysis.type,
            size: sizeMap[analysis.size],
            color: analysis.color,
            material: analysis.material,
            effects: analysis.effects,
            complexity: analysis.complexity,
            position: this.generateRandomPosition(),
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1.0
        };

        // Aplicar plantillas específicas si existen
        if (this.objectTemplates[analysis.type]) {
            Object.assign(objectData, this.objectTemplates[analysis.type]);
        }

        return objectData;
    }

    generateObjectLocal(description) {
        console.log('🔄 Generando objeto con lógica local:', description);
        
        // Lógica local simple para cuando la IA no está disponible
        const analysis = this.analyzeDescriptionLocal(description);
        return this.generateObjectData(description, analysis);
    }

    analyzeDescriptionLocal(description) {
        // Versión simplificada del análisis para uso local
        const analysis = {
            type: 'unknown',
            size: 'medium',
            color: null,
            material: null,
            effects: [],
            complexity: 'medium'
        };

        const lowerDesc = description.toLowerCase();

        // Análisis básico de palabras clave
        const typeKeywords = {
            'tree': ['árbol', 'tree', 'planta'],
            'house': ['casa', 'house', 'hogar', 'edificio'],
            'animal': ['animal', 'perro', 'gato', 'dragón', 'dragon'],
            'vehicle': ['coche', 'carro', 'auto', 'car', 'vehicle'],
            'magical': ['mágico', 'magical', 'cristal', 'crystal'],
            'sphere': ['esfera', 'sphere', 'bola', 'ball'],
            'cube': ['cubo', 'cube', 'caja', 'box'],
            'cylinder': ['cilindro', 'cylinder', 'tubo', 'tube'],
            'cone': ['cono', 'cone'],
            'torus': ['toro', 'torus', 'donut']
        };

        for (const [type, keywords] of Object.entries(typeKeywords)) {
            if (keywords.some(keyword => lowerDesc.includes(keyword))) {
                analysis.type = type;
                break;
            }
        }

        // Análisis básico de color
        const colors = ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'rosa', 'marrón', 
                       'negro', 'blanco', 'gris', 'dorado', 'plateado', 'turquesa', 'magenta', 'cyan'];
        
        for (const color of colors) {
            if (lowerDesc.includes(color)) {
                analysis.color = color;
                break;
            }
        }

        // Efectos básicos
        if (lowerDesc.includes('brillante') || lowerDesc.includes('mágico')) {
            analysis.effects.push('brillo');
        }
        if (lowerDesc.includes('flotante') || lowerDesc.includes('volando')) {
            analysis.effects.push('flotación');
        }

        return analysis;
    }

    generateName(description) {
        // Generar un nombre basado en la descripción
        const words = description.split(' ').filter(word => word.length > 2);
        if (words.length > 0) {
            return words[0].charAt(0).toUpperCase() + words[0].slice(1);
        }
        return 'Objeto';
    }

    generateRandomPosition() {
        return {
            x: (Math.random() - 0.5) * 20,
            y: 0,
            z: (Math.random() - 0.5) * 20
        };
    }

    createObjectTemplates() {
        return {
            // NATURALEZA
            tree: { effects: ['flotación'], material: 'madera', complexity: 'medium' },
            flower: { effects: ['oscilación'], material: null, complexity: 'low' },
            rock: { effects: [], material: 'piedra', complexity: 'low' },
            water: { effects: ['oscilación', 'transparencia'], material: 'cristal', complexity: 'medium' },
            
            // CONSTRUCCIONES
            house: { effects: [], material: 'madera', complexity: 'high' },
            tower: { effects: [], material: 'piedra', complexity: 'high' },
            bridge: { effects: [], material: 'metal', complexity: 'high' },
            wall: { effects: [], material: 'piedra', complexity: 'medium' },
            door: { effects: ['oscilación'], material: 'madera', complexity: 'medium' },
            window: { effects: ['transparencia'], material: 'cristal', complexity: 'low' },
            
            // VEHÍCULOS
            car: { effects: ['rotación'], material: 'metal', complexity: 'high' },
            airplane: { effects: ['flotación', 'rotación'], material: 'metal', complexity: 'high' },
            ship: { effects: ['oscilación'], material: 'madera', complexity: 'high' },
            train: { effects: ['rotación'], material: 'metal', complexity: 'high' },
            bicycle: { effects: ['rotación'], material: 'metal', complexity: 'medium' },
            spaceship: { effects: ['flotación', 'brillo'], material: 'metal', complexity: 'high' },
            
            // ANIMALES
            mammal: { effects: ['oscilación'], material: null, complexity: 'medium' },
            bird: { effects: ['flotación', 'oscilación'], material: null, complexity: 'medium' },
            fish: { effects: ['oscilación'], material: null, complexity: 'medium' },
            reptile: { effects: ['oscilación'], material: null, complexity: 'medium' },
            dragon: { effects: ['flotación', 'fuego', 'brillo'], material: null, complexity: 'high' },
            unicorn: { effects: ['flotación', 'brillo', 'mágico'], material: null, complexity: 'high' },
            
            // OBJETOS MÁGICOS
            crystal: { effects: ['brillo', 'partículas', 'transparencia'], material: 'cristal', complexity: 'medium' },
            wand: { effects: ['brillo', 'mágico'], material: 'madera', complexity: 'medium' },
            potion: { effects: ['oscilación', 'brillo'], material: 'cristal', complexity: 'low' },
            scroll: { effects: ['oscilación'], material: 'papel', complexity: 'low' },
            orb: { effects: ['rotación', 'brillo', 'transparencia'], material: 'cristal', complexity: 'medium' },
            
            // MUEBLES
            chair: { effects: [], material: 'madera', complexity: 'medium' },
            table: { effects: [], material: 'madera', complexity: 'medium' },
            bed: { effects: [], material: 'madera', complexity: 'medium' },
            cabinet: { effects: [], material: 'madera', complexity: 'medium' },
            lamp: { effects: ['brillo'], material: 'metal', complexity: 'medium' },
            
            // INSTRUMENTOS
            piano: { effects: ['sonido'], material: 'madera', complexity: 'high' },
            guitar: { effects: ['sonido', 'oscilación'], material: 'madera', complexity: 'medium' },
            drum: { effects: ['sonido', 'vibración'], material: 'madera', complexity: 'medium' },
            flute: { effects: ['sonido'], material: 'metal', complexity: 'medium' },
            
            // HERRAMIENTAS
            hammer: { effects: ['vibración'], material: 'metal', complexity: 'low' },
            axe: { effects: [], material: 'metal', complexity: 'low' },
            saw: { effects: ['vibración'], material: 'metal', complexity: 'low' },
            drill: { effects: ['rotación', 'vibración'], material: 'metal', complexity: 'medium' },
            
            // TECNOLOGÍA
            computer: { effects: ['brillo'], material: 'plástico', complexity: 'high' },
            robot: { effects: ['rotación', 'brillo'], material: 'metal', complexity: 'high' },
            screen: { effects: ['brillo', 'transparencia'], material: 'cristal', complexity: 'medium' },
            console: { effects: ['brillo'], material: 'plástico', complexity: 'medium' },
            
            // ALIMENTOS
            fruit: { effects: [], material: null, complexity: 'low' },
            cake: { effects: [], material: null, complexity: 'medium' },
            drink: { effects: ['oscilación'], material: 'cristal', complexity: 'low' },
            
            // FORMAS GEOMÉTRICAS
            sphere: { effects: ['rotación'], material: null, complexity: 'low' },
            cube: { effects: [], material: null, complexity: 'low' },
            cylinder: { effects: [], material: null, complexity: 'low' },
            cone: { effects: [], material: null, complexity: 'low' },
            torus: { effects: ['rotación'], material: null, complexity: 'low' },
            pyramid: { effects: [], material: null, complexity: 'low' },
            
            // ELEMENTOS NATURALES
            fire: { effects: ['fuego', 'brillo', 'oscilación'], material: null, complexity: 'medium' },
            ice: { effects: ['brillo', 'transparencia'], material: 'hielo_mágico', complexity: 'medium' },
            cloud: { effects: ['oscilación', 'transparencia'], material: null, complexity: 'medium' },
            lightning: { effects: ['chispas', 'brillo'], material: null, complexity: 'medium' },
            
            // OBJETOS DECORATIVOS
            statue: { effects: [], material: 'piedra', complexity: 'high' },
            painting: { effects: [], material: 'tela', complexity: 'medium' },
            mirror: { effects: ['espejo'], material: 'cristal', complexity: 'medium' },
            clock: { effects: ['rotación'], material: 'metal', complexity: 'medium' },
            
            // OBJETOS MISCELÁNEOS
            balloon: { effects: ['flotación', 'oscilación'], material: 'goma', complexity: 'low' },
            umbrella: { effects: ['oscilación'], material: 'tela', complexity: 'medium' },
            flag: { effects: ['oscilación'], material: 'tela', complexity: 'low' },
            key: { effects: [], material: 'metal', complexity: 'low' },
            book: { effects: [], material: 'papel', complexity: 'low' },
            phone: { effects: ['brillo'], material: 'plástico', complexity: 'medium' },
            bag: { effects: [], material: 'tela', complexity: 'low' },
            hat: { effects: [], material: 'tela', complexity: 'low' },
            shoe: { effects: [], material: 'cuero', complexity: 'low' }
        };
    }

    // Métodos de utilidad para IA avanzada
    async classifyText(text) {
        if (!this.textClassifier) return null;
        
        try {
            const result = await this.textClassifier(text);
            return result;
        } catch (error) {
            console.error('Error en clasificación de texto:', error);
            return null;
        }
    }

    async generateText(prompt, maxLength = 50) {
        if (!this.textGenerator) return null;
        
        try {
            const result = await this.textGenerator(prompt, {
                max_length: maxLength,
                temperature: 0.7,
                do_sample: true
            });
            return result[0].generated_text;
        } catch (error) {
            console.error('Error en generación de texto:', error);
            return null;
        }
    }

    // Método para mejorar la generación con feedback del usuario
    async improveObject(objectData, feedback) {
        console.log('🔄 Mejorando objeto basado en feedback:', feedback);
        
        // Analizar el feedback para mejorar el objeto
        const improvedData = { ...objectData };
        
        if (feedback.includes('más grande') || feedback.includes('bigger')) {
            improvedData.size *= 1.5;
        } else if (feedback.includes('más pequeño') || feedback.includes('smaller')) {
            improvedData.size *= 0.7;
        }
        
        if (feedback.includes('más colorido') || feedback.includes('colorful')) {
            improvedData.effects.push('brillo');
        }
        
        if (feedback.includes('más mágico') || feedback.includes('magical')) {
            improvedData.effects.push('partículas');
            improvedData.effects.push('flotación');
        }
        
        return improvedData;
    }

    // Método para generar objetos relacionados
    async generateRelatedObjects(baseObject, count = 3) {
        console.log('🔄 Generando objetos relacionados');
        
        const relatedObjects = [];
        const baseType = baseObject.type;
        
        for (let i = 0; i < count; i++) {
            const relatedData = {
                ...baseObject,
                name: `${baseObject.name} ${i + 1}`,
                position: this.generateRandomPosition(),
                size: baseObject.size * (0.8 + Math.random() * 0.4) // Variación de tamaño
            };
            
            relatedObjects.push(relatedData);
        }
        
        return relatedObjects;
    }

    // Métodos adicionales para generación avanzada
    async generateRandomObject() {
        const types = Object.keys(this.objectTemplates);
        const randomType = types[Math.floor(Math.random() * types.length)];
        
        const adjectives = [
            'mágico', 'brillante', 'flotante', 'gigante', 'pequeño', 'colorido', 
            'transparente', 'metálico', 'cristalino', 'antiguo', 'futurista', 
            'adorable', 'aterrador', 'elegante', 'rústico', 'moderno'
        ];
        
        const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
        const description = `un ${randomAdjective} ${randomType}`;
        
        return this.generateObject(description);
    }

    async generateScene(theme, objectCount = 5) {
        console.log(`🎨 Generando escena temática: ${theme}`);
        
        const sceneObjects = [];
        const themeObjects = this.getThemeObjects(theme);
        
        for (let i = 0; i < objectCount; i++) {
            const randomObject = themeObjects[Math.floor(Math.random() * themeObjects.length)];
            const objectData = await this.generateObject(randomObject);
            sceneObjects.push(objectData);
        }
        
        return sceneObjects;
    }

    getThemeObjects(theme) {
        const themeObjects = {
            'fantasy': [
                'dragón mágico brillante', 'castillo flotante de cristal', 'varita mágica resplandeciente',
                'unicornio dorado', 'orbe de poder', 'poción mágica brillante', 'grimorio encantado',
                'cristal mágico flotante', 'portal dimensional', 'estatua mágica animada'
            ],
            'sci-fi': [
                'robot futurista brillante', 'nave espacial flotante', 'computadora holográfica',
                'dron autónomo', 'pantalla táctil flotante', 'consola de videojuegos futurista',
                'satélite espacial', 'androide metálico', 'terminal de computadora', 'robot de combate'
            ],
            'nature': [
                'árbol gigante flotante', 'flor mágica brillante', 'cascada cristalina',
                'roca mágica resplandeciente', 'fuente de agua flotante', 'árbol de cristal',
                'flor de hielo', 'árbol de fuego', 'cristal natural', 'árbol musical'
            ],
            'medieval': [
                'castillo de piedra', 'espada mágica brillante', 'armadura dorada',
                'torre de vigilancia', 'puente levadizo', 'trono real', 'escudo mágico',
                'corona de joyas', 'fortaleza imponente', 'caballero de cristal'
            ],
            'modern': [
                'coche deportivo brillante', 'edificio de cristal', 'teléfono inteligente',
                'computadora portátil', 'televisor de pantalla plana', 'lámpara moderna',
                'sofá elegante', 'mesa de cristal', 'silla ergonómica', 'reloj digital'
            ]
        };
        
        return themeObjects[theme] || themeObjects['fantasy'];
    }

    async generateCompoundObject(baseDescription) {
        console.log('🔧 Generando objeto compuesto:', baseDescription);
        
        const baseObject = await this.generateObject(baseDescription);
        const compoundParts = this.generateCompoundParts(baseObject);
        
        return {
            ...baseObject,
            isCompound: true,
            parts: compoundParts
        };
    }

    generateCompoundParts(baseObject) {
        const parts = [];
        const { type, theme } = baseObject;
        
        // Generar partes basadas en el tipo y tema
        switch (type) {
            case 'house':
                parts.push(
                    { type: 'roof', description: 'techo triangular' },
                    { type: 'door', description: 'puerta principal' },
                    { type: 'window', description: 'ventana' },
                    { type: 'chimney', description: 'chimenea' }
                );
                break;
            case 'car':
                parts.push(
                    { type: 'wheel', description: 'rueda' },
                    { type: 'headlight', description: 'farol delantero' },
                    { type: 'mirror', description: 'espejo retrovisor' },
                    { type: 'antenna', description: 'antena' }
                );
                break;
            case 'tree':
                parts.push(
                    { type: 'trunk', description: 'tronco' },
                    { type: 'branch', description: 'rama' },
                    { type: 'leaf', description: 'hoja' },
                    { type: 'fruit', description: 'fruta' }
                );
                break;
            case 'robot':
                parts.push(
                    { type: 'head', description: 'cabeza' },
                    { type: 'arm', description: 'brazo' },
                    { type: 'leg', description: 'pierna' },
                    { type: 'antenna', description: 'antena' }
                );
                break;
            default:
                parts.push(
                    { type: 'base', description: 'base' },
                    { type: 'detail', description: 'detalle' }
                );
        }
        
        return parts;
    }

    async generateAnimatedObject(description) {
        console.log('🎬 Generando objeto animado:', description);
        
        const objectData = await this.generateObject(description);
        
        // Agregar propiedades de animación
        objectData.animation = {
            type: this.detectAnimationType(description),
            speed: this.detectAnimationSpeed(description),
            loop: true,
            duration: 2.0
        };
        
        return objectData;
    }

    detectAnimationType(description) {
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('rotación') || lowerDesc.includes('gira')) {
            return 'rotation';
        } else if (lowerDesc.includes('oscilación') || lowerDesc.includes('balanceo')) {
            return 'oscillation';
        } else if (lowerDesc.includes('flotación') || lowerDesc.includes('levita')) {
            return 'floating';
        } else if (lowerDesc.includes('pulsación') || lowerDesc.includes('late')) {
            return 'pulsation';
        } else if (lowerDesc.includes('vibración') || lowerDesc.includes('tiembla')) {
            return 'vibration';
        }
        
        return 'idle';
    }

    detectAnimationSpeed(description) {
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('rápido') || lowerDesc.includes('veloz')) {
            return 'fast';
        } else if (lowerDesc.includes('lento') || lowerDesc.includes('pausado')) {
            return 'slow';
        }
        
        return 'normal';
    }

    // Método para generar objetos con efectos de partículas avanzados
    async generateParticleObject(description) {
        console.log('✨ Generando objeto con partículas:', description);
        
        const objectData = await this.generateObject(description);
        
        objectData.particles = {
            type: this.detectParticleType(description),
            count: this.detectParticleCount(description),
            color: objectData.color || 'white',
            size: 0.1,
            speed: 1.0,
            lifetime: 2.0
        };
        
        return objectData;
    }

    detectParticleType(description) {
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('fuego') || lowerDesc.includes('llama')) {
            return 'fire';
        } else if (lowerDesc.includes('chispas') || lowerDesc.includes('electricidad')) {
            return 'sparks';
        } else if (lowerDesc.includes('humo') || lowerDesc.includes('vapor')) {
            return 'smoke';
        } else if (lowerDesc.includes('hielo') || lowerDesc.includes('nieve')) {
            return 'ice';
        } else if (lowerDesc.includes('mágico') || lowerDesc.includes('brillante')) {
            return 'magic';
        }
        
        return 'dust';
    }

    detectParticleCount(description) {
        const lowerDesc = description.toLowerCase();
        
        if (lowerDesc.includes('muchas') || lowerDesc.includes('abundante')) {
            return 100;
        } else if (lowerDesc.includes('pocas') || lowerDesc.includes('escaso')) {
            return 10;
        }
        
        return 50;
    }
} 