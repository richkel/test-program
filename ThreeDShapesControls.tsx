import React from 'react';
import { Box, Circle, Triangle, Hexagon, RotateCcw, Play, Pause, Sliders } from 'lucide-react';
import { ShapeType } from '../../types/daydream.types';

export interface ThreeDShapesConfig {
  isAnimating: boolean;
  rotationSpeed: number;
  currentShape: ShapeType;
  shapeSize: number;
  shapeColor: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  ambientIntensity: number;
  directionalIntensity: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

interface ThreeDShapesControlsProps {
  config: ThreeDShapesConfig;
  onConfigChange: (newConfig: Partial<ThreeDShapesConfig>) => void;
  onReset: () => void;
}

const ThreeDShapesControls: React.FC<ThreeDShapesControlsProps> = ({ config, onConfigChange, onReset }) => {
  const handleValueChange = (key: keyof ThreeDShapesConfig, value: any) => {
    onConfigChange({ [key]: value });
  };

  const shapeOptions: { type: ShapeType; icon: React.ElementType; label: string }[] = [
    { type: 'cube', icon: Box, label: 'Cube' },
    { type: 'sphere', icon: Circle, label: 'Sphere' },
    { type: 'cylinder', icon: Circle, label: 'Cylinder' },
    { type: 'cone', icon: Triangle, label: 'Cone' },
    { type: 'torus', icon: Circle, label: 'Torus' },
    { type: 'icosahedron', icon: Hexagon, label: 'Icosahedron' },
    { type: 'dodecahedron', icon: Hexagon, label: 'Dodecahedron' },
    { type: 'octahedron', icon: Triangle, label: 'Octahedron' },
  ];

  return (
    <div className="p-4 space-y-4 bg-gray-800 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders size={16} />
          <h3 className="text-lg font-semibold">3D Shape Controls</h3>
        </div>
        <button
          onClick={() => handleValueChange('isAnimating', !config.isAnimating)}
          className={`p-2 rounded ${config.isAnimating ? 'bg-red-500' : 'bg-green-500'}`}
        >
          {config.isAnimating ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Shape Type</label>
        <div className="grid grid-cols-4 gap-2">
          {shapeOptions.map(({ type, icon: Icon }) => (
            <button
              key={type}
              onClick={() => handleValueChange('currentShape', type)}
              className={`p-2 rounded flex items-center justify-center ${config.currentShape === type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              <Icon size={20} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Shape Color</label>
        <input
          type="color"
          value={config.shapeColor}
          onChange={(e) => handleValueChange('shapeColor', e.target.value)}
          className="w-full h-10 p-1 bg-gray-700 border border-gray-600 rounded"
        />
      </div>

      {[ 
        { id: 'shapeSize', label: 'Size', min: 0.1, max: 5, step: 0.1 },
        { id: 'rotationSpeed', label: 'Rotation Speed', min: 0, max: 5, step: 0.1 },
        { id: 'metalness', label: 'Metalness', min: 0, max: 1, step: 0.05 },
        { id: 'roughness', label: 'Roughness', min: 0, max: 1, step: 0.05 },
        { id: 'ambientIntensity', label: 'Ambient Light', min: 0, max: 2, step: 0.1 },
        { id: 'directionalIntensity', label: 'Directional Light', min: 0, max: 2, step: 0.1 },
      ].map(({ id, label, min, max, step }) => (
        <div key={id}>
            <label htmlFor={id} className="block text-sm font-medium capitalize">{label}</label>
            <input
                id={id}
                type="range"
                min={min}
                max={max}
                step={step}
                value={config[id as keyof ThreeDShapesConfig]}
                onChange={(e) => handleValueChange(id as keyof ThreeDShapesConfig, parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
        </div>
      ))}

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 p-2 bg-gray-600 hover:bg-gray-500 rounded"
      >
        <RotateCcw size={16} />
        Reset to Defaults
      </button>
    </div>
  );
};

export default ThreeDShapesControls;
