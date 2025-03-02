import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fireball } from './Fireball.js';

export class Player {
    constructor(game) {
        this.game = game;
        this.speed = 5; // Units per second
        this.fireballCooldown = 0.5; // Seconds
        this.lastFireTime = 0;
        
        // Create temporary mesh
        this.createTempMesh();
        
        // Add player light (fire effect)
        this.createLight();
        
        // Load model
        this.loadModel();
    }
    
    createTempMesh() {
        // Create a simpler temporary mesh with proper size
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x0044ff,
            emissive: 0x000066, 
            emissiveIntensity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.position.y = 1; // Half height for proper ground placement
        this.game.scene.add(this.mesh);
    }
    
    createLight() {
        // Add a point light to the player for magical effect
        this.light = new THREE.PointLight(0x00aaff, 1, 8);
        this.light.position.set(0, 1, 0);
        this.mesh.add(this.light);
        
        // Add a second light for more magical effect
        this.secondLight = new THREE.PointLight(0x8800ff, 0.7, 5);
        this.secondLight.position.set(0, 0.5, 0);
        this.mesh.add(this.secondLight);
    }
    
    loadModel() {
        const loader = new GLTFLoader();
        
        // Use a fallback if model doesn't load after 5 seconds
        this.modelLoadTimeout = setTimeout(() => {
            console.log("Using fallback player model due to timeout");
            // The temporary mesh will remain
        }, 5000);
        
        loader.load('./wizard.glb', (gltf) => {
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
                
                // Target height around 2 units
                const targetHeight = 2;
                const scale = targetHeight / size.y;
                
                // Apply scale with a safety check
                const finalScale = isFinite(scale) && scale > 0 ? scale : 0.1;
                this.mesh.scale.set(finalScale, finalScale, finalScale);
                
                // Position at the same place as temp mesh, ensuring it's on the ground
                this.mesh.position.copy(position);
                
                // Ensure the model is properly grounded by adjusting its position
                // based on the bounding box
                const newBox = new THREE.Box3().setFromObject(this.mesh);
                const height = newBox.max.y - newBox.min.y;
                this.mesh.position.y = height / 2; // Position so bottom is at y=0
                
                // Add shadows to all meshes but limit complexity
                this.mesh.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Clone the material to avoid sharing across instances
                        if (Array.isArray(child.material)) {
                            child.material = child.material.map(m => m.clone());
                        } else if (child.material) {
                            child.material = child.material.clone();
                        }
                        
                        // Make materials more visible and magical
                        if (child.material) {
                            const applyMaterialEnhancements = (material) => {
                                // Add blue magical tint
                                material.emissive = new THREE.Color(0x0033aa);
                                material.emissiveIntensity = 0.4;
                                
                                // Increase material brightness
                                if (material.map) {
                                    material.map.encoding = THREE.sRGBEncoding;
                                }
                                
                                // Ensure materials are visible
                                material.transparent = false;
                                material.opacity = 1.0;
                            };
                            
                            if (Array.isArray(child.material)) {
                                child.material.forEach(applyMaterialEnhancements);
                            } else {
                                applyMaterialEnhancements(child.material);
                            }
                        }
                        
                        // Simplify geometry if it's too complex
                        if (child.geometry && child.geometry.attributes.position.count > 5000) {
                            console.log("Simplifying complex mesh");
                        }
                    }
                });
                
                // Add to scene
                this.game.scene.add(this.mesh);
                
                // Re-add lights to new mesh
                this.mesh.add(this.light);
                if (this.secondLight) {
                    this.mesh.add(this.secondLight);
                }
                
                // Add magical particle effect
                this.createMagicalEffect();
                
                console.log("Player model loaded with scale:", finalScale);
            } catch (e) {
                console.error("Error setting up player model:", e);
                // Keep using the temporary mesh
            }
        }, undefined, (error) => {
            console.error('Error loading wizard model:', error);
            clearTimeout(this.modelLoadTimeout);
        });
    }
    
    createMagicalEffect() {
        // Create a simple particle system for magical effect
        const particleCount = 20;
        this.particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: Math.random() < 0.5 ? 0x00aaff : 0x8800ff,
                transparent: true,
                opacity: 0.7
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Random position around player
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.3 + Math.random() * 0.5;
            particle.position.set(
                Math.cos(angle) * radius,
                0.5 + Math.random() * 1.5,
                Math.sin(angle) * radius
            );
            
            // Store animation parameters
            particle.userData.originalY = particle.position.y;
            particle.userData.originalRadius = radius;
            particle.userData.originalAngle = angle;
            particle.userData.speed = 0.5 + Math.random() * 1.5;
            particle.userData.phase = Math.random() * Math.PI * 2;
            
            this.particles.add(particle);
        }
        
        this.mesh.add(this.particles);
    }
    
    updateLightEffect() {
        // Create flickering fire effect (simplified)
        if (this.light) {
            const flickerIntensity = 0.7 + Math.random() * 0.5;
            this.light.intensity = flickerIntensity;
        }
        
        if (this.secondLight) {
            const flickerIntensity = 0.5 + Math.random() * 0.5;
            this.secondLight.intensity = flickerIntensity;
        }
        
        // Update magical particles
        if (this.particles) {
            const time = this.game.clock.getElapsedTime();
            
            this.particles.children.forEach(particle => {
                const originalY = particle.userData.originalY;
                const originalRadius = particle.userData.originalRadius;
                const originalAngle = particle.userData.originalAngle;
                const speed = particle.userData.speed;
                const phase = particle.userData.phase;
                
                // Float up and down
                particle.position.y = originalY + Math.sin(time * speed + phase) * 0.2;
                
                // Orbit around player
                const angle = originalAngle + time * 0.5;
                particle.position.x = Math.cos(angle) * originalRadius;
                particle.position.z = Math.sin(angle) * originalRadius;
                
                // Glow effect
                if (particle.material) {
                    particle.material.opacity = 0.5 + Math.sin(time * speed + phase) * 0.3;
                }
            });
        }
    }
    
    update(deltaTime) {
        if (!this.mesh) return;
        
        // Movement
        const moveSpeed = this.speed * deltaTime;
        let moved = false;
        let movementDirection = new THREE.Vector3(0, 0, 0);
        
        if (this.game.keys['KeyW']) {
            this.mesh.position.z -= moveSpeed;
            movementDirection.z -= 1;
            moved = true;
        }
        if (this.game.keys['KeyS']) {
            this.mesh.position.z += moveSpeed;
            movementDirection.z += 1;
            moved = true;
        }
        if (this.game.keys['KeyA']) {
            this.mesh.position.x -= moveSpeed;
            movementDirection.x -= 1;
            moved = true;
        }
        if (this.game.keys['KeyD']) {
            this.mesh.position.x += moveSpeed;
            movementDirection.x += 1;
            moved = true;
        }
        
        // Rotation (face movement direction)
        if (moved && movementDirection.length() > 0) {
            movementDirection.normalize();
            const targetRotation = Math.atan2(movementDirection.x, -movementDirection.z);
            
            // Store the last valid movement direction for shooting
            this.lastMovementDirection = new THREE.Vector3(
                movementDirection.x,
                0,
                movementDirection.z
            ).normalize();
            
            this.mesh.rotation.y = targetRotation;
        }
        
        // Ensure player stays on the ground
        const properHeight = this.getProperHeight();
        if (this.mesh.position.y !== properHeight) {
            this.mesh.position.y = properHeight;
        }
        
        // Update camera to follow player
        this.updateCamera();
        
        // Update light and particle effects
        this.updateLightEffect();
    }
    
    updateCamera() {
        // Position camera behind player with fixed offset
        const cameraOffset = new THREE.Vector3(0, 5, 10);
        const targetPosition = new THREE.Vector3(
            this.mesh.position.x + cameraOffset.x,
            this.mesh.position.y + cameraOffset.y,
            this.mesh.position.z + cameraOffset.z
        );
        
        // Smooth camera follow with limited lerp for better performance
        this.game.camera.position.lerp(targetPosition, 0.05);
        this.game.camera.lookAt(this.mesh.position.x, this.mesh.position.y + 1, this.mesh.position.z);
    }
    
    shootFireball() {
        const currentTime = this.game.clock.getElapsedTime();
        
        // Check cooldown
        if (currentTime - this.lastFireTime < this.fireballCooldown) {
            return;
        }
        
        // Update last fire time
        this.lastFireTime = currentTime;
        
        // Use the direction the player is facing based on their rotation
        let direction;
        
        // If we have a last movement direction, use that
        if (this.lastMovementDirection) {
            direction = this.lastMovementDirection.clone();
        } else {
            // Fallback to the direction based on rotation
            direction = new THREE.Vector3(0, 0, -1);
            direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.mesh.rotation.y);
        }
        
        // Keep fireball trajectory flat (parallel to ground)
        direction.y = 0;
        direction.normalize();
        
        // Create fireball at proper height
        const fireballHeight = 1.2; // Height from ground
        const startPosition = this.mesh.position.clone();
        startPosition.y = fireballHeight;
        
        // Add a small offset in the direction the player is facing
        startPosition.add(direction.clone().multiplyScalar(0.8));
        
        const fireball = new Fireball(this.game, startPosition, direction, true);
        
        // Add to game
        this.game.addFireball(fireball);
        
        // Add visual effect for shooting
        this.createShootingEffect(startPosition.clone(), direction.clone());
    }
    
    createShootingEffect(position, direction) {
        // Create a flash effect when player shoots
        const flash = new THREE.PointLight(0x00aaff, 2, 3);
        flash.position.copy(position);
        this.game.scene.add(flash);
        
        // Create small particles for the shooting effect
        const particleCount = 10;
        const particles = new THREE.Group();
        
        for (let i = 0; i < particleCount; i++) {
            const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            
            // Position at the shooting point
            particle.position.copy(position);
            
            // Add velocity - mostly in the direction of shooting but with some spread
            const spread = 0.3;
            particle.userData.velocity = new THREE.Vector3(
                direction.x + (Math.random() - 0.5) * spread,
                (Math.random() - 0.5) * spread,
                direction.z + (Math.random() - 0.5) * spread
            ).multiplyScalar(0.1);
            
            particles.add(particle);
        }
        
        this.game.scene.add(particles);
        
        // Animate and remove effects
        setTimeout(() => {
            // Remove flash
            this.game.scene.remove(flash);
            
            // Animate particles
            const animateParticles = () => {
                // Check if particles still exist
                if (!particles.parent) return;
                
                let allDone = true;
                
                particles.children.forEach(particle => {
                    // Move particle
                    particle.position.add(particle.userData.velocity);
                    
                    // Fade out
                    if (particle.material.opacity > 0.05) {
                        particle.material.opacity -= 0.05;
                        allDone = false;
                    }
                });
                
                if (allDone) {
                    this.game.scene.remove(particles);
                } else {
                    requestAnimationFrame(animateParticles);
                }
            };
            
            // Start animation
            animateParticles();
        }, 100);
    }
    
    getProperHeight() {
        // Calculate proper height based on model size
        if (this.modelLoaded) {
            const box = new THREE.Box3().setFromObject(this.mesh);
            const height = box.max.y - box.min.y;
            return height / 2; // Position so bottom is at y=0
        }
        return 1; // Default height for temp mesh
    }
    
    reset() {
        // Reset position
        this.mesh.position.set(0, this.mesh.position.y, 0);
    }
} 