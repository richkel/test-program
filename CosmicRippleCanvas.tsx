import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

type RippleShape = 'square' | 'circle' | 'diamond' | 'cross' | 'x' | 'spray';


interface CosmicRippleCanvasProps {
  width?: number;
  height?: number;
  rippleResolution?: number;
  damping?: number;
  rippleRadius?: number;
  rippleStrength?: number;
  shape?: RippleShape;
  paused?: boolean;
}

export interface CosmicRippleCanvasRef {
  getCanvas: () => HTMLCanvasElement | null;
  getCanvasStream: (fps?: number) => MediaStream | undefined;
}

const CosmicRippleCanvas = forwardRef<CosmicRippleCanvasRef, CosmicRippleCanvasProps>(({
  width = 1024,
  height = 1024,
  rippleResolution = 4,
  damping = 0.99,
  rippleRadius = 3,
  rippleStrength = 255,
  shape = 'circle',
  paused = false
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationIdRef = useRef<number>();
  const [rippleShape] = useState<RippleShape>(shape || 'circle');
  
  // Ripple simulation arrays
  const currentRef = useRef<number[]>([]);
  const previousRef = useRef<number[]>([]);
  const colsRef = useRef<number>(0);
  const rowsRef = useRef<number>(0);

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    getCanvasStream: (fps = 30) => {
      if (!canvasRef.current) {
        return undefined;
      }
      return canvasRef.current.captureStream(fps);
    }
  }));

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Setup canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Calculate grid dimensions
    const cols = Math.ceil(width / rippleResolution);
    const rows = Math.ceil(height / rippleResolution);
    colsRef.current = cols;
    rowsRef.current = rows;

    // Initialize buffers
    currentRef.current = new Array(cols * rows).fill(0);
    previousRef.current = new Array(cols * rows).fill(0);

    // Mouse move handler
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      const mouseX = Math.floor((event.clientX - rect.left) * scaleX / rippleResolution);
      const mouseY = Math.floor((event.clientY - rect.top) * scaleY / rippleResolution);

      createRipple(mouseX, mouseY, rippleShape);
    };

    const createRipple = (mouseX: number, mouseY: number, shape: RippleShape) => {
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const previous = previousRef.current;

      switch (shape) {
        case 'square':
          for (let i = -rippleRadius; i < rippleRadius; i++) {
            for (let j = -rippleRadius; j < rippleRadius; j++) {
              if (mouseX + i >= 0 && mouseX + i < cols && mouseY + j >= 0 && mouseY + j < rows) {
                previous[(mouseX + i) + (mouseY + j) * cols] = rippleStrength;
              }
            }
          }
          break;

        case 'circle':
          for (let i = -rippleRadius; i <= rippleRadius; i++) {
            for (let j = -rippleRadius; j <= rippleRadius; j++) {
              const distance = Math.sqrt(i * i + j * j);
              if (distance <= rippleRadius) {
                if (mouseX + i >= 0 && mouseX + i < cols && mouseY + j >= 0 && mouseY + j < rows) {
                  previous[(mouseX + i) + (mouseY + j) * cols] = rippleStrength;
                }
              }
            }
          }
          break;

        case 'diamond':
          for (let i = -rippleRadius; i <= rippleRadius; i++) {
            for (let j = -rippleRadius; j <= rippleRadius; j++) {
              if (Math.abs(i) + Math.abs(j) <= rippleRadius) {
                if (mouseX + i >= 0 && mouseX + i < cols && mouseY + j >= 0 && mouseY + j < rows) {
                  previous[(mouseX + i) + (mouseY + j) * cols] = rippleStrength;
                }
              }
            }
          }
          break;

        case 'cross':
          for (let i = -rippleRadius; i <= rippleRadius; i++) {
            // Horizontal line
            if (mouseX + i >= 0 && mouseX + i < cols && mouseY >= 0 && mouseY < rows) {
              previous[(mouseX + i) + mouseY * cols] = rippleStrength;
            }
            // Vertical line
            if (mouseX >= 0 && mouseX < cols && mouseY + i >= 0 && mouseY + i < rows) {
              previous[mouseX + (mouseY + i) * cols] = rippleStrength;
            }
          }
          break;

        case 'x':
          for (let i = -rippleRadius; i <= rippleRadius; i++) {
            // First diagonal (\)
            if (mouseX + i >= 0 && mouseX + i < cols && mouseY + i >= 0 && mouseY + i < rows) {
              previous[(mouseX + i) + (mouseY + i) * cols] = rippleStrength;
            }
            // Second diagonal (/)
            if (mouseX + i >= 0 && mouseX + i < cols && mouseY - i >= 0 && mouseY - i < rows) {
              previous[(mouseX + i) + (mouseY - i) * cols] = rippleStrength;
            }
          }
          break;

        case 'spray':
          for (let i = -rippleRadius; i <= rippleRadius; i++) {
            for (let j = -rippleRadius; j <= rippleRadius; j++) {
              if (Math.random() > 0.5) {
                if (mouseX + i >= 0 && mouseX + i < cols && mouseY + j >= 0 && mouseY + j < rows) {
                  previous[(mouseX + i) + (mouseY + j) * cols] = rippleStrength;
                }
              }
            }
          }
          break;
      }
    };

    // Animation loop
    const animate = () => {
      if (paused) {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
          animationIdRef.current = undefined;
        }
        return;
      }
      const cols = colsRef.current;
      const rows = rowsRef.current;
      const current = currentRef.current;
      const previous = previousRef.current;

      if (!cols || !rows) {
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }

      // Wave simulation
      for (let i = 1; i < cols - 1; i++) {
        for (let j = 1; j < rows - 1; j++) {
          const index = i + j * cols;
          current[index] =
            (previous[index - 1] +
              previous[index + 1] +
              previous[index - cols] +
              previous[index + cols]) / 2 - current[index];
          current[index] *= damping;
        }
      }

      // Clear canvas with black background
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      // Render ripples as scaled rectangles
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const index = i + j * cols;
          const color = current[index];
          
          if (Math.abs(color) > 1) {
            const x = i * rippleResolution;
            const y = j * rippleResolution;
            
            if (color > 0) {
              // Positive ripples - cyan/blue
              const intensity = Math.min(255, Math.abs(color));
              ctx.fillStyle = `rgb(0, ${intensity}, ${intensity})`;
            } else {
              // Negative ripples - red/magenta
              const intensity = Math.min(255, Math.abs(color));
              ctx.fillStyle = `rgb(${intensity}, 0, ${intensity})`;
            }
            
            ctx.fillRect(x, y, rippleResolution, rippleResolution);
          }
        }
      }

      // Swap buffers
      const temp = previousRef.current;
      previousRef.current = currentRef.current;
      currentRef.current = temp;

      animationIdRef.current = requestAnimationFrame(animate);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [width, height, rippleResolution, damping, rippleRadius, rippleStrength, rippleShape, paused]);

  return (
    <div className="w-full h-full flex flex-col bg-black">
      <canvas
        ref={canvasRef}
        className="w-full flex-1 object-contain cursor-none"
        style={{
          imageRendering: 'pixelated',
          width: `${width}px`,
          height: `${height}px`
        }}
      />
      <div className="bg-gray-900 p-2 border-t border-gray-700 text-center">
        <div className="text-white text-xs">
          Move mouse to create ripples
        </div>
      </div>
    </div>
  );
});

export default CosmicRippleCanvas;
