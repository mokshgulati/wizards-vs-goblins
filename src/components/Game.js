import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Player } from './Player.js';
import { Goblin } from './Goblin.js';
import { Fireball } from './Fireball.js';

export class Game {
    constructor() {
        // Game state
        this.state = {
            playerHealth: 100,
            score: 0,
            gameOver: false,
            paused: false,
            maxGoblins: 5, // Limit number of goblins for performance
            maxFireballs: 10, // Limit number of fireballs for performance
            collisionRadius: {
                player: 1.0,    // Player collision radius
                goblin: 0.8,    // Goblin collision radius
                fireball: 0.3   // Fireball collision radius
            }
        };

        // Game objects
        this.player = null;
        this.goblins = [];
        this.fireballs = [];
        this.objectsToUpdate = [];

        // Input handling
        this.keys = {};
        
        // Setup scene
        this.setupScene();
        
        // Setup input listeners
        this.setupInputListeners();
        
        // Load assets
        this.loadAssets();
        
        // Performance monitoring
        this.fpsCounter = 0;
        this.lastFpsUpdate = 0;
        this.createPerformanceMonitor();
        
        // Debug mode for collision visualization
        this.debugMode = false;
        this.debugObjects = [];
    }

    setupScene() {
        // Create scene with magical forest atmosphere
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011); // Very dark blue night sky
        
        // Use atmospheric fog for magical effect
        this.scene.fog = new THREE.FogExp2(0x000011, 0.015);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 5, 10);
        
        // Create renderer with optimized settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: false, // Disable antialiasing for performance
            powerPreference: 'high-performance'
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio
        
        // Enable shadows but with lower quality
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.BasicShadowMap; // Use basic shadow map for performance
        document.body.appendChild(this.renderer.domElement);

        // Create starry sky
        this.createStarrySky();

        // Add lights
        this.setupLights();

        // Create magical forest environment
        this.createForestEnvironment();

        // Clock for time-based animations
        this.clock = new THREE.Clock();
        
        // Add debug key for collision visualization
        document.addEventListener('keydown', (e) => {
            if (e.code === 'KeyD' && e.ctrlKey) {
                this.toggleDebugMode();
            }
        });
    }
    
    createStarrySky() {
        // Create stars
        const starCount = 1000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < starCount; i++) {
            // Random position on a sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 80 + Math.random() * 20; // Large radius to place stars far away
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starPositions.push(x, y, z);
            
            // Random star color (mostly white/blue with occasional yellow/red)
            const colorChoice = Math.random();
            if (colorChoice > 0.9) {
                // Yellow/red star
                starColors.push(1.0, 0.8, 0.5);
            } else if (colorChoice > 0.8) {
                // Blue star
                starColors.push(0.6, 0.8, 1.0);
            } else {
                // White star with slight blue tint
                starColors.push(0.8, 0.9, 1.0);
            }
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(stars);
        this.stars = stars;
        
        // Create moon
        const moonGeometry = new THREE.SphereGeometry(5, 16, 16);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffee,
            transparent: true,
            opacity: 0.8
        });
        
        const moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(50, 40, -60);
        this.scene.add(moon);
        
        // Add glow around moon
        const moonGlowGeometry = new THREE.SphereGeometry(6, 16, 16);
        const moonGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        
        const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
        moon.add(moonGlow);
    }

    toggleDebugMode() {
        this.debugMode = !this.debugMode;
        console.log("Debug mode:", this.debugMode);
        
        // Clear existing debug objects
        this.debugObjects.forEach(obj => this.scene.remove(obj));
        this.debugObjects = [];
        
        if (this.debugMode) {
            // Create collision visualization for player
            if (this.player && this.player.mesh) {
                const playerHelper = new THREE.Mesh(
                    new THREE.SphereGeometry(this.state.collisionRadius.player, 16, 16),
                    new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })
                );
                playerHelper.position.copy(this.player.mesh.position);
                playerHelper.position.y = 1;
                this.scene.add(playerHelper);
                this.debugObjects.push(playerHelper);
            }
            
            // Create collision visualization for goblins
            this.goblins.forEach(goblin => {
                if (goblin.mesh) {
                    const goblinHelper = new THREE.Mesh(
                        new THREE.SphereGeometry(this.state.collisionRadius.goblin, 16, 16),
                        new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true })
                    );
                    goblinHelper.position.copy(goblin.mesh.position);
                    goblinHelper.position.y = 0.8;
                    this.scene.add(goblinHelper);
                    this.debugObjects.push(goblinHelper);
                }
            });
        }
    }

    setupLights() {
        // Ambient light - moonlight effect
        const ambientLight = new THREE.AmbientLight(0x3333aa, 0.4);
        this.scene.add(ambientLight);
        
        // Directional light (moon) with simplified shadows
        const moonLight = new THREE.DirectionalLight(0x8888ff, 0.6);
        moonLight.position.set(50, 100, 50);
        moonLight.castShadow = true;
        
        // Optimize shadow settings
        moonLight.shadow.mapSize.width = 512;
        moonLight.shadow.mapSize.height = 512;
        moonLight.shadow.camera.near = 1;
        moonLight.shadow.camera.far = 100;
        moonLight.shadow.camera.left = -50;
        moonLight.shadow.camera.right = 50;
        moonLight.shadow.camera.top = 50;
        moonLight.shadow.camera.bottom = -50;
        
        this.scene.add(moonLight);
        
        // Add magical ambient lights
        const blueLight = new THREE.PointLight(0x0044ff, 1, 20);
        blueLight.position.set(15, 2, 15);
        this.scene.add(blueLight);
        
        const purpleLight = new THREE.PointLight(0x8800ff, 1, 20);
        purpleLight.position.set(-15, 2, -15);
        this.scene.add(purpleLight);
    }

    createForestEnvironment() {
        // Create textured ground
        this.createGround();
        
        // Add trees
        this.createTrees();
        
        // Add rocks and other natural elements
        this.createRocksAndDetails();
        
        // Add magical elements
        this.createMagicalElements();
    }

    createGround() {
        // Ground with texture
        const groundGeometry = new THREE.PlaneGeometry(100, 100, 20, 20);
        
        // Create a simple procedural texture for the ground
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Fill with base color
        context.fillStyle = '#228B22';
        context.fillRect(0, 0, 512, 512);
        
        // Add some variation
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const radius = 1 + Math.random() * 3;
            const color = Math.random() > 0.5 ? '#1a6b1a' : '#2a9b2a';
            
            context.beginPath();
            context.fillStyle = color;
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();
        }
        
        // Create texture from canvas
        const groundTexture = new THREE.CanvasTexture(canvas);
        groundTexture.wrapS = THREE.RepeatWrapping;
        groundTexture.wrapT = THREE.RepeatWrapping;
        groundTexture.repeat.set(10, 10);
        
        const groundMaterial = new THREE.MeshLambertMaterial({
            map: groundTexture,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        ground.position.y = 0; // Ensure ground is at y=0
        this.scene.add(ground);
    }
    
    createTrees() {
        // Create simplified trees
        const treeCount = 30; // Number of trees
        
        for (let i = 0; i < treeCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 40;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create tree
            this.createTree(x, z);
        }
    }
    
    createTree(x, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1, z);
        trunk.castShadow = true;
        trunk.receiveShadow = true;
        
        // Tree leaves
        const leavesGeometry = new THREE.ConeGeometry(1, 3, 8);
        const leavesMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x228B22,
            emissive: 0x003300,
            emissiveIntensity: 0.2
        });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 2.5;
        leaves.castShadow = true;
        
        // Add leaves to trunk
        trunk.add(leaves);
        
        // Add tree to scene
        this.scene.add(trunk);
        
        // Add a small chance for a magical glow
        if (Math.random() < 0.2) {
            const glowColor = Math.random() < 0.5 ? 0x00ffff : 0xff00ff;
            const glow = new THREE.PointLight(glowColor, 0.5, 3);
            glow.position.y = 1.5 + Math.random() * 2;
            trunk.add(glow);
        }
    }
    
    createMagicalElements() {
        // Create floating particles
        const particleCount = 100;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 30;
            const x = Math.cos(angle) * distance;
            const y = 0.5 + Math.random() * 5;
            const z = Math.sin(angle) * distance;
            
            // Create particle
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() < 0.5 ? 0x00ffff : 0xff00ff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(x, y, z);
            
            // Store original position for animation
            particle.userData.originalY = y;
            particle.userData.speed = 0.2 + Math.random() * 0.5;
            particle.userData.phase = Math.random() * Math.PI * 2;
            
            particles.add(particle);
        }
        
        this.scene.add(particles);
        this.magicalParticles = particles;
    }

    createPerformanceMonitor() {
        // Create FPS counter
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.style.position = 'absolute';
        this.fpsDisplay.style.bottom = '5px';
        this.fpsDisplay.style.right = '5px';
        this.fpsDisplay.style.color = 'white';
        this.fpsDisplay.style.fontSize = '12px';
        this.fpsDisplay.style.fontFamily = 'monospace';
        this.fpsDisplay.style.backgroundColor = 'rgba(0,0,0,0.5)';
        this.fpsDisplay.style.padding = '5px';
        this.fpsDisplay.style.borderRadius = '3px';
        this.fpsDisplay.textContent = 'FPS: --';
        document.body.appendChild(this.fpsDisplay);
    }

    setupInputListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Fire on space
            if (e.code === 'Space' && this.player && !this.state.gameOver) {
                this.player.shootFireball();
            }
            
            // Pause on Escape
            if (e.code === 'Escape') {
                this.togglePause();
            }
            
            // Map arrow keys to WASD equivalents for consistent handling
            if (e.code === 'ArrowUp') this.keys['KeyW'] = true;
            if (e.code === 'ArrowDown') this.keys['KeyS'] = true;
            if (e.code === 'ArrowLeft') this.keys['KeyA'] = true;
            if (e.code === 'ArrowRight') this.keys['KeyD'] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Map arrow keys to WASD equivalents for consistent handling
            if (e.code === 'ArrowUp') this.keys['KeyW'] = false;
            if (e.code === 'ArrowDown') this.keys['KeyS'] = false;
            if (e.code === 'ArrowLeft') this.keys['KeyA'] = false;
            if (e.code === 'ArrowRight') this.keys['KeyD'] = false;
        });
        
        // Restart button
        document.getElementById('restart-button').addEventListener('click', () => {
            this.restart();
        });
    }

    loadAssets() {
        // Create player
        this.player = new Player(this);
        this.objectsToUpdate.push(this.player);
        
        // Spawn initial goblins
        this.spawnGoblins(3); // Reduced from 5
    }

    spawnGoblins(count) {
        // Limit total number of goblins
        const spawnCount = Math.min(count, this.state.maxGoblins - this.goblins.length);
        
        for (let i = 0; i < spawnCount; i++) {
            const goblin = new Goblin(this);
            this.goblins.push(goblin);
            this.objectsToUpdate.push(goblin);
        }
    }

    addFireball(fireball) {
        // Limit total number of fireballs
        if (this.fireballs.length >= this.state.maxFireballs) {
            // Remove oldest fireball
            if (this.fireballs.length > 0) {
                this.removeObject(this.fireballs[0]);
            }
        }
        
        this.fireballs.push(fireball);
        this.objectsToUpdate.push(fireball);
    }

    removeObject(object) {
        // Remove from scene
        if (object.mesh) {
            this.scene.remove(object.mesh);
        }
        
        // Remove particles if they exist
        if (object.particles) {
            this.scene.remove(object.particles);
        }
        
        // Remove from appropriate array
        if (object instanceof Goblin) {
            const index = this.goblins.indexOf(object);
            if (index !== -1) {
                this.goblins.splice(index, 1);
            }
        } else if (object instanceof Fireball) {
            const index = this.fireballs.indexOf(object);
            if (index !== -1) {
                this.fireballs.splice(index, 1);
            }
        }
        
        // Remove from update list
        const updateIndex = this.objectsToUpdate.indexOf(object);
        if (updateIndex !== -1) {
            this.objectsToUpdate.splice(updateIndex, 1);
        }
    }

    damagePlayer(damage) {
        if (this.state.gameOver) return;
        
        this.state.playerHealth -= damage;
        
        // Check for game over
        if (this.state.playerHealth <= 0) {
            this.state.playerHealth = 0;
            this.gameOver();
        }
        
        // Dispatch event for UI update
        const event = new CustomEvent('healthChanged', { 
            detail: { health: this.state.playerHealth } 
        });
        document.dispatchEvent(event);
    }

    increaseScore(points) {
        this.state.score += points;
        
        // Dispatch event for UI update
        const event = new CustomEvent('scoreChanged', { 
            detail: { score: this.state.score } 
        });
        document.dispatchEvent(event);
        
        // Spawn new goblin if needed, but not too frequently
        if (this.goblins.length < 3 + Math.min(5, Math.floor(this.state.score / 100))) {
            if (Math.random() < 0.3) {
                this.spawnGoblins(1);
            }
        }
    }

    gameOver() {
        this.state.gameOver = true;
        
        // Show game over screen
        document.getElementById('game-over').style.display = 'block';
        document.getElementById('final-score').textContent = this.state.score;
    }

    restart() {
        // Reset game state
        this.state.playerHealth = 100;
        this.state.score = 0;
        this.state.gameOver = false;
        
        // Clear all goblins and fireballs
        [...this.goblins, ...this.fireballs].forEach(obj => {
            this.removeObject(obj);
        });
        
        // Reset player position
        if (this.player) {
            this.player.reset();
        }
        
        // Spawn new goblins
        this.spawnGoblins(3); // Reduced from 5
        
        // Hide game over screen
        document.getElementById('game-over').style.display = 'none';
        
        // Update UI
        document.dispatchEvent(new CustomEvent('healthChanged', { 
            detail: { health: this.state.playerHealth } 
        }));
        document.dispatchEvent(new CustomEvent('scoreChanged', { 
            detail: { score: this.state.score } 
        }));
    }

    togglePause() {
        this.state.paused = !this.state.paused;
    }

    update() {
        if (this.state.paused || this.state.gameOver) return;
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update all game objects
        this.objectsToUpdate.forEach(object => {
            object.update(deltaTime);
        });
        
        // Check for collisions
        this.checkCollisions();
        
        // Spawn new goblins if needed, but less frequently
        if (Math.random() < 0.002 && this.goblins.length < this.state.maxGoblins) {
            this.spawnGoblins(1);
        }
        
        // Update debug visualizations if enabled
        if (this.debugMode) {
            this.updateDebugVisualizations();
        }
        
        // Update magical particles
        if (this.magicalParticles) {
            this.magicalParticles.children.forEach(particle => {
                const originalY = particle.userData.originalY;
                const speed = particle.userData.speed;
                const phase = particle.userData.phase;
                
                // Float up and down
                particle.position.y = originalY + Math.sin(elapsedTime * speed + phase) * 0.5;
                
                // Glow effect
                if (particle.material) {
                    particle.material.opacity = 0.5 + Math.sin(elapsedTime * speed + phase) * 0.3;
                }
            });
        }
        
        // Make stars twinkle
        if (this.stars) {
            const colors = this.stars.geometry.attributes.color.array;
            
            for (let i = 0; i < colors.length; i += 3) {
                const twinkle = 0.7 + 0.3 * Math.sin(elapsedTime * (0.5 + Math.random()) + i);
                colors[i] *= twinkle;
                colors[i+1] *= twinkle;
                colors[i+2] *= twinkle;
            }
            
            this.stars.geometry.attributes.color.needsUpdate = true;
        }
        
        // Update FPS counter
        this.fpsCounter++;
        const now = performance.now();
        if (now - this.lastFpsUpdate > 1000) {
            this.fpsDisplay.textContent = `FPS: ${this.fpsCounter}`;
            this.fpsCounter = 0;
            this.lastFpsUpdate = now;
        }
    }
    
    updateDebugVisualizations() {
        // Update player collision visualization
        if (this.player && this.player.mesh && this.debugObjects.length > 0) {
            this.debugObjects[0].position.copy(this.player.mesh.position);
            this.debugObjects[0].position.y = 1;
            
            // Update goblin collision visualizations
            let goblinIndex = 1;
            this.goblins.forEach(goblin => {
                if (goblin.mesh && goblinIndex < this.debugObjects.length) {
                    this.debugObjects[goblinIndex].position.copy(goblin.mesh.position);
                    this.debugObjects[goblinIndex].position.y = 0.8;
                    goblinIndex++;
                }
            });
        }
    }

    checkCollisions() {
        // Get collision radii
        const { player: playerRadius, goblin: goblinRadius, fireball: fireballRadius } = this.state.collisionRadius;
        
        // Check fireball collisions
        for (let i = this.fireballs.length - 1; i >= 0; i--) {
            const fireball = this.fireballs[i];
            
            if (!fireball || !fireball.mesh) continue;
            
            if (fireball.isPlayerFireball) {
                // Check for goblin hits
                for (let j = this.goblins.length - 1; j >= 0; j--) {
                    const goblin = this.goblins[j];
                    
                    if (!goblin || !goblin.mesh) continue;
                    
                    // Improved collision detection - use horizontal distance only
                    const fireballPos = fireball.mesh.position.clone();
                    const goblinPos = goblin.mesh.position.clone();
                    
                    // Ignore Y axis for collision (makes it easier to hit)
                    fireballPos.y = 0;
                    goblinPos.y = 0;
                    
                    const collisionDistance = fireballRadius + goblinRadius;
                    const distance = fireballPos.distanceTo(goblinPos);
                    
                    if (distance < collisionDistance) {
                        // Hit a goblin - create visual effect
                        this.createHitEffect(goblin.mesh.position.clone());
                        
                        // Increase score
                        this.increaseScore(10);
                        
                        // Remove goblin and fireball
                        this.removeObject(goblin);
                        this.removeObject(fireball);
                        
                        // Log hit for debugging
                        console.log("Hit goblin! Distance:", distance, "Collision threshold:", collisionDistance);
                        break; // Exit loop after removing fireball
                    }
                }
            } else {
                // Check for player hit
                if (this.player && this.player.mesh) {
                    // Improved collision detection - use horizontal distance only
                    const fireballPos = fireball.mesh.position.clone();
                    const playerPos = this.player.mesh.position.clone();
                    
                    // Ignore Y axis for collision (makes it easier to hit)
                    fireballPos.y = 0;
                    playerPos.y = 0;
                    
                    const collisionDistance = fireballRadius + playerRadius;
                    const distance = fireballPos.distanceTo(playerPos);
                    
                    if (distance < collisionDistance) {
                        // Create hit effect
                        this.createHitEffect(this.player.mesh.position.clone().add(new THREE.Vector3(0, 1, 0)));
                        
                        // Damage player
                        this.damagePlayer(10);
                        this.removeObject(fireball);
                    }
                }
            }
        }
    }
    
    createHitEffect(position) {
        // Create explosion effect at hit position
        const particleCount = 20;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around hit point
            const angle = Math.random() * Math.PI * 2;
            const height = Math.random() * 2;
            const radius = Math.random() * 1;
            
            particle.position.set(
                position.x + Math.cos(angle) * radius,
                position.y + height,
                position.z + Math.sin(angle) * radius
            );
            
            // Add velocity for animation
            particle.userData.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 3,
                (Math.random() - 0.5) * 3
            );
            
            // Add to group
            particles.add(particle);
        }
        
        // Add to scene
        this.scene.add(particles);
        
        // Add light flash
        const flash = new THREE.PointLight(0xff6600, 2, 5);
        flash.position.copy(position);
        this.scene.add(flash);
        
        // Remove after animation
        setTimeout(() => {
            // Animate particles
            const animateExplosion = () => {
                // Check if particles still exist
                if (!particles.parent) return;
                
                let allDone = true;
                
                particles.children.forEach(particle => {
                    // Move particle
                    particle.position.add(particle.userData.velocity);
                    
                    // Apply gravity
                    particle.userData.velocity.y -= 0.1;
                    
                    // Fade out
                    if (particle.material.opacity > 0.05) {
                        particle.material.opacity -= 0.05;
                        allDone = false;
                    }
                });
                
                if (allDone) {
                    this.scene.remove(particles);
                } else {
                    requestAnimationFrame(animateExplosion);
                }
            };
            
            // Start animation
            animateExplosion();
            
            // Remove flash
            setTimeout(() => {
                this.scene.remove(flash);
            }, 100);
        }, 0);
    }

    createRocksAndDetails() {
        // Add rocks
        this.createRocks();
        
        // Add mushrooms
        this.createMushrooms();
        
        // Add fallen logs
        this.createFallenLogs();
        
        // Add grass patches
        this.createGrassPatches();
    }
    
    createRocks() {
        // Create rocks of various sizes
        const rockCount = 20;
        
        for (let i = 0; i < rockCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 40;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Random size
            const size = 0.3 + Math.random() * 0.7;
            
            // Create rock
            const rockGeometry = new THREE.DodecahedronGeometry(size, 1);
            const rockMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x777777,
                emissive: 0x111111,
                emissiveIntensity: 0.1
            });
            
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            // Position on ground
            rock.position.set(x, size/2, z);
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.scene.add(rock);
        }
    }
    
    createMushrooms() {
        // Create magical mushrooms
        const mushroomCount = 15;
        
        for (let i = 0; i < mushroomCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 35;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create mushroom stem
            const stemGeometry = new THREE.CylinderGeometry(0.05, 0.07, 0.2, 8);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            stem.position.set(x, 0.1, z);
            stem.castShadow = true;
            
            // Create mushroom cap
            const capGeometry = new THREE.ConeGeometry(0.15, 0.1, 8, 1, true);
            const capMaterial = new THREE.MeshLambertMaterial({ 
                color: Math.random() < 0.5 ? 0xff44ff : 0x44ffff,
                emissive: Math.random() < 0.5 ? 0x330033 : 0x003333,
                emissiveIntensity: 0.5
            });
            
            const cap = new THREE.Mesh(capGeometry, capMaterial);
            cap.position.y = 0.15;
            cap.rotation.x = Math.PI;
            stem.add(cap);
            
            // Add glow
            const glow = new THREE.PointLight(
                Math.random() < 0.5 ? 0xff00ff : 0x00ffff,
                0.5,
                1
            );
            glow.position.y = 0.15;
            stem.add(glow);
            
            this.scene.add(stem);
        }
    }
    
    createFallenLogs() {
        // Create fallen logs
        const logCount = 8;
        
        for (let i = 0; i < logCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 30;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create log
            const logGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            const logMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const log = new THREE.Mesh(logGeometry, logMaterial);
            
            // Position on ground and rotate to lie flat
            log.position.set(x, 0.3, z);
            log.rotation.z = Math.PI / 2;
            log.rotation.y = Math.random() * Math.PI;
            
            log.castShadow = true;
            log.receiveShadow = true;
            
            // Add moss
            if (Math.random() < 0.7) {
                const mossGeometry = new THREE.BoxGeometry(0.5, 0.05, 2);
                const mossMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x228822,
                    transparent: true,
                    opacity: 0.9
                });
                
                const moss = new THREE.Mesh(mossGeometry, mossMaterial);
                moss.position.y = 0.3;
                log.add(moss);
            }
            
            this.scene.add(log);
        }
    }
    
    createGrassPatches() {
        // Create patches of tall grass
        const patchCount = 25;
        
        for (let i = 0; i < patchCount; i++) {
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 40;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // Create grass patch
            const grassGroup = new THREE.Group();
            grassGroup.position.set(x, 0, z);
            
            // Add individual grass blades
            const bladeCount = 5 + Math.floor(Math.random() * 10);
            
            for (let j = 0; j < bladeCount; j++) {
                const height = 0.3 + Math.random() * 0.5;
                const bladeGeometry = new THREE.PlaneGeometry(0.1, height);
                const bladeMaterial = new THREE.MeshLambertMaterial({ 
                    color: 0x33aa33,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.9
                });
                
                const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
                
                // Position within patch
                const bladeX = (Math.random() - 0.5) * 0.5;
                const bladeZ = (Math.random() - 0.5) * 0.5;
                blade.position.set(bladeX, height/2, bladeZ);
                
                // Random rotation
                blade.rotation.y = Math.random() * Math.PI;
                
                grassGroup.add(blade);
            }
            
            this.scene.add(grassGroup);
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.update();
        this.renderer.render(this.scene, this.camera);
    }
} 