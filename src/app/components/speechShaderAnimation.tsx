import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const SpeechShaderAnimation: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  let recognition: SpeechRecognition | null = null;

  useEffect(() => {
    // Initialize Three.js
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // Geometry and Shader setup
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { value: 0.0 },
        u_amplitude: { value: 0.0 },
      },
      vertexShader: `
        uniform float u_amplitude;
        varying vec3 vPosition;

        void main() {
          vPosition = position + normal * u_amplitude;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;

        void main() {
          gl_FragColor = vec4( abs(sin(vPosition.x)), abs(sin(vPosition.y)), abs(sin(vPosition.z)), 1.0 );
        }
      `,
    });

    const sphere = new THREE.Mesh(geometry, shaderMaterial);
    scene.add(sphere);

    camera.position.z = 3;

    // Voice recognition setup
    const setupSpeechRecognition = () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }

      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        const amplitude = Math.min(transcript.length / 10, 2.0); // Adjust amplitude based on speech length
        shaderMaterial.uniforms.u_amplitude.value = amplitude;
      };
      recognition.start();
    };

    setupSpeechRecognition();

    // Animation loop
    const animate = () => {
      shaderMaterial.uniforms.u_time.value += 0.05;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      recognition?.stop();
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
};

export default SpeechShaderAnimation;
