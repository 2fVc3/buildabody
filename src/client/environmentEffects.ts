import {
  Scene,
  Mesh,
  SphereGeometry,
  ShaderMaterial,
  Vector3,
  Color,
  AdditiveBlending,
  CylinderGeometry,
  MeshLambertMaterial,
  BoxGeometry,
  TorusGeometry,
  ConeGeometry
} from 'three';

export class EnvironmentEffects {
  private scene: Scene;
  private particles: Mesh[] = [];
  private bubbles: Mesh[] = [];
  private fireflies: Mesh[] = [];

  constructor(scene: Scene) {
    this.scene = scene;
    this.createParticleEffects();
    this.createBubbles();
    this.createFireflies();
  }

  private createParticleEffects(): void {
    // Create floating particles for atmosphere
    const particleGeometry = new SphereGeometry(0.02, 8, 6);
    
    for (let i = 0; i < 100; i++) {
      const particleMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          opacity: { value: Math.random() * 0.5 + 0.2 },
          color: { value: new Color().setHSL(Math.random(), 0.5, 0.8) }
        },
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.y += sin(time + position.x * 10.0) * 0.1;
            pos.x += cos(time + position.z * 8.0) * 0.05;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float opacity;
          uniform vec3 color;
          varying vec2 vUv;
          
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(color, alpha * opacity);
          }
        `,
        transparent: true,
        blending: AdditiveBlending
      });

      const particle = new Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        (Math.random() - 0.5) * 200,
        Math.random() * 20 + 2,
        (Math.random() - 0.5) * 200
      );
      
      this.particles.push(particle);
      this.scene.add(particle);
    }
  }

  private createBubbles(): void {
    // Water bubbles that rise from the pond
    const bubbleGeometry = new SphereGeometry(0.1, 8, 6);
    
    for (let i = 0; i < 30; i++) {
      const bubbleMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          opacity: { value: 0.3 }
        },
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            pos.y += time * 2.0;
            pos.x += sin(time * 3.0 + position.y * 0.1) * 0.2;
            pos.z += cos(time * 2.5 + position.y * 0.1) * 0.2;
            
            // Reset when too high
            if(pos.y > 15.0) {
              pos.y = -2.0;
            }
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float opacity;
          varying vec2 vUv;
          
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(0.8, 0.9, 1.0, alpha * opacity);
          }
        `,
        transparent: true
      });

      const bubble = new Mesh(bubbleGeometry, bubbleMaterial);
      bubble.position.set(
        (Math.random() - 0.5) * 40,
        Math.random() * 10 - 2,
        (Math.random() - 0.5) * 40
      );
      
      this.bubbles.push(bubble);
      this.scene.add(bubble);
    }
  }

  private createFireflies(): void {
    // Magical fireflies for evening ambiance
    const fireflyGeometry = new SphereGeometry(0.05, 6, 4);
    
    for (let i = 0; i < 20; i++) {
      const fireflyMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          intensity: { value: Math.random() * 0.5 + 0.5 },
          color: { value: new Color().setHSL(0.15, 0.8, 0.6) } // Warm yellow
        },
        vertexShader: `
          uniform float time;
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            vec3 pos = position;
            
            // Floating motion
            pos.y += sin(time * 2.0 + position.x * 5.0) * 0.3;
            pos.x += cos(time * 1.5 + position.z * 3.0) * 0.2;
            pos.z += sin(time * 1.8 + position.x * 4.0) * 0.2;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform float intensity;
          uniform vec3 color;
          varying vec2 vUv;
          
          void main() {
            float dist = distance(vUv, vec2(0.5));
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            
            // Pulsing effect
            float pulse = sin(time * 4.0) * 0.3 + 0.7;
            alpha *= pulse * intensity;
            
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
        blending: AdditiveBlending
      });

      const firefly = new Mesh(fireflyGeometry, fireflyMaterial);
      firefly.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 8 + 3,
        (Math.random() - 0.5) * 60
      );
      
      this.fireflies.push(firefly);
      this.scene.add(firefly);
    }
  }

  public update(time: number): void {
    // Update particle effects
    this.particles.forEach(particle => {
      const material = particle.material as ShaderMaterial;
      material.uniforms.time.value = time;
    });

    this.bubbles.forEach(bubble => {
      const material = bubble.material as ShaderMaterial;
      material.uniforms.time.value = time;
    });

    this.fireflies.forEach(firefly => {
      const material = firefly.material as ShaderMaterial;
      material.uniforms.time.value = time;
    });
  }

  public createDistanceBasedEffects(distance: number, frogPosition: Vector3): void {
    // Create special effects based on distance traveled
    if (distance > 100 && Math.random() < 0.1) {
      this.createMagicSparkle(frogPosition);
    }
    
    if (distance > 300 && Math.random() < 0.05) {
      this.createPortalEffect(frogPosition);
    }
    
    if (distance > 500 && Math.random() < 0.03) {
      this.createRainbowTrail(frogPosition);
    }
  }

  private createMagicSparkle(position: Vector3): void {
    const sparkleGeometry = new SphereGeometry(0.1, 8, 6);
    const sparkleMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color: { value: new Color().setHSL(Math.random(), 0.8, 0.8) }
      },
      vertexShader: `
        uniform float time;
        void main() {
          vec3 pos = position;
          pos += sin(time * 10.0) * 0.1;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        void main() {
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true,
      blending: AdditiveBlending
    });

    const sparkle = new Mesh(sparkleGeometry, sparkleMaterial);
    sparkle.position.copy(position);
    sparkle.position.y += Math.random() * 5;
    this.scene.add(sparkle);

    // Remove after animation
    setTimeout(() => {
      this.scene.remove(sparkle);
    }, 2000);
  }

  private createPortalEffect(position: Vector3): void {
    const portalGeometry = new TorusGeometry(3, 0.5, 8, 16);
    const portalMaterial = new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        color1: { value: new Color(0x9370DB) },
        color2: { value: new Color(0xFF1493) }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.y += sin(time * 5.0) * 0.2;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color1;
        uniform vec3 color2;
        varying vec2 vUv;
        
        void main() {
          float pattern = sin(vUv.x * 10.0 + time * 3.0) * sin(vUv.y * 10.0 + time * 2.0);
          vec3 color = mix(color1, color2, pattern * 0.5 + 0.5);
          gl_FragColor = vec4(color, 0.7);
        }
      `,
      transparent: true,
      blending: AdditiveBlending
    });

    const portal = new Mesh(portalGeometry, portalMaterial);
    portal.position.copy(position);
    portal.position.y += 5;
    portal.rotation.x = Math.PI / 2;
    this.scene.add(portal);

    // Animate and remove
    let startTime = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      portalMaterial.uniforms.time.value = elapsed;
      portal.rotation.z += 0.05;
      
      if (elapsed < 3) {
        requestAnimationFrame(animate);
      } else {
        this.scene.remove(portal);
      }
    };
    animate();
  }

  private createRainbowTrail(position: Vector3): void {
    for (let i = 0; i < 10; i++) {
      const trailGeometry = new SphereGeometry(0.2, 8, 6);
      const trailMaterial = new ShaderMaterial({
        uniforms: {
          time: { value: 0.0 },
          hue: { value: i / 10 }
        },
        vertexShader: `
          uniform float time;
          void main() {
            vec3 pos = position;
            pos.y += sin(time * 3.0 + position.x) * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          uniform float hue;
          void main() {
            vec3 color = vec3(
              sin(hue * 6.28) * 0.5 + 0.5,
              sin(hue * 6.28 + 2.09) * 0.5 + 0.5,
              sin(hue * 6.28 + 4.18) * 0.5 + 0.5
            );
            gl_FragColor = vec4(color, 0.8);
          }
        `,
        transparent: true,
        blending: AdditiveBlending
      });

      const trail = new Mesh(trailGeometry, trailMaterial);
      trail.position.copy(position);
      trail.position.x += (Math.random() - 0.5) * 10;
      trail.position.z += (Math.random() - 0.5) * 10;
      trail.position.y += Math.random() * 8;
      this.scene.add(trail);

      // Remove after delay
      setTimeout(() => {
        this.scene.remove(trail);
      }, 3000 + i * 200);
    }
  }
}