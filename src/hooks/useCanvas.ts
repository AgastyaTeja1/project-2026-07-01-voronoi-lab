import { useRef, useEffect, useCallback, useState } from 'react';
import type { CanvasTransform } from '../types';

interface UseCanvasOptions {
  onMouseDown?: (x: number, y: number, button: number) => void;
  onMouseMove?: (x: number, y: number) => void;
  onMouseUp?: () => void;
}

export function useCanvas(opts: UseCanvasOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState<CanvasTransform>({ offsetX: 0, offsetY: 0, scale: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const _draggedSite = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setTransform((t) => {
        const newScale = Math.max(0.1, Math.min(20, t.scale * factor));
        return {
          scale: newScale,
          offsetX: mx - (mx - t.offsetX) * (newScale / t.scale),
          offsetY: my - (my - t.offsetY) * (newScale / t.scale),
        };
      });
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      lastPos.current = { x, y };
      _draggedSite.current = false;

      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        // Middle mouse or Alt+click = pan
        isDragging.current = true;
      } else {
        opts.onMouseDown?.(x, y, e.button);
      }
    },
    [opts]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (isDragging.current) {
        const dx = x - lastPos.current.x;
        const dy = y - lastPos.current.y;
        setTransform((t) => ({ ...t, offsetX: t.offsetX + dx, offsetY: t.offsetY + dy }));
      }

      lastPos.current = { x, y };
      opts.onMouseMove?.(x, y);
    },
    [opts]
  );

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      isDragging.current = false;
      opts.onMouseUp?.();
    },
    [opts]
  );

  const resetTransform = useCallback(() => {
    setTransform({ offsetX: 0, offsetY: 0, scale: 1 });
  }, []);

  return {
    canvasRef,
    transform,
    setTransform,
    resetTransform,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
