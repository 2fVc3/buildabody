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

export class ProceduralTerrain {
  private mesh: Mesh;
  private material: ShaderMaterial;
  private clock: Clock;
  private uniforms: any;

  constructor() {
    this.clock = new Clock();
    
    // Create terrain geometry with high detail
    const geometry = new PlaneGeometry(2000, 2000, 256, 256);
    
    // Terrain shader uniforms
    this.uniforms = {
      time: { value: 0.0 },
      resolution: { value: new Vector2(512, 512) },
      colorSand: { value: new Color(0xffe894) },
      colorGrass: { value: new Color(0x85d534) },
      colorSnow: { value: new Color(0xffffff) },
      colorRock: { value: new Color(0xbfbd8d) },
      colorWater: { value: new Color(0x4db2ff) },
      noiseScale: { value: 0.02 },
      heightScale: { value: 8.0 },
      waterLevel: { value: -0.2 }
    };

    // Advanced procedural terrain shader
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.getVertexShader(),
      fragmentShader: this.getFragmentShader(),
      side: DoubleSide
    });

    this.mesh = new Mesh(geometry, this.material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0;
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
  }

  private getVertexShader(): string {
    return `
      uniform float time;
      uniform float noiseScale;
      uniform float heightScale;
      uniform float waterLevel;
      
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
        
        for(int i = 0; i < 6; i++) {
          value += amplitude * noise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        return value;
      }
      
      // Terrain elevation function
      float terrainElevation(vec2 pos) {
        vec2 warpedPos = pos + fbm(pos * 0.1) * 2.0;
        
        float elevation = 0.0;
        
        // Base terrain
        elevation += fbm(warpedPos * noiseScale) * heightScale;
        
        // Add ridges
        float ridges = abs(noise(warpedPos * noiseScale * 4.0)) * 2.0;
        elevation += ridges;
        
        // Add valleys
        float valleys = -abs(noise(warpedPos * noiseScale * 2.0)) * 1.5;
        elevation += valleys;
        
        // Smooth water areas
        float waterMask = smoothstep(waterLevel - 0.5, waterLevel + 0.5, elevation);
        elevation = mix(waterLevel, elevation, waterMask);
        
        return elevation;
      }
      
      void main() {
        vUv = uv;
        
        // Calculate elevation
        vec2 pos = position.xz;
        float elevation = terrainElevation(pos);
        vElevation = elevation;
        
        // Calculate position
        vec3 newPosition = position;
        newPosition.y = elevation;
        
        // Calculate normal for lighting
        float offset = 0.1;
        float hL = terrainElevation(pos - vec2(offset, 0.0));
        float hR = terrainElevation(pos + vec2(offset, 0.0));
        float hD = terrainElevation(pos - vec2(0.0, offset));
        float hU = terrainElevation(pos + vec2(0.0, offset));
        
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
      uniform vec3 colorSand;
      uniform vec3 colorGrass;
      uniform vec3 colorSnow;
      uniform vec3 colorRock;
      uniform vec3 colorWater;
      uniform float waterLevel;
      
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      varying float vElevation;
      
      // Noise function for texture variation
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
      
      void main() {
        vec3 finalColor = colorSand;
        
        // Water areas
        if (vElevation <= waterLevel + 0.1) {
          float waterDepth = max(0.0, waterLevel - vElevation);
          vec3 shallowWater = mix(colorSand, colorWater, 0.6);
          vec3 deepWater = colorWater;
          finalColor = mix(shallowWater, deepWater, min(1.0, waterDepth * 2.0));
          
          // Add water sparkle
          float sparkle = noise(vPosition.xz * 50.0 + time * 2.0);
          sparkle = pow(max(0.0, sparkle - 0.8), 3.0);
          finalColor += sparkle * 0.3;
        } else {
          // Land areas
          
          // Grass on flat areas above water
          float grassMask = smoothstep(waterLevel + 0.1, waterLevel + 0.5, vElevation);
          float flatness = dot(vNormal, vec3(0, 1, 0));
          grassMask *= smoothstep(0.7, 0.9, flatness);
          finalColor = mix(finalColor, colorGrass, grassMask);
          
          // Rock on steep slopes
          float rockMask = 1.0 - smoothstep(0.5, 0.8, flatness);
          rockMask *= smoothstep(waterLevel + 0.2, waterLevel + 1.0, vElevation);
          finalColor = mix(finalColor, colorRock, rockMask * 0.8);
          
          // Snow on high elevations
          float snowThreshold = 3.0 + noise(vPosition.xz * 0.1) * 1.0;
          float snowMask = smoothstep(snowThreshold - 0.5, snowThreshold + 0.5, vElevation);
          finalColor = mix(finalColor, colorSnow, snowMask);
          
          // Add texture variation
          float textureNoise = noise(vPosition.xz * 20.0) * 0.1;
          finalColor += textureNoise;
        }
        
        // Add distance-based color variation
        float distance = length(vPosition.xz);
        float distanceFactor = min(1.0, distance / 500.0);
        finalColor = mix(finalColor, finalColor * 0.7, distanceFactor * 0.3);
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;
  }

  public update(time: number): void {
    this.uniforms.time.value = time;
  }

  public getMesh(): Mesh {
    return this.mesh;
  }

  public setWaterLevel(level: number): void {
    this.uniforms.waterLevel.value = level;
  }

  public setHeightScale(scale: number): void {
    this.uniforms.heightScale.value = scale;
  }

  public setNoiseScale(scale: number): void {
    this.uniforms.noiseScale.value = scale;
  }
}