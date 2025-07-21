
export class ObstacleCourseGame {
    constructor(game3D) {
        this.game3D = game3D;
        this.isActive = false;
        this.currentPhase = 'waiting'; // waiting, building, racing, voting
        this.timeLimit = 300; // 5 minutos
        this.timeRemaining = this.timeLimit;
        this.players = new Map();
        this.obstacles = new Map();
        this.scores = new Map();
        this.votes = new Map();
        
        // Configuración del juego
        this.config = {
            buildTime: 180, // 3 minutos para construir
            raceTime: 120,  // 2 minutos para completar
            voteTime: 60,   // 1 minuto para votar
            maxObstacles: 20,
            minObstacles: 5
        };
        
        this.setupUI();
    }
    
    // Inicializar el minijuego
    start() {
        console.log('🎮 Iniciando Constructor de Obstáculos!');
        this.isActive = true;
        this.currentPhase = 'building';
        this.timeRemaining = this.config.buildTime;
        this.obstacles.clear();
        this.scores.clear();
        this.votes.clear();
        
        this.showGameMessage('🏗️ ¡Fase de Construcción! Tienes 3 minutos para crear obstáculos');
        this.showGameMessage('💡 Usa comandos como: "mesa roja gigante", "silla azul", "hamburguesa dorada"');
        this.updateUI();
        this.startTimer();
    }
    
    // Detener el minijuego
    stop() {
        console.log('🎮 Finalizando Constructor de Obstáculos');
        this.isActive = false;
        this.currentPhase = 'waiting';
        this.hideUI();
        this.stopTimer();
    }
    
    // Configurar interfaz del juego
    setupUI() {
        // Crear contenedor principal
        this.gameUI = document.createElement('div');
        this.gameUI.id = 'obstacleGameUI';
        this.gameUI.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 10px;
            font-family: 'Arial', sans-serif;
            z-index: 1000;
            min-width: 250px;
            display: none;
        `;
        
        // Título del juego
        this.titleElement = document.createElement('h3');
        this.titleElement.textContent = '🏗️ Constructor de Obstáculos';
        this.titleElement.style.cssText = `
            margin: 0 0 10px 0;
            color: #ffd700;
            font-size: 16px;
        `;
        
        // Información de fase
        this.phaseElement = document.createElement('div');
        this.phaseElement.style.cssText = `
            margin: 5px 0;
            font-weight: bold;
            color: #00ff00;
        `;
        
        // Temporizador
        this.timerElement = document.createElement('div');
        this.timerElement.style.cssText = `
            margin: 5px 0;
            font-size: 18px;
            color: #ff6b6b;
        `;
        
        // Estadísticas
        this.statsElement = document.createElement('div');
        this.statsElement.style.cssText = `
            margin: 5px 0;
            font-size: 12px;
            color: #cccccc;
        `;
        
        // Botones de control
        this.controlsElement = document.createElement('div');
        this.controlsElement.style.cssText = `
            margin: 10px 0 0 0;
            display: flex;
            gap: 10px;
        `;
        
        // Botón de inicio
        this.startButton = document.createElement('button');
        this.startButton.textContent = '🎮 Iniciar Juego';
        this.startButton.style.cssText = `
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.startButton.onclick = () => this.start();
        
        // Botón de parada
        this.stopButton = document.createElement('button');
        this.stopButton.textContent = '⏹️ Parar Juego';
        this.stopButton.style.cssText = `
            background: #f44336;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.stopButton.onclick = () => this.stop();
        
        // Botón de limpiar
        this.clearButton = document.createElement('button');
        this.clearButton.textContent = '🧹 Limpiar';
        this.clearButton.style.cssText = `
            background: #ff9800;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        `;
        this.clearButton.onclick = () => this.clearObstacles();
        
        // Ensamblar UI
        this.controlsElement.appendChild(this.startButton);
        this.controlsElement.appendChild(this.stopButton);
        this.controlsElement.appendChild(this.clearButton);
        
        this.gameUI.appendChild(this.titleElement);
        this.gameUI.appendChild(this.phaseElement);
        this.gameUI.appendChild(this.timerElement);
        this.gameUI.appendChild(this.statsElement);
        this.gameUI.appendChild(this.controlsElement);
        
        document.body.appendChild(this.gameUI);
    }
    
    // Mostrar/ocultar UI
    showUI() {
        if (this.gameUI) {
            this.gameUI.style.display = 'block';
        }
    }
    
    hideUI() {
        if (this.gameUI) {
            this.gameUI.style.display = 'none';
        }
    }
    
    // Actualizar interfaz
    updateUI() {
        if (!this.isActive) return;
        
        // Actualizar fase
        const phaseNames = {
            'waiting': '⏳ Esperando',
            'building': '🏗️ Construyendo',
            'racing': '🏃‍♂️ Compitiendo',
            'voting': '🗳️ Votando'
        };
        
        this.phaseElement.textContent = `Fase: ${phaseNames[this.currentPhase] || this.currentPhase}`;
        
        // Actualizar temporizador
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        this.timerElement.textContent = `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Actualizar estadísticas
        const obstacleCount = this.obstacles.size;
        const playerCount = this.players.size;
        this.statsElement.textContent = `📦 Obstáculos: ${obstacleCount} | 👥 Jugadores: ${playerCount}`;
        
        // Cambiar color del temporizador según el tiempo restante
        if (this.timeRemaining <= 30) {
            this.timerElement.style.color = '#ff0000';
        } else if (this.timeRemaining <= 60) {
            this.timerElement.style.color = '#ffaa00';
        } else {
            this.timerElement.style.color = '#ff6b6b';
        }
    }
    
    // Temporizador del juego
    startTimer() {
        this.timerInterval = setInterval(() => {
            if (this.isActive && this.timeRemaining > 0) {
                this.timeRemaining--;
                this.updateUI();
                
                // Cambiar fase cuando se acaba el tiempo
                if (this.timeRemaining === 0) {
                    this.nextPhase();
                }
                
                // Advertencias de tiempo
                if (this.timeRemaining === 30) {
                    this.showGameMessage('⚠️ ¡30 segundos restantes!');
                } else if (this.timeRemaining === 10) {
                    this.showGameMessage('🚨 ¡10 segundos restantes!');
                }
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    // Cambiar a la siguiente fase
    nextPhase() {
        switch (this.currentPhase) {
            case 'building':
                this.startRacingPhase();
                break;
            case 'racing':
                this.startVotingPhase();
                break;
            case 'voting':
                this.endGame();
                break;
        }
    }
    
    // Iniciar fase de carrera
    startRacingPhase() {
        this.currentPhase = 'racing';
        this.timeRemaining = this.config.raceTime;
        
        const obstacleCount = this.obstacles.size;
        if (obstacleCount < this.config.minObstacles) {
            this.showGameMessage(`⚠️ Muy pocos obstáculos (${obstacleCount}/${this.config.minObstacles}). ¡Agregando obstáculos automáticos!`);
            this.addAutomaticObstacles();
        }
        
        this.showGameMessage('🏃‍♂️ ¡Fase de Carrera! Completa la pista de obstáculos');
        this.showGameMessage('💡 Evita los obstáculos y llega al final lo más rápido posible');
        this.updateUI();
    }
    
    // Iniciar fase de votación
    startVotingPhase() {
        this.currentPhase = 'voting';
        this.timeRemaining = this.config.voteTime;
        
        this.showGameMessage('🗳️ ¡Fase de Votación! Vota por la mejor pista de obstáculos');
        this.showGameMessage('💡 Usa: "votar 1-5" para calificar la pista (1=malo, 5=excelente)');
        this.updateUI();
    }
    
    // Finalizar juego
    endGame() {
        this.showGameMessage('🎉 ¡Juego terminado! Mostrando resultados...');
        this.showResults();
        this.stop();
    }
    
    // Agregar obstáculo automático
    addAutomaticObstacles() {
        const automaticObstacles = [
            { name: 'desk', position: { x: 5, y: 1, z: 3 } },
            { name: 'chair', position: { x: -3, y: 1, z: 2 } },
            { name: 'table', position: { x: 0, y: 1, z: 5 } },
            { name: 'couch', position: { x: 4, y: 1, z: -2 } },
            { name: 'cabinet', position: { x: -4, y: 1, z: -3 } }
        ];
        
        for (const obstacle of automaticObstacles) {
            if (this.obstacles.size >= this.config.maxObstacles) break;
            
            try {
                this.game3D.generateObject(obstacle.name);
                const obstacleId = `auto_${Date.now()}_${Math.random()}`;
                this.obstacles.set(obstacleId, {
                    name: obstacle.name,
                    creator: 'Sistema',
                    phase: 'auto'
                });
            } catch (error) {
                console.error('Error agregando obstáculo automático:', error);
            }
        }
    }
    
    // Registrar obstáculo creado
    registerObstacle(objectId, objectName, creatorId) {
        if (!this.isActive || this.currentPhase !== 'building') return;
        
        if (this.obstacles.size >= this.config.maxObstacles) {
            this.showGameMessage('🚫 ¡Límite de obstáculos alcanzado!');
            return;
        }
        
        this.obstacles.set(objectId, {
            name: objectName,
            creator: creatorId,
            phase: 'building',
            timestamp: Date.now()
        });
        
        this.showGameMessage(`✅ Obstáculo agregado: ${objectName} (${this.obstacles.size}/${this.config.maxObstacles})`);
        this.updateUI();
    }
    
    // Registrar jugador
    registerPlayer(playerId, playerName) {
        this.players.set(playerId, {
            name: playerName,
            score: 0,
            completed: false,
            time: 0
        });
    }
    
    // Registrar voto
    registerVote(playerId, rating) {
        if (!this.isActive || this.currentPhase !== 'voting') return;
        
        if (rating < 1 || rating > 5) {
            this.showGameMessage('❌ Voto inválido. Usa un número del 1 al 5');
            return;
        }
        
        this.votes.set(playerId, rating);
        this.showGameMessage(`🗳️ Voto registrado: ${rating}/5 estrellas`);
        this.updateUI();
    }
    
    // Limpiar obstáculos
    clearObstacles() {
        this.game3D.clearAllObjects();
        this.obstacles.clear();
        this.showGameMessage('🧹 Obstáculos limpiados');
        this.updateUI();
    }
    
    // Mostrar mensaje del juego
    showGameMessage(message) {
        if (this.game3D && this.game3D.showChatMessage) {
            this.game3D.showChatMessage(`🎮 ${message}`);
        } else {
            console.log(`🎮 ${message}`);
        }
    }
    
    // Mostrar resultados finales
    showResults() {
        const totalVotes = this.votes.size;
        const averageRating = totalVotes > 0 
            ? Array.from(this.votes.values()).reduce((a, b) => a + b, 0) / totalVotes 
            : 0;
        
        const obstacleCount = this.obstacles.size;
        
        this.showGameMessage('📊 === RESULTADOS FINALES ===');
        this.showGameMessage(`📦 Total de obstáculos: ${obstacleCount}`);
        this.showGameMessage(`🗳️ Votos recibidos: ${totalVotes}`);
        this.showGameMessage(`⭐ Calificación promedio: ${averageRating.toFixed(1)}/5`);
        
        if (averageRating >= 4) {
            this.showGameMessage('🏆 ¡Excelente pista de obstáculos!');
        } else if (averageRating >= 3) {
            this.showGameMessage('👍 Buena pista de obstáculos');
        } else {
            this.showGameMessage('📝 Hay espacio para mejorar');
        }
    }
    
    // Procesar comando del juego
    processCommand(command, playerId) {
        if (!this.isActive) return false;
        
        const lowerCommand = command.toLowerCase();
        
        // Comando de voto
        if (lowerCommand.startsWith('votar ')) {
            const rating = parseInt(lowerCommand.split(' ')[1]);
            this.registerVote(playerId, rating);
            return true;
        }
        
        // Comando de puntuación
        if (lowerCommand.startsWith('puntaje ')) {
            const score = parseInt(lowerCommand.split(' ')[1]);
            if (this.players.has(playerId)) {
                this.players.get(playerId).score = score;
                this.showGameMessage(`📊 Puntaje actualizado: ${score}`);
            }
            return true;
        }
        
        // Comando de completar
        if (lowerCommand === 'completar' || lowerCommand === 'terminar') {
            if (this.currentPhase === 'racing' && this.players.has(playerId)) {
                const player = this.players.get(playerId);
                if (!player.completed) {
                    player.completed = true;
                    player.time = this.config.raceTime - this.timeRemaining;
                    this.showGameMessage(`🏁 ¡${player.name} completó la pista en ${player.time}s!`);
                }
            }
            return true;
        }
        
        return false; // No es un comando del juego
    }
    
    // Obtener estado del juego
    getGameState() {
        return {
            isActive: this.isActive,
            currentPhase: this.currentPhase,
            timeRemaining: this.timeRemaining,
            obstacleCount: this.obstacles.size,
            playerCount: this.players.size,
            voteCount: this.votes.size
        };
    }
}

// Hacer la clase globalmente accesible
window.ObstacleCourseGame = ObstacleCourseGame; 