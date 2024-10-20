// components/WavyShader.js
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function WavyShader() {
  const canvasRef = useRef();

  useEffect(() => {
    // Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Plane Geometry (for the wavy shader effect)
    const geometry = new THREE.PlaneGeometry(5, 5, 64, 64);

    // Custom Shader Material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        u_time: { type: 'f', value: 0.0 },
      },
      vertexShader: `
        uniform float u_time;
        varying vec2 vUv;

        void main() {
          vUv = uv;
          vec3 pos = position;
          pos.z = sin(uv.x * 10.0 + u_time * 2.0) * 0.2; // Wavy effect
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;

        void main() {
          gl_FragColor = vec4(vUv.x, 0.2, vUv.y, 1.0);
        }
      `,
      wireframe: true, // optional for a nice wireframe effect
    });

    // Mesh
    const plane = new THREE.Mesh(geometry, material);
    scene.add(plane);

    camera.position.z = 3;

    // Animation loop
    const animate = () => {
      material.uniforms.u_time.value += 0.05;
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Clean up
    return () => {
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef}></canvas>;
}
