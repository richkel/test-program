import { useState, useRef } from 'react';
import { InputSource, AudioVisualizerConfig } from './types';
import AudioVisualizer from './components/AudioVisualizer';
import FluidCanvas from './components/FluidCanvas';

const DEFAULT_AUDIO_VISUALIZER_CONFIG: AudioVisualizerConfig = {
  displacement: 0.5,
  rippleSpeed: 1.0,
  brightness: 1.0,
  glow: 1.0,
  shapeType: 0,
  mercuryBaseColor: '#191926',
  mercuryReflectionColor: '#cce6ff',
  gasBaseColor: '#1933cc',
  gasPulseColor: '#cc1a80'
};

function App() {
  const [inputSource, setInputSource] = useState<InputSource>('webcam');
  const [audioVisualizerConfig, setAudioVisualizerConfig] = useState<AudioVisualizerConfig>(DEFAULT_AUDIO_VISUALIZER_CONFIG);
  const audioVisualizerRef = useRef<any>(null);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-2xl font-bold">StreamDiffusion Studio</h1>
        <a href="/studio" className="text-blue-400 hover:text-blue-300">Go to Studio</a>
      </header>

      <main className="p-4">
        <div className="mb-4">
          <label>Input Source: </label>
          <select 
            value={inputSource} 
            onChange={(e) => setInputSource(e.target.value as InputSource)}
            className="bg-gray-700 text-white p-2 rounded"
          >
            <option value="webcam">Webcam</option>
            <option value="3d_shapes">3D Shapes</option>
            <option value="cosmic_ripples">Cosmic Ripples</option>
            <option value="audio_visualizer">Audio Visualizer</option>
            <option value="fluid">Fluid</option>
          </select>
        </div>

        <div className="w-full h-96 bg-gray-800 rounded-lg overflow-hidden">
          {inputSource === 'audio_visualizer' && (
            <AudioVisualizer 
              ref={audioVisualizerRef} 
              config={audioVisualizerConfig} 
            />
          )}
          {inputSource === 'fluid' && (
            <FluidCanvas />
          )}
          {inputSource !== 'audio_visualizer' && inputSource !== 'fluid' && (
            <div className="flex items-center justify-center h-full">
              {inputSource} input will be displayed here
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
