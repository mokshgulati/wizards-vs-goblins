export class UI {
    constructor(game) {
        this.game = game;
        
        // Get UI elements
        this.healthBar = document.getElementById('health-bar');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('game-over');
        this.finalScoreElement = document.getElementById('final-score');
        
        // Set initial values
        this.updateHealth(100);
        this.updateScore(0);
        
        // Add event listeners
        this.setupEventListeners();
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
} 