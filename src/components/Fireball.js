import * as THREE from 'three';

export class Fireball {
    constructor(game, position, direction, isPlayerFireball) {
        this.game = game;
        this.direction = direction.clone();
        this.speed = isPlayerFireball ? 15 : 8; // Player fireballs are faster
        this.isPlayerFireball = isPlayerFireball;
        this.lifespan = 3; // Seconds of life
        this.birthTime = this.game.clock.getElapsedTime();
        this.lastParticleEmit = 0;
        this.particleEmitRate = 0.05; // Emit particles every 0.05 seconds
        
        // Create mesh and particles
        this.createMesh(position);
        this.createParticleSystem(position);
        
        // Add a light source for the fireball
        this.createLight(position);
    }
    
    createMesh(position) {
        // Create a more organic-looking fireball core
        const coreGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00, // Bright orange-yellow
            transparent: true,
            opacity: 0.8
        });
        
        this.mesh = new THREE.Mesh(coreGeometry, coreMaterial);
        this.mesh.position.copy(position);
        
        // Add glow effect
        const glowGeometry = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff5500, // Orange-red
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.mesh.add(glow);
        
        this.game.scene.add(this.mesh);
    }
    
    createParticleSystem(position) {
        // Create a container for all particles
        this.particles = new THREE.Group();
        this.particles.position.copy(position);
        this.game.scene.add(this.particles);
        
        // Pre-create some initial particles
        for (let i = 0; i < 15; i++) {
            this.emitParticle(true);
        }
    }
    
    emitParticle(isInitial = false) {
        // Create a single fire particle
        const size = 0.1 + Math.random() * 0.2;
        const geometry = new THREE.SphereGeometry(size, 6, 6);
        
        // Choose from fire colors: yellow -> orange -> red
        const colorChoice = Math.random();
        let color;
        
        if (colorChoice > 0.7) {
            color = 0xffcc00; // Yellow
        } else if (colorChoice > 0.3) {
            color = 0xff6600; // Orange
        } else {
            color = 0xff3300; // Red
        }
        
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7 + Math.random() * 0.3
        });
        
        const particle = new THREE.Mesh(geometry, material);
        
        // Initial position - either at center or spread if initial
        if (isInitial) {
            // Spread particles along the trail for initial creation
            const distance = Math.random() * 1.5;
            particle.position.copy(this.direction.clone().multiplyScalar(-distance));
            
            // Add some randomness to position
            particle.position.x += (Math.random() - 0.5) * 0.3;
            particle.position.y += (Math.random() - 0.5) * 0.3;
            particle.position.z += (Math.random() - 0.5) * 0.3;
            
            // Set random age for initial particles to create a continuous stream
            particle.userData.age = Math.random() * 0.5;
        } else {
            // New particles always start at the center
            particle.position.set(0, 0, 0);
            
            // Add slight random offset
            particle.position.x += (Math.random() - 0.5) * 0.1;
            particle.position.y += (Math.random() - 0.5) * 0.1;
            particle.position.z += (Math.random() - 0.5) * 0.1;
            
            // New particles start with age 0
            particle.userData.age = 0;
        }
        
        // Set random velocity for particle (mostly opposite to travel direction)
        particle.userData.velocity = new THREE.Vector3(
            this.direction.x * -0.5 + (Math.random() - 0.5) * 1,
            this.direction.y * -0.5 + Math.random() * 1,
            this.direction.z * -0.5 + (Math.random() - 0.5) * 1
        );
        
        // Set random lifetime for particle
        particle.userData.lifetime = 0.5 + Math.random() * 0.5;
        
        // Add to particle system
        this.particles.add(particle);
    }
    
    createLight(position) {
        // Create a flickering light source
        const color = this.isPlayerFireball ? 0x00aaff : 0xff5500;
        this.light = new THREE.PointLight(color, 2, 4);
        this.light.position.copy(position);
        this.game.scene.add(this.light);
    }
    
    update(deltaTime) {
        const currentTime = this.game.clock.getElapsedTime();
        const age = currentTime - this.birthTime;
        
        // Move fireball
        const moveAmount = this.direction.clone().multiplyScalar(this.speed * deltaTime);
        this.mesh.position.add(moveAmount);
        
        // Move light with fireball
        this.light.position.copy(this.mesh.position);
        
        // Emit new particles
        if (currentTime - this.lastParticleEmit > this.particleEmitRate) {
            this.emitParticle();
            this.lastParticleEmit = currentTime;
        }
        
        // Update all particles
        this.updateParticles(deltaTime, age);
        
        // Make the fireball light flicker
        this.light.intensity = 1.5 + Math.random() * 1.0;
        
        // Make the core and glow pulse
        const pulseScale = 0.8 + Math.sin(currentTime * 10) * 0.2;
        this.mesh.scale.set(pulseScale, pulseScale, pulseScale);
        
        // Check if fireball has expired
        if (age > this.lifespan) {
            this.game.removeObject(this);
        }
    }
    
    updateParticles(deltaTime, fireballAge) {
        if (!this.particles) return;
        
        // Update each particle
        this.particles.children.forEach((particle, index) => {
            // Update age
            particle.userData.age += deltaTime;
            
            // If particle has exceeded its lifetime, remove it
            if (particle.userData.age > particle.userData.lifetime) {
                this.particles.remove(particle);
                return;
            }
            
            // Calculate life percentage
            const lifePercentage = particle.userData.age / particle.userData.lifetime;
            
            // Move particle based on its velocity
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime * 2));
            
            // Add some upward drift (heat rises)
            particle.position.y += deltaTime * 1.2;
            
            // Add some random movement to simulate turbulence
            particle.position.x += (Math.random() - 0.5) * 0.1 * deltaTime;
            particle.position.z += (Math.random() - 0.5) * 0.1 * deltaTime;
            
            // Scale down as it ages
            const scale = 1 - lifePercentage * 0.7;
            particle.scale.set(scale, scale, scale);
            
            // Fade out as it ages
            particle.material.opacity = 0.8 * (1 - lifePercentage);
            
            // Change color as it ages: yellow -> orange -> red
            if (lifePercentage < 0.3) {
                particle.material.color.set(0xffcc00); // Yellow
            } else if (lifePercentage < 0.7) {
                particle.material.color.set(0xff6600); // Orange
            } else {
                particle.material.color.set(0xff3300); // Red
            }
        });
        
        // If the fireball is nearing the end of its life, fade everything out
        if (fireballAge > this.lifespan * 0.7) {
            const fadeOutPercentage = (fireballAge - this.lifespan * 0.7) / (this.lifespan * 0.3);
            this.mesh.material.opacity = 0.8 * (1 - fadeOutPercentage);
            
            if (this.mesh.children[0]) {
                this.mesh.children[0].material.opacity = 0.4 * (1 - fadeOutPercentage);
            }
            
            this.light.intensity = 2 * (1 - fadeOutPercentage);
        }
    }
} 