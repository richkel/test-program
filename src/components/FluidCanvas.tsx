import React, { useRef, useEffect } from 'react';
import {
  init,
  config,
  pointers,
  splatStack,
  updatePointerDownData,
  updatePointerMoveData,
  updatePointerUpData,
  multipleSplats
} from '../lib/fluid-simulation.js';

const FluidCanvas: React.FC = React.forwardRef<HTMLCanvasElement>((props, ref) => {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = ref || internalCanvasRef;

  useEffect(() => {
    const canvas = (canvasRef as React.RefObject<HTMLCanvasElement>).current;
    if (canvas) {
      init(canvas);

      const handleMouseDown = (e: MouseEvent) => {
        const pointer = pointers.find(p => p.id === -1);
        if (pointer) {
          updatePointerDownData(pointer, -1, e.offsetX, e.offsetY);
        }
      };

      const handleMouseMove = (e: MouseEvent) => {
        const pointer = pointers[0];
        if (pointer.down) {
          updatePointerMoveData(pointer, e.offsetX, e.offsetY);
        }
      };

      const handleMouseUp = () => {
        updatePointerUpData(pointers[0]);
      };

      const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        const touches = e.targetTouches;
        while (touches.length >= pointers.length) {
          pointers.push(new pointerPrototype());
        }
        for (let i = 0; i < touches.length; i++) {
          const rect = canvas.getBoundingClientRect();
          let posX = touches[i].clientX - rect.left;
          let posY = touches[i].clientY - rect.top;
          updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        e.preventDefault();
        const touches = e.targetTouches;
        for (let i = 0; i < touches.length; i++) {
          let pointer = pointers[i + 1];
          if (!pointer.down) continue;
          const rect = canvas.getBoundingClientRect();
          let posX = touches[i].clientX - rect.left;
          let posY = touches[i].clientY - rect.top;
          updatePointerMoveData(pointer, posX, posY);
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        const touches = e.changedTouches;
        for (let i = 0; i < touches.length; i++) {
          let pointer = pointers.find(p => p.id === touches[i].identifier);
          if (pointer == null) continue;
          updatePointerUpData(pointer);
        }
      };

      canvas.addEventListener('mousedown', handleMouseDown);
      canvas.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);

      return () => {
        canvas.removeEventListener('mousedown', handleMouseDown);
        canvas.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [canvasRef]);

  return <canvas ref={canvasRef as React.RefObject<HTMLCanvasElement>} style={{ width: '100%', height: '100%', display: 'block' }} />;
});

export default FluidCanvas;
