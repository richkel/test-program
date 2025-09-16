import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { getVertexShader, getFragmentShader } from '../shaders/AudioVisualizerShaders';

export interface AudioVisualizerHandle {
  getCanvasStream: () => MediaStream | null;
}

interface AudioVisualizerProps {
  width: number;
  height: number;
}

const AudioVisualizer = forwardRef<AudioVisualizerHandle, AudioVisualizerProps>(({ width, height }, ref) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameId = useRef<number>(0);
  const isInitialized = useRef(false);
  const analyserRef = useRef<THREE.AudioAnalyser | null>(null);
  const uniformsRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    getCanvasStream: () => {
      if (rendererRef.current) {
        return rendererRef.current.domElement.captureStream(30);
      }
      return null;
    }
  }));

  const initializeScene = async () => {
    if (isInitialized.current || !mountRef.current) return;
    isInitialized.current = true;

    const currentMount = mountRef.current;
    
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    rendererRef.current = renderer;
    currentMount.appendChild(renderer.domElement);
    
    // Clock & Uniforms
    const clock = new THREE.Clock();
    uniformsRef.current = {
      time: { value: 1.0 }, bass: { value: 0.0 }, mids: { value: 0.0 }, treble: { value: 0.0 },
      displacementAmount: { value: 0.5 }, rippleSpeed: { value: 1.0 },
      brightness: { value: 1.0 }, glow: { value: 1.0 }, shapeType: { value: 0.0 },
      mercuryBaseColor: { value: new THREE.Color('#191926') },
      mercuryReflectionColor: { value: new THREE.Color('#cce6ff') },
      gasBaseColor: { value: new THREE.Color('#1933cc') },
      gasPulseColor: { value: new THREE.Color('#cc1a80') },
      pointLightPosition: { value: new THREE.Vector3() }
    };

    // Lighting
    const ambient = new THREE.AmbientLight(0x555555);
    scene.add(ambient);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(-1, 1, 1);
    scene.add(directionalLight);
    const pointLight = new THREE.PointLight(0xffffff, 50, 100);
    pointLight.position.set(0, 0, 10);
    scene.add(pointLight);

    // 3D Object (Sphere)
    const geometry = new THREE.IcosahedronGeometry(2, 128);
    const material = new THREE.ShaderMaterial({
      uniforms: uniformsRef.current,
      vertexShader: getVertexShader(),
      fragmentShader: getFragmentShader(),
      transparent: true
    });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Animation
    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      if (analyserRef.current) {
        const data = analyserRef.current.getFrequencyData();
        uniformsRef.current.bass.value = (data[2] + data[4]) / 2 / 255;
        uniformsRef.current.mids.value = (data[30] + data[40]) / 2 / 255;
        uniformsRef.current.treble.value = (data[50] + data[60]) / 2 / 255;
      }

      uniformsRef.current.time.value += delta * uniformsRef.current.rippleSpeed.value;
      sphere.rotation.y += 0.001;

      // Update point light position
      pointLight.position.x = Math.sin(elapsedTime * 0.5) * 5;
      pointLight.position.y = Math.cos(elapsedTime * 0.3) * 5;
      pointLight.position.z = 4 + Math.cos(elapsedTime * 0.2) * 2;
      uniformsRef.current.pointLightPosition.value.copy(pointLight.position);

      renderer.render(scene, camera);
    };

    animate();
  };

  const setupAudio = async () => {
    try {
      const listener = new THREE.AudioListener();
      const audio = new THREE.Audio(listener);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      const mediaStreamSource = audio.context.createMediaStreamSource(stream);
      audio.setNodeSource(mediaStreamSource);
      analyserRef.current = new THREE.AudioAnalyser(audio, 128);
      initializeScene();
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full">
      <button 
        onClick={setupAudio}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-xl transition-transform duration-200 hover:scale-105"
      >
        Start Visualizer
      </button>
      <div ref={mountRef} className="w-full h-full" />
    </div>
  );
});

export default AudioVisualizer;
