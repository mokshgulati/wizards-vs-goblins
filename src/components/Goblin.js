import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fireball } from './Fireball.js';

export class Goblin {
    constructor(game) {
        this.game = game;
        this.speed = 2; // Units per second
        this.attackCooldown = 3; // Increased cooldown for fewer fireballs
        this.lastAttackTime = 0;
        this.detectionRange = 20;
        this.modelLoaded = false;
        
        // Create temporary mesh
        this.createTempMesh();
        
        // Load model with a delay to stagger loading
        setTimeout(() => {
            this.loadModel();
        }, Math.random() * 1000); // Stagger loading up to 1 second
    }
    
    createTempMesh() {
        // Create a more visible temporary mesh with proper size
        const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8); // Slightly smaller than player
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xff0000,
            emissive: 0x330000 // Add some emissive color to make it more visible
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        
        // Random position with better visibility
        const spawnRadius = 15; // Reduced radius
        const angle = Math.random() * Math.PI * 2;
        const distance = 10 + Math.random() * spawnRadius;
        
        this.mesh.position.x = Math.cos(angle) * distance;
        this.mesh.position.y = 0.8; // Half height for proper ground placement
        this.mesh.position.z = Math.sin(angle) * distance;
        
        // Add a small light to make goblin more visible
        const pointLight = new THREE.PointLight(0xff0000, 0.3, 3);
        pointLight.position.set(0, 1, 0);
        this.mesh.add(pointLight);
        
        this.game.scene.add(this.mesh);
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        
        // Use a fallback if model doesn't load after 5 seconds
        this.modelLoadTimeout = setTimeout(() => {
            console.log("Using fallback goblin model due to timeout");
            // The temporary mesh will remain
            this.modelLoaded = true; // Mark as loaded anyway
        }, 5000);
        
        loader.load('./goblin.glb', (gltf) => {
            clearTimeout(this.modelLoadTimeout);
            
            try {
                // Store position of temp mesh
                const position = this.mesh.position.clone();
                
                // Remove temporary mesh
                this.game.scene.remove(this.mesh);
                
                // Set up the model with proper scale
                this.mesh = gltf.scene;
                
                // Check model size and adjust scale accordingly
                const box = new THREE.Box3().setFromObject(this.mesh);
                const size = box.getSize(new THREE.Vector3());
                
                // Target height around 1.6 units (slightly smaller than player)
                const targetHeight = 1.6;
                const scale = targetHeight / size.y;
                
                // Apply scale with a safety check
                const finalScale = isFinite(scale) && scale > 0 ? scale : 0.05;
                this.mesh.scale.set(finalScale, finalScale, finalScale);
                
                // Position at the same place as temp mesh
                this.mesh.position.copy(position);
                
                // Ensure the model is properly grounded by adjusting its position
                // based on the bounding box
                const newBox = new THREE.Box3().setFromObject(this.mesh);
                const height = newBox.max.y - newBox.min.y;
                this.mesh.position.y = height / 2; // Position so bottom is at y=0
                
                // Add shadows to all meshes and enhance materials
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Enhance materials with better colors and properties
                        if (child.material) {
                            // Clone the material to avoid sharing across instances
                            if (Array.isArray(child.material)) {
                                child.material = child.material.map(m => m.clone());
                            } else {
                                child.material = child.material.clone();
                            }
                            
                            // Apply to single material or array of materials
                            const applyMaterialEnhancements = (material) => {
                                // Add green tint to make goblin more visible
                                material.color = new THREE.Color(0x88ff88);
                                material.emissive = new THREE.Color(0x003300);
                                material.emissiveIntensity = 0.4;
                                
                                // Increase material brightness
                                if (material.map) {
                                    material.map.encoding = THREE.sRGBEncoding;
                                }
                                
                                // Ensure materials are visible
                                material.transparent = false;
                                material.opacity = 1.0;
                                material.side = THREE.DoubleSide; // Render both sides
                            };
                            
                            if (Array.isArray(child.material)) {
                                child.material.forEach(applyMaterialEnhancements);
                            } else {
                                applyMaterialEnhancements(child.material);
                            }
                        }
                    }
                });
                
                // Add a stronger light to make goblin more visible
                const pointLight = new THREE.PointLight(0x00ff00, 0.5, 5);
                pointLight.position.set(0, 1, 0);
                this.mesh.add(pointLight);
                
                // Add to scene
                this.game.scene.add(this.mesh);
                this.modelLoaded = true;
                
                console.log("Goblin model loaded with scale:", finalScale);
            } catch (e) {
                console.error("Error setting up goblin model:", e);
                this.modelLoaded = true; // Mark as loaded anyway
            }
        }, undefined, (error) => {
            console.error('Error loading goblin model:', error);
            clearTimeout(this.modelLoadTimeout);
            this.modelLoaded = true; // Mark as loaded anyway
        });
    }
    
    update(deltaTime) {
        if (!this.mesh || !this.game.player || !this.game.player.mesh) return;
        
        // Calculate distance to player
        const distanceToPlayer = this.mesh.position.distanceTo(this.game.player.mesh.position);
        
        // Only move and attack if player is within detection range
        if (distanceToPlayer < this.detectionRange) {
            // Move towards player
            this.moveTowardsPlayer(deltaTime, distanceToPlayer);
            
            // Attack if close enough and not too frequently
            if (distanceToPlayer < 10 && Math.random() < 0.3) {
                this.attackPlayer(deltaTime);
            }
        }
        
        // Ensure goblin stays on the ground
        if (this.mesh.position.y > 0.8 && this.mesh.position.y !== this.getProperHeight()) {
            this.mesh.position.y = this.getProperHeight();
        }
    }
    
    getProperHeight() {
        // Calculate proper height based on model size
        if (this.modelLoaded) {
            const box = new THREE.Box3().setFromObject(this.mesh);
            const height = box.max.y - box.min.y;
            return height / 2;
        }
        return 0.8; // Default height for temp mesh
    }
    
    moveTowardsPlayer(deltaTime, distanceToPlayer) {
        // Calculate direction to player
        const direction = new THREE.Vector3();
        direction.subVectors(this.game.player.mesh.position, this.mesh.position);
        direction.y = 0; // Keep on ground
        direction.normalize();
        
        // Move towards player, but keep some distance
        if (distanceToPlayer > 5) {
            const moveSpeed = this.speed * deltaTime;
            this.mesh.position.add(direction.multiplyScalar(moveSpeed));
            
            // Ensure y position is maintained
            this.mesh.position.y = this.getProperHeight();
        }
        
        // Face player
        this.mesh.lookAt(
            this.game.player.mesh.position.x,
            this.mesh.position.y, // Keep looking straight, not up/down
            this.game.player.mesh.position.z
        );
    }
    
    attackPlayer(deltaTime) {
        const currentTime = this.game.clock.getElapsedTime();
        
        // Check cooldown
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return;
        }
        
        // Update last attack time
        this.lastAttackTime = currentTime;
        
        // Get direction to player
        const direction = new THREE.Vector3();
        direction.subVectors(this.game.player.mesh.position, this.mesh.position);
        
        // Keep fireball trajectory flat (parallel to ground)
        direction.y = 0;
        direction.normalize();
        
        // Create fireball at proper height
        const fireballHeight = 1.0; // Height from ground
        const startPosition = this.mesh.position.clone();
        startPosition.y = fireballHeight;
        
        // Add a small offset in the direction of the player
        startPosition.add(direction.clone().multiplyScalar(0.8));
        
        const fireball = new Fireball(this.game, startPosition, direction, false);
        
        // Add to game
        this.game.addFireball(fireball);
        
        // Add visual effect for attack
        this.createAttackEffect();
    }
    
    createAttackEffect() {
        // Create a flash effect when goblin attacks
        const flash = new THREE.PointLight(0xff0000, 2, 3);
        flash.position.set(0, 1, 0);
        this.mesh.add(flash);
        
        // Remove after a short time
        setTimeout(() => {
            this.mesh.remove(flash);
        }, 200);
    }
} 