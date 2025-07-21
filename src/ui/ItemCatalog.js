import { ASSET_MAPPING, ASSET_CATEGORIES } from '../config/AssetConfig.js';

export class ItemCatalog {
    constructor(game) {
        this.game = game;
        this.modal = null;
        this.isOpen = false;
        this.setupModal();
        this.setupKeyboardListener();
    }

    setupModal() {
        // Crear modal principal
        this.modal = document.createElement('div');
        this.modal.id = 'itemCatalogModal';
        this.modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            font-family: 'Arial', sans-serif;
            overflow-y: auto;
            outline: none;
        `;
        
        // Agregar tabindex para que pueda recibir foco
        this.modal.setAttribute('tabindex', '0');

        // Contenido del modal
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            width: 90%;
            max-width: 1200px;
            margin: 20px auto;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            color: white;
            overflow: hidden;
        `;

        // Header del modal
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid rgba(255,255,255,0.1);
        `;
        header.innerHTML = `
            <h1 style="margin: 0; font-size: 28px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
                🎨 Catálogo de Objetos Generables
            </h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
                Presiona ESC para cerrar • Haz clic en un item para generarlo
            </p>
        `;

        // Barra de búsqueda
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            padding: 20px 20px 0 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = '🔍 Buscar objetos...';
        searchInput.style.cssText = `
            width: 100%;
            padding: 12px 16px;
            border: none;
            border-radius: 8px;
            background: rgba(255,255,255,0.1);
            color: white;
            font-size: 16px;
            outline: none;
            transition: all 0.3s ease;
        `;
        searchInput.onfocus = () => {
            searchInput.style.background = 'rgba(255,255,255,0.2)';
            searchInput.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.3)';
        };
        searchInput.onblur = () => {
            searchInput.style.background = 'rgba(255,255,255,0.1)';
            searchInput.style.boxShadow = 'none';
        };

        // Función de búsqueda
        searchInput.addEventListener('input', (e) => {
            this.filterItems(e.target.value.toLowerCase());
        });

        searchContainer.appendChild(searchInput);

        // Contenedor de categorías
        const categoriesContainer = document.createElement('div');
        categoriesContainer.id = 'categoriesContainer';
        categoriesContainer.style.cssText = `
            padding: 20px;
            max-height: 60vh;
            overflow-y: auto;
        `;

        // Crear categorías
        this.createCategories(categoriesContainer);

        // Botón de cerrar
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '✕';
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
            transition: all 0.3s ease;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(255,255,255,0.3)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'rgba(255,255,255,0.2)';
        };
        closeButton.onclick = () => this.close();

        // Ensamblar modal
        modalContent.appendChild(closeButton);
        modalContent.appendChild(header);
        modalContent.appendChild(searchContainer);
        modalContent.appendChild(categoriesContainer);
        this.modal.appendChild(modalContent);

        // Eventos del modal
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        document.body.appendChild(this.modal);
    }

    createCategories(container) {
        // Agrupar items por categoría
        const categorizedItems = {};
        
        for (const [keyword, config] of Object.entries(ASSET_MAPPING)) {
            if (!categorizedItems[config.category]) {
                categorizedItems[config.category] = [];
            }
            categorizedItems[config.category].push({
                keyword,
                config,
                displayName: this.getDisplayName(keyword)
            });
        }

        // Crear sección para cada categoría
        for (const [categoryKey, items] of Object.entries(categorizedItems)) {
            const categoryInfo = ASSET_CATEGORIES[categoryKey];
            if (!categoryInfo) continue;

            const categorySection = document.createElement('div');
            categorySection.setAttribute('data-category', categoryKey);
            categorySection.style.cssText = `
                margin-bottom: 30px;
                background: rgba(255,255,255,0.05);
                border-radius: 10px;
                overflow: hidden;
            `;

            // Header de categoría
            const categoryHeader = document.createElement('div');
            categoryHeader.style.cssText = `
                background: ${categoryInfo.color}40;
                padding: 15px 20px;
                border-left: 4px solid ${categoryInfo.color};
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            categoryHeader.innerHTML = `
                <span style="font-size: 24px;">${this.getCategoryIcon(categoryKey)}</span>
                ${categoryInfo.name} (${items.length} items)
            `;

            // Grid de items
            const itemsGrid = document.createElement('div');
            itemsGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                padding: 20px;
            `;

            // Crear items
            items.forEach(item => {
                const itemCard = this.createItemCard(item);
                itemsGrid.appendChild(itemCard);
            });

            categorySection.appendChild(categoryHeader);
            categorySection.appendChild(itemsGrid);
            container.appendChild(categorySection);
        }
    }

    createItemCard(item) {
        const card = document.createElement('div');
        card.setAttribute('data-keyword', item.keyword);
        card.style.cssText = `
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            text-align: center;
        `;

        card.onmouseover = () => {
            card.style.background = 'rgba(255,255,255,0.2)';
            card.style.borderColor = ASSET_CATEGORIES[item.config.category].color;
            card.style.transform = 'translateY(-2px)';
        };

        card.onmouseout = () => {
            card.style.background = 'rgba(255,255,255,0.1)';
            card.style.borderColor = 'transparent';
            card.style.transform = 'translateY(0)';
        };

        card.onclick = () => {
            this.generateItem(item.keyword);
        };

        // Icono del item
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 32px;
            margin-bottom: 10px;
        `;
        icon.innerHTML = this.getItemIcon(item.keyword);

        // Nombre del item
        const name = document.createElement('div');
        name.setAttribute('data-display-name', '');
        name.style.cssText = `
            font-weight: bold;
            margin-bottom: 5px;
            font-size: 14px;
        `;
        name.textContent = item.displayName;

        // Información adicional
        const info = document.createElement('div');
        info.style.cssText = `
            font-size: 12px;
            opacity: 0.7;
            margin-bottom: 8px;
        `;
        info.textContent = `${item.config.assets.length} variantes`;

        // Prioridad
        const priority = document.createElement('div');
        priority.style.cssText = `
            font-size: 11px;
            opacity: 0.6;
        `;
        priority.textContent = `Prioridad: ${item.config.priority}/10`;

        // Comando de ejemplo
        const command = document.createElement('div');
        command.style.cssText = `
            font-size: 10px;
            opacity: 0.5;
            font-family: monospace;
            margin-top: 5px;
            padding: 3px 6px;
            background: rgba(0,0,0,0.3);
            border-radius: 3px;
        `;
        command.textContent = `"crear ${item.keyword}"`;

        card.appendChild(icon);
        card.appendChild(name);
        card.appendChild(info);
        card.appendChild(priority);
        card.appendChild(command);

        return card;
    }

    getDisplayName(keyword) {
        const names = {
            'escritorio': 'Escritorio',
            'mesa': 'Mesa',
            'silla': 'Silla',
            'sofá': 'Sofá',
            'estante': 'Estante',
            'gabinete': 'Gabinete',
            'computadora': 'Computadora',
            'monitor': 'Monitor',
            'teclado': 'Teclado',
            'mouse': 'Mouse',
            'teléfono': 'Teléfono',
            'impresora': 'Impresora',
            'lámpara': 'Lámpara',
            'planta': 'Planta',
            'arte': 'Arte',
            'trofeo': 'Trofeo',
            'pizarra': 'Pizarra',
            'alfombra': 'Alfombra',
            'taza': 'Taza',
            'café': 'Café',
            'soda': 'Soda',
            'papel': 'Papel',
            'cuaderno': 'Cuaderno',
            'clipboard': 'Clipboard',
            'lápiz': 'Lápiz',
            'grapadora': 'Grapadora',
            'caja': 'Caja',
            'basura': 'Basura',
            'maleta': 'Maleta',
            'dardo': 'Dardo',
            'juguete': 'Juguete',
            'patineta': 'Patineta',
            'gundam': 'Gundam',
            // Sinónimos en inglés
            'desk': 'Desk',
            'table': 'Table',
            'chair': 'Chair',
            'couch': 'Couch',
            'shelf': 'Shelf',
            'cabinet': 'Cabinet',
            'computer': 'Computer',
            'keyboard': 'Keyboard',
            'phone': 'Phone',
            'printer': 'Printer',
            'lamp': 'Lamp',
            'plant': 'Plant',
            'art': 'Art',
            'trophy': 'Trophy',
            'whiteboard': 'Whiteboard',
            'rug': 'Rug',
            'cup': 'Cup',
            'coffee': 'Coffee',
            'paper': 'Paper',
            'notebook': 'Notebook',
            'pen': 'Pen',
            'stapler': 'Stapler',
            'box': 'Box',
            'trash': 'Trash',
            'bin': 'Bin',
            'briefcase': 'Briefcase',
            'dart': 'Dart',
            'toy': 'Toy',
            'skateboard': 'Skateboard',
            
            // Nuevos alimentos
            'waffle': 'Waffle',
            'nabo': 'Nabo',
            'tomate': 'Tomate',
            'tentáculo': 'Tentáculo',
            'sushi': 'Sushi',
            'filete': 'Filete',
            'cuchara': 'Cuchara',
            'calabaza': 'Calabaza',
            'paleta': 'Paleta',
            'plato': 'Plato',
            'pizza': 'Pizza',
            'pimiento': 'Pimiento',
            'panqueques': 'Panqueques',
            'champiñón': 'Champiñón',
            'lechuga': 'Lechuga',
            'ketchup': 'Ketchup',
            'helado': 'Helado',
            'hotdog': 'Hot Dog',
            'sartén': 'Sartén',
            'papas': 'Papas Fritas',
            'berenjena': 'Berenjena',
            'huevo': 'Huevo',
            'hamburguesa': 'Hamburguesa',
            'dona': 'Dona',
            'cupcake': 'Cupcake',
            'croissant': 'Croissant',
            'corn dog': 'Corn Dog',
            'olla': 'Olla',
            'palillos': 'Palillos',
            'chocolate': 'Chocolate',
            'pollo': 'Pollo',
            'zanahoria': 'Zanahoria',
            'brócoli': 'Brócoli',
            'pan': 'Pan',
            'botella': 'Botella',
            'plátano': 'Plátano',
            'tocino': 'Tocino',
            'aguacate': 'Aguacate',
            'manzana': 'Manzana',
            
            // Sinónimos en inglés para nuevos alimentos
            'turnip': 'Turnip',
            'tomato': 'Tomato',
            'tentacle': 'Tentacle',
            'steak': 'Steak',
            'spoon': 'Spoon',
            'pumpkin': 'Pumpkin',
            'popsicle': 'Popsicle',
            'plate': 'Plate',
            'pepper': 'Pepper',
            'pancakes': 'Pancakes',
            'mushroom': 'Mushroom',
            'lettuce': 'Lettuce',
            'ice cream': 'Ice Cream',
            'frying pan': 'Frying Pan',
            'fries': 'Fries',
            'eggplant': 'Eggplant',
            'egg': 'Egg',
            'burger': 'Burger',
            'hamburger': 'Hamburger',
            'donut': 'Donut',
            'cupcake': 'Cupcake',
            'croissant': 'Croissant',
            'corndog': 'Corn Dog',
            'pot': 'Pot',
            'chopsticks': 'Chopsticks',
            'chicken': 'Chicken',
            'carrot': 'Carrot',
            'broccoli': 'Broccoli',
            'bread': 'Bread',
            'bottle': 'Bottle',
            'banana': 'Banana',
            'bacon': 'Bacon',
            'avocado': 'Avocado',
            'apple': 'Apple'
        };

        return names[keyword] || keyword.charAt(0).toUpperCase() + keyword.slice(1);
    }

    getCategoryIcon(category) {
        const icons = {
            'furniture': '🪑',
            'technology': '💻',
            'decoration': '🌿',
            'food': '🍽️',
            'stationery': '📝',
            'containers': '📦',
            'entertainment': '🎮',
            'lighting': '💡'
        };
        return icons[category] || '📦';
    }

    getItemIcon(keyword) {
        const icons = {
            'escritorio': '🪑',
            'mesa': '🪑',
            'silla': '🪑',
            'sofá': '🛋️',
            'estante': '📚',
            'gabinete': '🗄️',
            'computadora': '💻',
            'monitor': '🖥️',
            'teclado': '⌨️',
            'mouse': '🖱️',
            'teléfono': '📞',
            'impresora': '🖨️',
            'lámpara': '💡',
            'planta': '🌿',
            'arte': '🎨',
            'trofeo': '🏆',
            'pizarra': '📋',
            'alfombra': '🟫',
            'taza': '☕',
            'café': '☕',
            'soda': '🥤',
            'papel': '📄',
            'cuaderno': '📓',
            'clipboard': '📋',
            'lápiz': '✏️',
            'grapadora': '📎',
            'caja': '📦',
            'basura': '🗑️',
            'maleta': '💼',
            'dardo': '🎯',
            'juguete': '🧸',
            'patineta': '🛹',
            'gundam': '🤖',
            // Sinónimos en inglés
            'desk': '🪑',
            'table': '🪑',
            'chair': '🪑',
            'couch': '🛋️',
            'shelf': '📚',
            'cabinet': '🗄️',
            'computer': '💻',
            'keyboard': '⌨️',
            'phone': '📞',
            'printer': '🖨️',
            'lamp': '💡',
            'plant': '🌿',
            'art': '🎨',
            'trophy': '🏆',
            'whiteboard': '📋',
            'rug': '🟫',
            'cup': '☕',
            'coffee': '☕',
            'paper': '📄',
            'notebook': '📓',
            'pen': '✏️',
            'stapler': '📎',
            'box': '📦',
            'trash': '🗑️',
            'bin': '🗑️',
            'briefcase': '💼',
            'dart': '🎯',
            'toy': '🧸',
            'skateboard': '🛹',
            
            // Nuevos alimentos
            'waffle': '🧇',
            'nabo': '🥬',
            'tomate': '🍅',
            'tentáculo': '🦑',
            'sushi': '🍣',
            'filete': '🥩',
            'cuchara': '🥄',
            'calabaza': '🎃',
            'paleta': '🍧',
            'plato': '🍽️',
            'pizza': '🍕',
            'pimiento': '🫑',
            'panqueques': '🥞',
            'champiñón': '🍄',
            'lechuga': '🥬',
            'ketchup': '🍅',
            'helado': '🍦',
            'hotdog': '🌭',
            'sartén': '🍳',
            'papas': '🍟',
            'berenjena': '🍆',
            'huevo': '🥚',
            'hamburguesa': '🍔',
            'dona': '🍩',
            'cupcake': '🧁',
            'croissant': '🥐',
            'corn dog': '🌭',
            'olla': '🍲',
            'palillos': '🥢',
            'chocolate': '🍫',
            'pollo': '🍗',
            'zanahoria': '🥕',
            'brócoli': '🥦',
            'pan': '🍞',
            'botella': '🍾',
            'plátano': '🍌',
            'tocino': '🥓',
            'aguacate': '🥑',
            'manzana': '🍎',
            
            // Sinónimos en inglés para nuevos alimentos
            'turnip': '🥬',
            'tomato': '🍅',
            'tentacle': '🦑',
            'steak': '🥩',
            'spoon': '🥄',
            'pumpkin': '🎃',
            'popsicle': '🍧',
            'plate': '🍽️',
            'pepper': '🫑',
            'pancakes': '🥞',
            'mushroom': '🍄',
            'lettuce': '🥬',
            'ice cream': '🍦',
            'frying pan': '🍳',
            'fries': '🍟',
            'eggplant': '🍆',
            'egg': '🥚',
            'burger': '🍔',
            'hamburger': '🍔',
            'donut': '🍩',
            'cupcake': '🧁',
            'croissant': '🥐',
            'corndog': '🌭',
            'pot': '🍲',
            'chopsticks': '🥢',
            'chicken': '🍗',
            'carrot': '🥕',
            'broccoli': '🥦',
            'bread': '🍞',
            'bottle': '🍾',
            'banana': '🍌',
            'bacon': '🥓',
            'avocado': '🥑',
            'apple': '🍎'
        };
        return icons[keyword] || '📦';
    }

    filterItems(searchTerm) {
        const categoriesContainer = document.getElementById('categoriesContainer');
        const categorySections = categoriesContainer.querySelectorAll('[data-category]');
        
        categorySections.forEach(section => {
            const itemCards = section.querySelectorAll('[data-keyword]');
            let visibleItems = 0;
            
            itemCards.forEach(card => {
                const keyword = card.getAttribute('data-keyword');
                const displayName = card.querySelector('[data-display-name]').textContent;
                
                const matches = keyword.toLowerCase().includes(searchTerm) || 
                              displayName.toLowerCase().includes(searchTerm);
                
                card.style.display = matches ? 'block' : 'none';
                if (matches) visibleItems++;
            });
            
            // Mostrar/ocultar categoría completa
            section.style.display = visibleItems > 0 ? 'block' : 'none';
        });
    }

    generateItem(keyword) {
        this.close();
        // Simular un pequeño delay para que se cierre el modal primero
        setTimeout(() => {
            if (this.game && this.game.generateObject) {
                this.game.generateObject(keyword);
            }
        }, 100);
    }

    setupKeyboardListener() {
        document.addEventListener('keydown', (e) => {
            // Verificar si el usuario está escribiendo en algún input
            const activeElement = document.activeElement;
            const isTypingInInput = activeElement && (
                activeElement.tagName === 'INPUT' || 
                activeElement.tagName === 'TEXTAREA' ||
                activeElement.contentEditable === 'true' ||
                activeElement.id === 'chatInput' ||
                activeElement.id === 'messageInput' ||
                activeElement.id === 'uiObjectInput' ||
                activeElement.id === 'quickObjectInput'
            );
            
            if (e.key === 'i' || e.key === 'I') {
                // Solo abrir si no está escribiendo en un input
                if (!isTypingInInput) {
                    e.preventDefault();
                    this.toggle();
                }
            } else if (e.key === 'Escape' && this.isOpen) {
                e.preventDefault();
                this.close();
            }
        });
        
        // Manejar teclas dentro del modal
        this.modal.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;
            
            // Prevenir que las teclas del modal afecten el juego
            e.stopPropagation();
            
            switch (e.key.toLowerCase()) {
                case 'w':
                case 'a':
                case 's':
                case 'd':
                case ' ':
                    // Prevenir que estas teclas se propaguen al juego
                    e.preventDefault();
                    break;
                case 'escape':
                    e.preventDefault();
                    this.close();
                    break;
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.modal.style.display = 'block';
        this.isOpen = true;
        document.body.style.overflow = 'hidden'; // Prevenir scroll
        
        // Liberar el cursor para interactuar con el modal
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // Enfocar el modal para capturar eventos de teclado
        this.modal.focus();
        
        // Agregar atributo tabindex para que pueda recibir foco
        this.modal.setAttribute('tabindex', '0');
    }

    close() {
        this.modal.style.display = 'none';
        this.isOpen = false;
        document.body.style.overflow = ''; // Restaurar scroll
        
        // Quitar el foco del modal
        this.modal.blur();
        
        // Notificar al juego que el modal se cerró
        if (this.game && this.game.onModalClosed) {
            this.game.onModalClosed();
        }
    }

    destroy() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
        }
    }
} 