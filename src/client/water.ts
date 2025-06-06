import {
  PlaneGeometry,
  Mesh,
  ShaderMaterial,
  Vector2,
  Vector3,
  Color,
  Clock,
  DoubleSide
} from 'three';

export class Water {
  private mesh: Mesh;
  private material: ShaderMaterial;
  private clock: Clock;
  private uniforms: any;

  constructor() {
    this.clock = new Clock();
    
    // Create water geometry
    const geometry = new PlaneGeometry(1000, 1000, 128, 128);
    
    // Water shader uniforms
    this.uniforms = {
      time: { value: 0.0 },
      resolution: { value: new Vector2(512, 512) },
      mouse: { value: new Vector2(0.5, 0.5) },
      waterColor: { value: new Color(0x006994) },
      foamColor: { value: new Color(0xffffff) },
      waveHeight: { value: 1.0 },
      waveSpeed: { value: 1.0 },
      waveFrequency: { value: 0.02 },
      opacity: { value: 0.85 },
      distortion: { value: 0.3 },
      reflection: { value: 0.4 }
    };

    // Beautiful water shader
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      side: DoubleSide
    });

    this.mesh = new Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = -0.2; // Water level
    this.mesh.receiveShadow = true;
  }

  private getVertexShader(): string {
    return `
      uniform float time;
      uniform float waveHeight;
      uniform float waveSpeed;
      uniform float waveFrequency;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vElevation;
      
      // Improved noise function
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }
      
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }
      
      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }
      
      void main() {
        vUv = uv;
        
        // Create multiple wave layers
        vec2 pos = position.xz * waveFrequency;
        float wave1 = sin(pos.x * 2.0 + time * waveSpeed) * 0.5;
        float wave2 = sin(pos.y * 1.5 + time * waveSpeed * 0.8) * 0.3;
        float wave3 = sin((pos.x + pos.y) * 0.8 + time * waveSpeed * 1.2) * 0.2;
        
        // Add noise for realistic water movement
        float noiseValue = fbm(pos + time * 0.1) * 0.3;
        
        // Combine waves
        float elevation = (wave1 + wave2 + wave3 + noiseValue) * waveHeight;
        vElevation = elevation;
        
        // Calculate position
        vec3 newPosition = position;
        newPosition.y += elevation;
        
        // Calculate normal for lighting
        float offset = 0.1;
        float hL = sin((pos.x - offset) * 2.0 + time * waveSpeed) * 0.5;
        float hR = sin((pos.x + offset) * 2.0 + time * waveSpeed) * 0.5;
        float hD = sin((pos.y - offset) * 1.5 + time * waveSpeed * 0.8) * 0.3;
        float hU = sin((pos.y + offset) * 1.5 + time * waveSpeed * 0.8) * 0.3;
        
        vec3 normal = normalize(vec3(hL - hR, 2.0 * offset, hD - hU));
        vNormal = normal;
        
        vPosition = newPosition;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;
  }

  private getFragmentShader(): string {
    return `
      uniform float time;
      uniform vec2 resolution;
      uniform vec2 mouse;
      uniform vec3 waterColor;
      uniform vec3 foamColor;
      uniform float opacity;
      uniform float distortion;
      uniform float reflection;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vElevation;
      
      // Fresnel effect
      float fresnel(vec3 viewDirection, vec3 normal, float power) {
        return pow(1.0 - max(0.0, dot(viewDirection, normal)), power);
      }
      
      // Water caustics
      float caustics(vec2 uv, float time) {
        vec2 p = uv * 8.0;
        float c = 0.0;
        
        for(int i = 0; i < 3; i++) {
          float t = time * 0.5 + float(i) * 2.0;
          vec2 offset = vec2(sin(t), cos(t)) * 0.3;
          c += sin(length(p + offset) * 3.0 - time * 2.0) * 0.3;
        }
        
        return max(0.0, c);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Animated UV distortion for water movement
        vec2 distortedUv = uv + sin(uv * 15.0 + time) * distortion * 0.02;
        
        // Base water color with depth variation
        vec3 color = waterColor;
        
        // Add depth-based color variation
        float depth = max(0.0, -vPosition.y + 0.2);
        color = mix(color, color * 0.4, depth * 0.2);
        
        // Foam on wave peaks
        float foam = smoothstep(0.6, 1.0, vElevation + 0.3);
        color = mix(color, foamColor, foam * 0.8);
        
        // Caustics effect
        float causticsValue = caustics(distortedUv, time);
        color += causticsValue * 0.3 * vec3(0.8, 1.0, 1.0);
        
        // Fresnel reflection
        vec3 viewDirection = normalize(cameraPosition - vPosition);
        float fresnelValue = fresnel(viewDirection, vNormal, 2.0);
        
        // Sky reflection color
        vec3 skyColor = vec3(0.6, 0.8, 1.0);
        color = mix(color, skyColor, fresnelValue * reflection);
        
        // Add sparkles on water surface
        float sparkle = sin(distortedUv.x * 80.0 + time * 3.0) * sin(distortedUv.y * 80.0 + time * 2.0);
        sparkle = pow(max(0.0, sparkle), 8.0);
        color += sparkle * 0.4;
        
        // Distance-based opacity
        float distance = length(vPosition.xz);
        float alpha = opacity * (1.0 - smoothstep(400.0, 500.0, distance));
        
        gl_FragColor = vec4(color, alpha);
      }
    `;
  }

  public update(): void {
    this.uniforms.time.value = this.clock.getElapsedTime();
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public setMousePosition(x: number, y: number): void {
    this.uniforms.mouse.value.set(x, y);
  }

  public setWaveHeight(height: number): void {
    this.uniforms.waveHeight.value = height;
  }

  public setWaveSpeed(speed: number): void {
    this.uniforms.waveSpeed.value = speed;
  }

  public setWaterColor(color: Color): void {
    this.uniforms.waterColor.value.copy(color);
  }
}