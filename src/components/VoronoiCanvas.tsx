import React, { useEffect, useCallback, useRef } from 'react';
import type { VoronoiDiagram, CanvasTransform } from '../types';
import { drawDiagram, drawBackground, drawGrid } from '../lib/canvas';

interface Props {
  diagram: VoronoiDiagram | null;
  transform: CanvasTransform;
  showSites: boolean;
  showEdges: boolean;
  showDelaunay: boolean;
  showCentroids: boolean;
  showCellFill: boolean;
  darkMode: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: (e: React.MouseEvent<HTMLCanvasElement>) => void;
}

export const VoronoiCanvas: React.FC<Props> = ({
  diagram,
  transform,
  showSites,
  showEdges,
  showDelaunay,
  showCentroids,
  showCellFill,
  darkMode,
  canvasRef,
  onMouseDown,
  onMouseMove,
  onMouseUp,
}) => {
  const animFrameRef = useRef<number | null>(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBackground(ctx, darkMode);

    if (diagram) {
      drawGrid(ctx, transform, darkMode, diagram.bounds);
      drawDiagram(ctx, diagram, transform, {
        showSites,
        showEdges,
        showDelaunay,
        showCentroids,
        showCellFill,
        darkMode,
      });
    }
  }, [diagram, transform, showSites, showEdges, showDelaunay, showCentroids, showCellFill, darkMode, canvasRef]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      canvas.width = width * devicePixelRatio;
      canvas.height = height * devicePixelRatio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(devicePixelRatio, devicePixelRatio);
    });
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [canvasRef]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => e.preventDefault(), []);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={handleContextMenu}
      className="w-full h-full cursor-crosshair select-none block"
      aria-label="Voronoi diagram canvas — click to add points, right-click to remove, scroll to zoom"
      role="img"
    />
  );
};
