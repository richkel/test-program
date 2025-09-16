import React from 'react';

interface AudioVisualizerConfig {
  displacement: number;
  rippleSpeed: number;
  brightness: number;
  glow: number;
  shapeType: number;
  mercuryBaseColor: string;
  mercuryReflectionColor: string;
  gasBaseColor: string;
  gasPulseColor: string;
}

interface AudioVisualizerControlsProps {
  config: AudioVisualizerConfig;
  onConfigChange: (newConfig: Partial<AudioVisualizerConfig>) => void;
}

const AudioVisualizerControls: React.FC<AudioVisualizerControlsProps> = ({ 
  config, 
  onConfigChange 
}) => {
  return (
    <div className="glass p-4 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold">Audio Visualizer Controls</h3>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium">Visual Type</label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input 
              type="radio" 
              name="shapeType" 
              checked={config.shapeType === 0}
              onChange={() => onConfigChange({ shapeType: 0 })}
              className="mr-2"
            />
            Mercury
          </label>
          <label className="flex items-center">
            <input 
              type="radio" 
              name="shapeType" 
              checked={config.shapeType === 1}
              onChange={() => onConfigChange({ shapeType: 1 })}
              className="mr-2"
            />
            Gas Cloud
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Displacement: {config.displacement.toFixed(2)}
          </label>
        </div>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={config.displacement}
          onChange={(e) => onConfigChange({ displacement: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Ripple Speed: {config.rippleSpeed.toFixed(1)}
          </label>
        </div>
        <input 
          type="range" 
          min="0" 
          max="5" 
          step="0.1" 
          value={config.rippleSpeed}
          onChange={(e) => onConfigChange({ rippleSpeed: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Brightness: {config.brightness.toFixed(2)}
          </label>
        </div>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.05" 
          value={config.brightness}
          onChange={(e) => onConfigChange({ brightness: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="block text-sm font-medium">
            Glow: {config.glow.toFixed(2)}
          </label>
        </div>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.05" 
          value={config.glow}
          onChange={(e) => onConfigChange({ glow: parseFloat(e.target.value) })}
          className="w-full"
        />
      </div>

      {config.shapeType === 0 ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Mercury Colors</label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Base</span>
            <input 
              type="color" 
              value={config.mercuryBaseColor}
              onChange={(e) => onConfigChange({ mercuryBaseColor: e.target.value })}
              className="w-8 h-8 p-0 border-none rounded bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Reflection</span>
            <input 
              type="color" 
              value={config.mercuryReflectionColor}
              onChange={(e) => onConfigChange({ mercuryReflectionColor: e.target.value })}
              className="w-8 h-8 p-0 border-none rounded bg-transparent"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Gas Cloud Colors</label>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">Base</span>
            <input 
              type="color" 
              value={config.gasBaseColor}
              onChange={(e) => onConfigChange({ gasBaseColor: e.target.value })}
              className="w-8 h-8 p-0 border-none rounded bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Pulse</span>
            <input 
              type="color" 
              value={config.gasPulseColor}
              onChange={(e) => onConfigChange({ gasPulseColor: e.target.value })}
              className="w-8 h-8 p-0 border-none rounded bg-transparent"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioVisualizerControls;
