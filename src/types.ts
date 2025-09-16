export type Status = {
  state: 'idle' | 'connecting' | 'active' | 'error';
  message: string;
};

export type InputSource = 'webcam' | '3d_shapes' | 'cosmic_ripples' | 'audio_visualizer';

export type AudioVisualizerConfig = {
  displacement: number;
  rippleSpeed: number;
  brightness: number;
  glow: number;
  shapeType: number;
  mercuryBaseColor: string;
  mercuryReflectionColor: string;
  gasBaseColor: string;
  gasPulseColor: string;
};
