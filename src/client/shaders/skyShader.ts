import { ShaderMaterial, Vector3, Color } from 'three';

export class SkyShader {
  public static createMaterial(): ShaderMaterial {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        sunPosition: { value: new Vector3(0, 1, 0) },
        skyColor: { value: new Color(0x87CEEB) },
        horizonColor: { value: new Color(0xFFE4B5) },
        sunColor: { value: new Color(0xFFFFAA) },
        cloudiness: { value: 0.3 },
        turbulence: { value: 0.1 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 sunPosition;
        uniform vec3 skyColor;
        uniform vec3 horizonColor;
        uniform vec3 sunColor;
        uniform float cloudiness;
        uniform float turbulence;
        
        varying vec3 vWorldPosition;
        varying vec2 vUv;
        
        // Noise functions
        float noise(vec2 p) {
          return sin(p.x * 10.0) * sin(p.y * 10.0);
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
          vec3 direction = normalize(vWorldPosition);
          float elevation = direction.y;
          
          // Sky gradient
          vec3 color = mix(horizonColor, skyColor, max(0.0, elevation));
          
          // Sun
          float sunDistance = distance(direction, normalize(sunPosition));
          float sunIntensity = 1.0 - smoothstep(0.0, 0.1, sunDistance);
          color = mix(color, sunColor, sunIntensity * 0.8);
          
          // Sun glow
          float sunGlow = 1.0 - smoothstep(0.0, 0.3, sunDistance);
          color += sunColor * sunGlow * 0.3;
          
          // Clouds
          vec2 cloudUv = direction.xz / (direction.y + 0.1) + time * 0.01;
          float cloudNoise = fbm(cloudUv * 2.0 + time * 0.02);
          cloudNoise = smoothstep(0.4, 0.8, cloudNoise);
          
          vec3 cloudColor = mix(vec3(1.0), vec3(0.8, 0.8, 0.9), elevation);
          color = mix(color, cloudColor, cloudNoise * cloudiness);
          
          // Atmospheric scattering
          float scatter = pow(max(0.0, 1.0 - elevation), 2.0);
          color = mix(color, horizonColor, scatter * 0.3);
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }
}