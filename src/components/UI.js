export class UI {
    constructor(game) {
        this.game = game;
        
        // Get UI elements
        this.healthBar = document.getElementById('health-bar');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        
        // Loading screen elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.loadingBar = document.getElementById('loading-bar');
        this.loadingText = document.getElementById('loading-text');
        
        // Start game dialog elements
        this.startGameDialog = document.getElementById('start-game-dialog');
        this.startButton = document.getElementById('start-button');
        
        // Mini-map elements
        this.miniMap = document.getElementById('mini-map');
        this.miniMapContainer = document.getElementById('mini-map-container');
        this.radarGrid = document.getElementById('radar-grid');
        this.miniMapElements = {
            player: null,
            direction: null,
            goblins: []
        };
        
        // Mini-map settings
        this.miniMapSettings = {
            scale: 0.05, // Reduced scale factor for better visibility
            range: 200,  // Increased range to show more of the map
            updateInterval: 100, // Update interval in ms
            gridCircles: 3, // Number of radar grid circles
            gridLines: 8   // Number of radar grid lines
        };
        
        // Set initial values
        this.updateHealth(100);
        this.updateScore(0);
        
        // Show loading screen initially
        this.showLoadingScreen();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Initialize mini-map
        this.initMiniMap();
    }
    
    setupEventListeners() {
        // Listen for health changes
        document.addEventListener('healthChanged', (event) => {
            this.updateHealth(event.detail.health);
        });
        
        // Listen for score changes
        document.addEventListener('scoreChanged', (event) => {
            this.updateScore(event.detail.score);
        });
        
        // Listen for loading progress
        document.addEventListener('loadingProgress', (event) => {
            this.updateLoadingProgress(event.detail.progress);
        });
        
        // Listen for loading complete
        document.addEventListener('loadingComplete', () => {
            this.hideLoadingScreen();
            this.showStartGameDialog();
        });
        
        // Listen for game over
        document.addEventListener('gameOver', (event) => {
            this.finalScoreElement.textContent = event.detail.score;
            this.showGameOver();
        });
        
        // Start button click event
        this.startButton.addEventListener('click', () => {
            this.hideStartGameDialog();
            this.game.startGame();
            
            // Start mini-map updates
            this.startMiniMapUpdates();
        });
        
        // Restart button click event
        document.getElementById('restart-button').addEventListener('click', () => {
            this.game.restart();
            this.gameOverElement.style.display = 'none';
            
            // Reset mini-map
            this.resetMiniMap();
        });
    }
    
    updateHealth(health) {
        // Update health bar width
        const percentage = Math.max(0, health);
        this.healthBar.style.width = `${percentage}%`;
        
        // Change color based on health
        if (percentage > 50) {
            this.healthBar.style.backgroundColor = '#f00'; // Red
        } else if (percentage > 25) {
            this.healthBar.style.backgroundColor = '#ff7700'; // Orange
        } else {
            this.healthBar.style.backgroundColor = '#ff0000'; // Bright red
        }
    }
    
    updateScore(score) {
        // Update score text
        this.scoreElement.textContent = `Score: ${score}`;
        this.finalScoreElement.textContent = score;
    }
    
    showLoadingScreen() {
        this.loadingScreen.style.display = 'flex';
        this.updateLoadingProgress(0);
    }
    
    hideLoadingScreen() {
        // Fade out loading screen
        this.loadingScreen.style.opacity = '0';
        this.loadingScreen.style.transition = 'opacity 0.5s';
        
        // Remove from DOM after transition
        setTimeout(() => {
            this.loadingScreen.style.display = 'none';
        }, 500);
    }
    
    updateLoadingProgress(progress) {
        // Update loading bar width
        this.loadingBar.style.width = `${progress}%`;
        
        // Update loading text
        if (progress < 30) {
            this.loadingText.textContent = 'Loading assets...';
        } else if (progress < 60) {
            this.loadingText.textContent = 'Preparing magical forest...';
        } else if (progress < 90) {
            this.loadingText.textContent = 'Summoning stars and birds...';
        } else {
            this.loadingText.textContent = 'Almost ready...';
        }
    }
    
    showStartGameDialog() {
        this.startGameDialog.style.display = 'block';
        
        // Add a slight animation
        this.startGameDialog.style.opacity = '0';
        this.startGameDialog.style.transform = 'translate(-50%, -50%) scale(0.9)';
        this.startGameDialog.style.transition = 'opacity 0.5s, transform 0.5s';
        
        setTimeout(() => {
            this.startGameDialog.style.opacity = '1';
            this.startGameDialog.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);
    }
    
    hideStartGameDialog() {
        // Fade out dialog
        this.startGameDialog.style.opacity = '0';
        this.startGameDialog.style.transform = 'translate(-50%, -50%) scale(1.1)';
        
        // Remove from DOM after transition
        setTimeout(() => {
            this.startGameDialog.style.display = 'none';
        }, 500);
    }
    
    showGameOver() {
        this.gameOverElement.style.display = 'block';
    }
    
    // Mini-map methods
    initMiniMap() {
        // Create radar grid circles
        this.createRadarGrid();
        
        // Create player marker
        const playerMarker = document.createElement('div');
        playerMarker.className = 'mini-map-player';
        this.miniMap.appendChild(playerMarker);
        this.miniMapElements.player = playerMarker;
        
        // Create direction indicator
        const directionIndicator = document.createElement('div');
        directionIndicator.className = 'mini-map-direction';
        this.miniMap.appendChild(directionIndicator);
        this.miniMapElements.direction = directionIndicator;
    }
    
    createRadarGrid() {
        // Create concentric circles
        const { gridCircles, gridLines } = this.miniMapSettings;
        
        // Add circles
        for (let i = 1; i <= gridCircles; i++) {
            const circle = document.createElement('div');
            circle.className = 'radar-circle';
            const size = (i / gridCircles) * 100;
            circle.style.width = `${size}%`;
            circle.style.height = `${size}%`;
            this.radarGrid.appendChild(circle);
        }
        
        // Add radial lines
        for (let i = 0; i < gridLines; i++) {
            const line = document.createElement('div');
            line.className = 'radar-line';
            const angle = (i / gridLines) * 360;
            line.style.transform = `rotate(${angle}deg)`;
            this.radarGrid.appendChild(line);
        }
    }
    
    startMiniMapUpdates() {
        // Start periodic updates
        this.miniMapUpdateInterval = setInterval(() => {
            this.updateMiniMap();
        }, this.miniMapSettings.updateInterval);
    }
    
    stopMiniMapUpdates() {
        // Stop periodic updates
        if (this.miniMapUpdateInterval) {
            clearInterval(this.miniMapUpdateInterval);
        }
    }
    
    resetMiniMap() {
        // Clear all goblin markers
        this.miniMapElements.goblins.forEach(goblin => {
            if (goblin.element && goblin.element.parentNode) {
                goblin.element.parentNode.removeChild(goblin.element);
            }
        });
        this.miniMapElements.goblins = [];
        
        // Start updates again
        this.stopMiniMapUpdates();
        this.startMiniMapUpdates();
    }
    
    updateMiniMap() {
        if (!this.game.player || this.game.state.gameOver) return;
        
        const mapSize = this.miniMapContainer.offsetWidth;
        const halfMapSize = mapSize / 2;
        const player = this.game.player;
        const playerPos = player.mesh.position;
        
        // Update player position (always in center)
        this.miniMapElements.player.style.left = `${halfMapSize}px`;
        this.miniMapElements.player.style.top = `${halfMapSize}px`;
        
        // Update player direction
        const rotation = player.mesh.rotation.y;
        this.miniMapElements.direction.style.left = `${halfMapSize}px`;
        this.miniMapElements.direction.style.top = `${halfMapSize}px`;
        this.miniMapElements.direction.style.transform = `translate(-50%, -100%) rotate(${-rotation}rad)`;
        
        // Update goblin markers
        this.updateGoblinMarkers(playerPos, halfMapSize);
    }
    
    updateGoblinMarkers(playerPos, halfMapSize) {
        const { scale, range } = this.miniMapSettings;
        
        // Remove markers for goblins that no longer exist
        this.miniMapElements.goblins = this.miniMapElements.goblins.filter(goblin => {
            if (!this.game.goblins.includes(goblin.reference)) {
                if (goblin.element && goblin.element.parentNode) {
                    goblin.element.parentNode.removeChild(goblin.element);
                }
                return false;
            }
            return true;
        });
        
        // Update existing goblin markers and add new ones
        this.game.goblins.forEach(goblin => {
            const goblinPos = goblin.mesh.position;
            
            // Calculate distance to player
            const dx = goblinPos.x - playerPos.x;
            const dz = goblinPos.z - playerPos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Only show goblins within range
            if (distance <= range) {
                // Check if we already have a marker for this goblin
                let marker = this.miniMapElements.goblins.find(m => m.reference === goblin);
                
                if (!marker) {
                    // Create new marker
                    const element = document.createElement('div');
                    element.className = 'mini-map-goblin';
                    this.miniMap.appendChild(element);
                    
                    marker = { reference: goblin, element };
                    this.miniMapElements.goblins.push(marker);
                }
                
                // Calculate position on radar (scale based on distance from center)
                // Use a non-linear scaling to better represent distances
                const scaleFactor = scale * (1 - 0.5 * (distance / range));
                const mapX = halfMapSize + dx * scaleFactor * halfMapSize;
                const mapZ = halfMapSize + dz * scaleFactor * halfMapSize;
                
                // Ensure the marker stays within the circular radar bounds
                const distanceFromCenter = Math.sqrt(
                    Math.pow(mapX - halfMapSize, 2) + 
                    Math.pow(mapZ - halfMapSize, 2)
                );
                
                if (distanceFromCenter > halfMapSize) {
                    // If outside the radar circle, clamp to the edge
                    const angle = Math.atan2(mapZ - halfMapSize, mapX - halfMapSize);
                    const clampedX = halfMapSize + Math.cos(angle) * (halfMapSize - 2);
                    const clampedZ = halfMapSize + Math.sin(angle) * (halfMapSize - 2);
                    
                    marker.element.style.left = `${clampedX}px`;
                    marker.element.style.top = `${clampedZ}px`;
                } else {
                    marker.element.style.left = `${mapX}px`;
                    marker.element.style.top = `${mapZ}px`;
                }
                
                // Make closer goblins more visible
                const opacity = 1 - (distance / range) * 0.5;
                marker.element.style.opacity = opacity.toString();
                
                marker.element.style.display = 'block';
            } else {
                // Hide markers for goblins out of range
                const marker = this.miniMapElements.goblins.find(m => m.reference === goblin);
                if (marker) {
                    marker.element.style.display = 'none';
                }
            }
        });
    }
} 