import { ShaderMaterial, Color } from 'three';

export class GroundShader {
  public static createMaterial(): ShaderMaterial {
    return new ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        grassColor: { value: new Color(0x4a7c59) },
        dirtColor: { value: new Color(0x8b4513) },
        distance: { value: 0.0 },
        wetness: { value: 0.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vDistance;
        
        void main() {
          vUv = uv;
          vPosition = position;
          vNormal = normal;
          vDistance = length(position.xz);
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 grassColor;
        uniform vec3 dirtColor;
        uniform float distance;
        uniform float wetness;
        
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying float vDistance;
        
        // Noise function
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
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
          vec2 uv = vUv * 50.0; // Scale for detail
          
          // Base grass/dirt mix
          float grassMask = fbm(uv + time * 0.01);
          grassMask = smoothstep(0.3, 0.7, grassMask);
          
          vec3 color = mix(dirtColor, grassColor, grassMask);
          
          // Add texture variation
          float detail = fbm(uv * 4.0) * 0.2;
          color += detail;
          
          // Wetness near water
          float waterDistance = max(0.0, 20.0 - vDistance);
          float wet = waterDistance / 20.0 * wetness;
          color = mix(color, color * 0.6, wet);
          
          // Distance-based color variation
          float distanceFactor = min(1.0, vDistance / 100.0);
          color = mix(color, color * 0.8, distanceFactor * 0.3);
          
          // Add some sparkle to wet areas
          if(wet > 0.1) {
            float sparkle = noise(uv * 20.0 + time);
            sparkle = pow(max(0.0, sparkle - 0.8), 3.0);
            color += sparkle * wet * 0.3;
          }
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  }
}