// Configuración de mapeo de assets 3D
export const ASSET_MAPPING = {
    // Muebles de oficina
    'escritorio': {
        assets: ['Desk.glb', 'Desk-V86Go2rlnq.glb', 'Desk-ISpMh81QGq.glb', 'Desk-EtJlOllzbf.glb', 'Desk-7ban171PzCS.glb', 'Standing Desk.glb'],
        priority: 10,
        category: 'furniture'
    },
    'mesa': {
        assets: ['Table.glb', 'Table Large Circular.glb', 'Table tennis table.glb'],
        priority: 9,
        category: 'furniture'
    },
    'silla': {
        assets: ['Office Chair.glb', 'Chair.glb', 'Chair-1MFMOaz3zqe.glb'],
        priority: 9,
        category: 'furniture'
    },
    'sofá': {
        assets: ['Couch | Wide.glb', 'Couch Medium.glb', 'Couch Small.glb', 'Couch Small-ZOPP3KzNIk.glb'],
        priority: 8,
        category: 'furniture'
    },
    'estante': {
        assets: ['Shelf.glb', 'Shelf Small.glb', 'Wall Shelf.glb', 'Medium Book Shelf.glb'],
        priority: 7,
        category: 'furniture'
    },
    'gabinete': {
        assets: ['File Cabinet.glb', 'Cabinet.glb'],
        priority: 7,
        category: 'furniture'
    },

    // Tecnología
    'computadora': {
        assets: ['Computer.glb'],
        priority: 10,
        category: 'technology'
    },
    'monitor': {
        assets: ['Computer Screen.glb', 'Monitor.glb', 'Dual Monitors on sit-stand arm.glb'],
        priority: 9,
        category: 'technology'
    },
    'teclado': {
        assets: ['Keyboard.glb', 'Keyboard-fOy2zvPJAj-.glb'],
        priority: 8,
        category: 'technology'
    },
    'mouse': {
        assets: ['Computer mouse.glb', 'Mouse.glb'],
        priority: 8,
        category: 'technology'
    },
    'teléfono': {
        assets: ['Phone.glb', 'Phone-1L9oJAw6nY2.glb', 'Office Phone.glb'],
        priority: 7,
        category: 'technology'
    },
    'impresora': {
        assets: ['Printer.glb'],
        priority: 6,
        category: 'technology'
    },
    'lámpara': {
        assets: ['Lamp.glb', 'Light Desk.glb', 'Light Floor.glb', 'Light Cube.glb', 'Light Icosahedron.glb'],
        priority: 7,
        category: 'lighting'
    },

    // Decoración
    'planta': {
        assets: ['Houseplant.glb', 'Houseplant-bfLOqIV5uP.glb', 'Houseplant-e9oRt-Ct6js.glb', 'Houseplant-VtJh4Irl4w.glb', 'Potted Plant.glb', 'Plant - White Pot.glb'],
        priority: 8,
        category: 'decoration'
    },
    'arte': {
        assets: ['Wall Art 02.glb', 'Wall Art 03.glb', 'Wall Art 05.glb', 'Wall Art 06.glb', 'Wall Art 06-1U5roiXQZAM.glb'],
        priority: 6,
        category: 'decoration'
    },
    'trofeo': {
        assets: ['Trophy.glb'],
        priority: 5,
        category: 'decoration'
    },
    'pizarra': {
        assets: ['Whiteboard.glb'],
        priority: 6,
        category: 'decoration'
    },
    'alfombra': {
        assets: ['Rug.glb', 'Rug Round.glb'],
        priority: 5,
        category: 'decoration'
    },

    // Bebidas y alimentos
    'taza': {
        assets: ['Coffee cup.glb', 'Cup.glb', 'Mug.glb', 'Mug With Office Tool.glb'],
        priority: 6,
        category: 'food'
    },
    'café': {
        assets: ['Coffee cup.glb'],
        priority: 7,
        category: 'food'
    },
    'soda': {
        assets: ['Soda.glb', 'Soda Can.glb', 'Crushed Soda Can.glb'],
        priority: 5,
        category: 'food'
    },

    // Papelería
    'papel': {
        assets: ['Various Stacks of Paper.glb', 'Small Stack of Paper.glb'],
        priority: 6,
        category: 'stationery'
    },
    'cuaderno': {
        assets: ['Notebook.glb'],
        priority: 5,
        category: 'stationery'
    },
    'clipboard': {
        assets: ['clipboard.glb'],
        priority: 5,
        category: 'stationery'
    },
    'lápiz': {
        assets: ['Pens.glb'],
        priority: 4,
        category: 'stationery'
    },
    'grapadora': {
        assets: ['Stapler.glb'],
        priority: 4,
        category: 'stationery'
    },

    // Contenedores
    'caja': {
        assets: ['Cardboard Box.glb', 'Cardboard Boxes.glb', 'Cardboard Boxes-pMdXdrUHvX.glb', 'Bins.glb'],
        priority: 6,
        category: 'containers'
    },
    'basura': {
        assets: ['Trashcan.glb', 'Trashcan Small.glb', 'Trash Bin.glb'],
        priority: 5,
        category: 'containers'
    },
    'maleta': {
        assets: ['Briefcase.glb', 'Laptop bag.glb'],
        priority: 6,
        category: 'containers'
    },

    // Entretenimiento
    'dardo': {
        assets: ['Darts.glb', 'Dartboard.glb'],
        priority: 5,
        category: 'entertainment'
    },
    'juguete': {
        assets: ['Desk Toy.glb', 'Rubik\'s cube.glb'],
        priority: 4,
        category: 'entertainment'
    },
    'patineta': {
        assets: ['Skateboard.glb'],
        priority: 3,
        category: 'entertainment'
    },
    'gundam': {
        assets: ['MS Gundam RX-78-2 with weapons.glb'],
        priority: 2,
        category: 'entertainment'
    },

    // Sinónimos en inglés
    'desk': { assets: ['Desk.glb', 'Desk-V86Go2rlnq.glb', 'Desk-ISpMh81QGq.glb', 'Desk-EtJlOllzbf.glb', 'Desk-7ban171PzCS.glb', 'Standing Desk.glb'], priority: 10, category: 'furniture' },
    'table': { assets: ['Table.glb', 'Table Large Circular.glb', 'Table tennis table.glb'], priority: 9, category: 'furniture' },
    'chair': { assets: ['Office Chair.glb', 'Chair.glb', 'Chair-1MFMOaz3zqe.glb'], priority: 9, category: 'furniture' },
    'couch': { assets: ['Couch | Wide.glb', 'Couch Medium.glb', 'Couch Small.glb', 'Couch Small-ZOPP3KzNIk.glb'], priority: 8, category: 'furniture' },
    'shelf': { assets: ['Shelf.glb', 'Shelf Small.glb', 'Wall Shelf.glb', 'Medium Book Shelf.glb'], priority: 7, category: 'furniture' },
    'cabinet': { assets: ['File Cabinet.glb', 'Cabinet.glb'], priority: 7, category: 'furniture' },
    'computer': { assets: ['Computer.glb'], priority: 10, category: 'technology' },
    'monitor': { assets: ['Computer Screen.glb', 'Monitor.glb', 'Dual Monitors on sit-stand arm.glb'], priority: 9, category: 'technology' },
    'keyboard': { assets: ['Keyboard.glb', 'Keyboard-fOy2zvPJAj-.glb'], priority: 8, category: 'technology' },
    'mouse': { assets: ['Computer mouse.glb', 'Mouse.glb'], priority: 8, category: 'technology' },
    'phone': { assets: ['Phone.glb', 'Phone-1L9oJAw6nY2.glb', 'Office Phone.glb'], priority: 7, category: 'technology' },
    'printer': { assets: ['Printer.glb'], priority: 6, category: 'technology' },
    'lamp': { assets: ['Lamp.glb', 'Light Desk.glb', 'Light Floor.glb', 'Light Cube.glb', 'Light Icosahedron.glb'], priority: 7, category: 'lighting' },
    'plant': { assets: ['Houseplant.glb', 'Houseplant-bfLOqIV5uP.glb', 'Houseplant-e9oRt-Ct6js.glb', 'Houseplant-VtJh4Irl4w.glb', 'Potted Plant.glb', 'Plant - White Pot.glb'], priority: 8, category: 'decoration' },
    'art': { assets: ['Wall Art 02.glb', 'Wall Art 03.glb', 'Wall Art 05.glb', 'Wall Art 06.glb', 'Wall Art 06-1U5roiXQZAM.glb'], priority: 6, category: 'decoration' },
    'trophy': { assets: ['Trophy.glb'], priority: 5, category: 'decoration' },
    'whiteboard': { assets: ['Whiteboard.glb'], priority: 6, category: 'decoration' },
    'rug': { assets: ['Rug.glb', 'Rug Round.glb'], priority: 5, category: 'decoration' },
    'cup': { assets: ['Coffee cup.glb', 'Cup.glb', 'Mug.glb', 'Mug With Office Tool.glb'], priority: 6, category: 'food' },
    'coffee': { assets: ['Coffee cup.glb'], priority: 7, category: 'food' },
    'soda': { assets: ['Soda.glb', 'Soda Can.glb', 'Crushed Soda Can.glb'], priority: 5, category: 'food' },
    
    // Nuevos alimentos del Ultimate Food Pack
    'waffle': { assets: ['Waffle.glb'], priority: 6, category: 'food' },
    'nabo': { assets: ['Turnip.glb'], priority: 4, category: 'food' },
    'tomate': { assets: ['Tomato.glb', 'Tomato Slice.glb'], priority: 5, category: 'food' },
    'tentáculo': { assets: ['Tentacle.glb'], priority: 3, category: 'food' },
    'sushi': { assets: ['Sushi.glb', 'Sushi Nigiri.glb'], priority: 7, category: 'food' },
    'filete': { assets: ['Steak.glb'], priority: 8, category: 'food' },
    'cuchara': { assets: ['Spoon.glb'], priority: 4, category: 'food' },
    'calabaza': { assets: ['Pumpkin.glb'], priority: 4, category: 'food' },
    'paleta': { assets: ['Popsicle.glb', 'Popsicle Chocolate.glb'], priority: 5, category: 'food' },
    'plato': { assets: ['Plate Square.glb'], priority: 4, category: 'food' },
    'pizza': { assets: ['Pizza.glb', 'Pizza Slice.glb'], priority: 8, category: 'food' },
    'pimiento': { assets: ['Pepper Green.glb'], priority: 4, category: 'food' },
    'panqueques': { assets: ['Pancakes Stack.glb'], priority: 6, category: 'food' },
    'champiñón': { assets: ['Mushroom Sliced.glb'], priority: 4, category: 'food' },
    'lechuga': { assets: ['Lettuce.glb'], priority: 4, category: 'food' },
    'ketchup': { assets: ['Ketchup Bottle.glb'], priority: 4, category: 'food' },
    'helado': { assets: ['Ice Cream.glb'], priority: 6, category: 'food' },
    'hotdog': { assets: ['Hotdog.glb'], priority: 7, category: 'food' },
    'sartén': { assets: ['Frying Pan.glb'], priority: 5, category: 'food' },
    'papas': { assets: ['Fries.glb'], priority: 6, category: 'food' },
    'berenjena': { assets: ['Eggplant.glb'], priority: 4, category: 'food' },
    'huevo': { assets: ['Egg.glb', 'Egg Fried.glb'], priority: 5, category: 'food' },
    'hamburguesa': { assets: ['Double Cheeseburger.glb', 'Cheeseburger.glb', 'Burger.glb'], priority: 8, category: 'food' },
    'dona': { assets: ['Donut.glb'], priority: 6, category: 'food' },
    'cupcake': { assets: ['Cupcake.glb'], priority: 6, category: 'food' },
    'croissant': { assets: ['Croissant.glb'], priority: 5, category: 'food' },
    'corn dog': { assets: ['Corndog.glb'], priority: 5, category: 'food' },
    'olla': { assets: ['Cooking Pot.glb', 'Cooking Pot-lMEdEOMg9L.glb'], priority: 5, category: 'food' },
    'palillos': { assets: ['Chopsticks.glb'], priority: 4, category: 'food' },
    'chocolate': { assets: ['Chocolate Bar.glb'], priority: 6, category: 'food' },
    'pollo': { assets: ['Chicken Leg.glb'], priority: 7, category: 'food' },
    'zanahoria': { assets: ['Carrot.glb'], priority: 4, category: 'food' },
    'brócoli': { assets: ['Broccoli.glb'], priority: 4, category: 'food' },
    'pan': { assets: ['Bread.glb', 'Bread Slice.glb'], priority: 5, category: 'food' },
    'botella': { assets: ['Bottle.glb', 'Bottle-Pc8dM9Ja4V.glb'], priority: 4, category: 'food' },
    'plátano': { assets: ['Banana.glb'], priority: 4, category: 'food' },
    'tocino': { assets: ['Bacon.glb'], priority: 6, category: 'food' },
    'aguacate': { assets: ['Avocado.glb'], priority: 4, category: 'food' },
    'manzana': { assets: ['Apple Green.glb'], priority: 4, category: 'food' },
    'paper': { assets: ['Various Stacks of Paper.glb', 'Small Stack of Paper.glb'], priority: 6, category: 'stationery' },
    'notebook': { assets: ['Notebook.glb'], priority: 5, category: 'stationery' },
    'pen': { assets: ['Pens.glb'], priority: 4, category: 'stationery' },
    'stapler': { assets: ['Stapler.glb'], priority: 4, category: 'stationery' },
    'box': { assets: ['Cardboard Box.glb', 'Cardboard Boxes.glb', 'Cardboard Boxes-pMdXdrUHvX.glb', 'Bins.glb'], priority: 6, category: 'containers' },
    'trash': { assets: ['Trashcan.glb', 'Trashcan Small.glb', 'Trash Bin.glb'], priority: 5, category: 'containers' },
    'bin': { assets: ['Trashcan.glb', 'Trashcan Small.glb', 'Trash Bin.glb'], priority: 5, category: 'containers' },
    'briefcase': { assets: ['Briefcase.glb', 'Laptop bag.glb'], priority: 6, category: 'containers' },
    'dart': { assets: ['Darts.glb', 'Dartboard.glb'], priority: 5, category: 'entertainment' },
    'toy': { assets: ['Desk Toy.glb', 'Rubik\'s cube.glb'], priority: 4, category: 'entertainment' },
    'skateboard': { assets: ['Skateboard.glb'], priority: 3, category: 'entertainment' },
    
    // Sinónimos en inglés para nuevos alimentos
    'waffle': { assets: ['Waffle.glb'], priority: 6, category: 'food' },
    'turnip': { assets: ['Turnip.glb'], priority: 4, category: 'food' },
    'tomato': { assets: ['Tomato.glb', 'Tomato Slice.glb'], priority: 5, category: 'food' },
    'tentacle': { assets: ['Tentacle.glb'], priority: 3, category: 'food' },
    'sushi': { assets: ['Sushi.glb', 'Sushi Nigiri.glb'], priority: 7, category: 'food' },
    'steak': { assets: ['Steak.glb'], priority: 8, category: 'food' },
    'spoon': { assets: ['Spoon.glb'], priority: 4, category: 'food' },
    'pumpkin': { assets: ['Pumpkin.glb'], priority: 4, category: 'food' },
    'popsicle': { assets: ['Popsicle.glb', 'Popsicle Chocolate.glb'], priority: 5, category: 'food' },
    'plate': { assets: ['Plate Square.glb'], priority: 4, category: 'food' },
    'pizza': { assets: ['Pizza.glb', 'Pizza Slice.glb'], priority: 8, category: 'food' },
    'pepper': { assets: ['Pepper Green.glb'], priority: 4, category: 'food' },
    'pancakes': { assets: ['Pancakes Stack.glb'], priority: 6, category: 'food' },
    'mushroom': { assets: ['Mushroom Sliced.glb'], priority: 4, category: 'food' },
    'lettuce': { assets: ['Lettuce.glb'], priority: 4, category: 'food' },
    'ketchup': { assets: ['Ketchup Bottle.glb'], priority: 4, category: 'food' },
    'ice cream': { assets: ['Ice Cream.glb'], priority: 6, category: 'food' },
    'hotdog': { assets: ['Hotdog.glb'], priority: 7, category: 'food' },
    'frying pan': { assets: ['Frying Pan.glb'], priority: 5, category: 'food' },
    'fries': { assets: ['Fries.glb'], priority: 6, category: 'food' },
    'eggplant': { assets: ['Eggplant.glb'], priority: 4, category: 'food' },
    'egg': { assets: ['Egg.glb', 'Egg Fried.glb'], priority: 5, category: 'food' },
    'burger': { assets: ['Double Cheeseburger.glb', 'Cheeseburger.glb', 'Burger.glb'], priority: 8, category: 'food' },
    'hamburger': { assets: ['Double Cheeseburger.glb', 'Cheeseburger.glb', 'Burger.glb'], priority: 8, category: 'food' },
    'donut': { assets: ['Donut.glb'], priority: 6, category: 'food' },
    'cupcake': { assets: ['Cupcake.glb'], priority: 6, category: 'food' },
    'croissant': { assets: ['Croissant.glb'], priority: 5, category: 'food' },
    'corndog': { assets: ['Corndog.glb'], priority: 5, category: 'food' },
    'pot': { assets: ['Cooking Pot.glb', 'Cooking Pot-lMEdEOMg9L.glb'], priority: 5, category: 'food' },
    'chopsticks': { assets: ['Chopsticks.glb'], priority: 4, category: 'food' },
    'chocolate': { assets: ['Chocolate Bar.glb'], priority: 6, category: 'food' },
    'chicken': { assets: ['Chicken Leg.glb'], priority: 7, category: 'food' },
    'carrot': { assets: ['Carrot.glb'], priority: 4, category: 'food' },
    'broccoli': { assets: ['Broccoli.glb'], priority: 4, category: 'food' },
    'bread': { assets: ['Bread.glb', 'Bread Slice.glb'], priority: 5, category: 'food' },
    'bottle': { assets: ['Bottle.glb', 'Bottle-Pc8dM9Ja4V.glb'], priority: 4, category: 'food' },
    'banana': { assets: ['Banana.glb'], priority: 4, category: 'food' },
    'bacon': { assets: ['Bacon.glb'], priority: 6, category: 'food' },
    'avocado': { assets: ['Avocado.glb'], priority: 4, category: 'food' },
    'apple': { assets: ['Apple Green.glb'], priority: 4, category: 'food' }
};

// Assets comunes para precarga
export const COMMON_ASSETS = [
    'Desk.glb',
    'Office Chair.glb', 
    'Computer.glb',
    'Monitor.glb',
    'Keyboard.glb',
    'Mouse.glb',
    'Phone.glb',
    'Lamp.glb',
    'Houseplant.glb',
    'Table.glb',
    'Shelf.glb',
    'Coffee cup.glb',
    'Notebook.glb',
    'Pens.glb'
];

// Configuración de categorías
export const ASSET_CATEGORIES = {
    furniture: {
        name: 'Muebles',
        color: '#4CAF50',
        priority: 1
    },
    technology: {
        name: 'Tecnología',
        color: '#2196F3',
        priority: 2
    },
    decoration: {
        name: 'Decoración',
        color: '#FF9800',
        priority: 3
    },
    food: {
        name: 'Alimentos',
        color: '#F44336',
        priority: 4
    },
    stationery: {
        name: 'Papelería',
        color: '#9C27B0',
        priority: 5
    },
    containers: {
        name: 'Contenedores',
        color: '#607D8B',
        priority: 6
    },
    entertainment: {
        name: 'Entretenimiento',
        color: '#E91E63',
        priority: 7
    },
    lighting: {
        name: 'Iluminación',
        color: '#FFC107',
        priority: 8
    }
}; 