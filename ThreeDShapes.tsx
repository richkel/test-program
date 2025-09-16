import { useRef, useEffect, forwardRef, useImperativeHandle, useState, ForwardedRef } from 'react';
import * as THREE from 'three';
import { ThreeDShapesHandle } from '../types/unified.types';
import { InputSourceStatus } from '../types/daydream.types';
import { ThreeDShapesConfig } from './controls/ThreeDShapesControls';
import { ShapeType } from '../types/daydream.types';

export interface ThreeDShapesProps {
  width?: number;
  height?: number;
  onStreamReady?: (stream: MediaStream) => void;
  onStatusChange?: (status: InputSourceStatus) => void;
  className?: string;
  config: ThreeDShapesConfig;
}

const ThreeDShapes = forwardRef<ThreeDShapesHandle, ThreeDShapesProps>((
  { 
    width = 512, 
    height = 512,
    onStreamReady,
    onStatusChange,
    config,
    className
  },
  ref: ForwardedRef<ThreeDShapesHandle>
) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  const { 
    isAnimating, rotationSpeed, currentShape, shapeSize, shapeColor, 
    metalness, roughness, emissive, emissiveIntensity, ambientIntensity, 
    directionalIntensity, rotationX, rotationY, rotationZ 
  } = config;

  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const createGeometry = (shapeType: ShapeType, size: number): THREE.BufferGeometry => {
    switch (shapeType) {
      case 'cube': return new THREE.BoxGeometry(size, size, size);
      case 'sphere': return new THREE.SphereGeometry(size * 0.8, 32, 32);
      case 'cylinder': return new THREE.CylinderGeometry(size * 0.6, size * 0.6, size * 1.2, 32);
      case 'cone': return new THREE.ConeGeometry(size * 0.6, size * 1.2, 32);
      case 'torus': return new THREE.TorusGeometry(size * 0.6, size * 0.2, 16, 100);
      case 'icosahedron': return new THREE.IcosahedronGeometry(size * 0.8, 0);
      case 'dodecahedron': return new THREE.DodecahedronGeometry(size * 0.8, 0);
      case 'octahedron': return new THREE.OctahedronGeometry(size * 0.8, 0);
      default: return new THREE.BoxGeometry(size, size, size);
    }
  };

  useImperativeHandle(ref, () => ({
    getCanvasStream: () => canvasRef.current?.captureStream(30) || null,
    getCanvas: () => canvasRef.current
  }));

  useEffect(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    canvasRef.current = renderer.domElement;
    currentMount.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, ambientIntensity);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, directionalIntensity);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const handleMouseDown = (event: MouseEvent) => {
      setIsDragging(true);
      setLastMousePos({ x: event.clientX, y: event.clientY });
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = event.clientX - lastMousePos.x;
      const deltaY = event.clientY - lastMousePos.y;
      setRotation(prev => ({ x: prev.x + deltaY * 0.01, y: prev.y + deltaX * 0.01 }));
      setLastMousePos({ x: event.clientX, y: event.clientY });
    };

    const handleMouseUp = () => setIsDragging(false);

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);
      if (meshRef.current) {
        if (isAnimating && !isDragging) {
          meshRef.current.rotation.x += rotationX * rotationSpeed;
          meshRef.current.rotation.y += rotationY * rotationSpeed;
          meshRef.current.rotation.z += rotationZ * rotationSpeed;
        } else {
          meshRef.current.rotation.x = rotation.x;
          meshRef.current.rotation.y = rotation.y;
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    onStatusChange?.({ source: 'shapes', status: 'initializing' });

    if (onStreamReady) {
      const stream = renderer.domElement.captureStream(30);
      onStreamReady(stream);
    }
    onStatusChange?.({ source: 'shapes', status: 'active' });

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [width, height, onStreamReady, isAnimating, rotationSpeed, rotationX, rotationY, rotationZ, rotation.x, rotation.y]);

  useEffect(() => {
    if (!sceneRef.current) return;

    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      (meshRef.current.material as THREE.Material).dispose();
    }

    const geometry = createGeometry(currentShape, shapeSize);
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(shapeColor),
      metalness,
      roughness,
      emissive: new THREE.Color(emissive),
      emissiveIntensity
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    sceneRef.current.add(mesh);

  }, [currentShape, shapeSize, shapeColor, metalness, roughness, emissive, emissiveIntensity]);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.children.forEach(child => {
      if (child instanceof THREE.AmbientLight) child.intensity = ambientIntensity;
      if (child instanceof THREE.DirectionalLight) child.intensity = directionalIntensity;
    });
  }, [ambientIntensity, directionalIntensity]);

  return (
    <div ref={mountRef} className={`w-full h-full relative ${className || ''}`} />
  );
});

ThreeDShapes.displayName = 'ThreeDShapes';

export default ThreeDShapes;
