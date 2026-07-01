import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { VoronoiCanvas } from './components/VoronoiCanvas';
import { InfoBar } from './components/InfoBar';
import { WelcomeModal } from './components/WelcomeModal';
import { useVoronoi } from './hooks/useVoronoi';
import { useCanvas } from './hooks/useCanvas';
import { screenToWorld, exportToPNG, exportToSVG, imageMosaic } from './lib/canvas';
import type { CanvasTransform, Rect } from './types';

const BOUNDS: Rect = { x: 0, y: 0, width: 1200, height: 800 };

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [showWelcome, setShowWelcome] = useState(true);

  const {
    sites,
    diagram,
    settings,
    lloydStep,
    generate,
    addSite,
    removeSiteAt,
    stepLloyd,
    startLloydAnimation,
    stopLloydAnimation,
    updateSettings,
  } = useVoronoi(BOUNDS);

  // Use a ref so handleMouseDown always has the latest transform
  const transformRef = useRef<CanvasTransform>({ offsetX: 0, offsetY: 0, scale: 1 });

  const handleMouseDown = useCallback(
    (screenX: number, screenY: number, button: number) => {
      const world = screenToWorld({ x: screenX, y: screenY }, transformRef.current);
      if (button === 2) {
        removeSiteAt(world.x, world.y);
      } else if (button === 0) {
        addSite(world.x, world.y);
      }
    },
    [addSite, removeSiteAt]
  );

  const {
    canvasRef,
    transform: canvasTransform,
    resetTransform,
    handleMouseDown: canvasMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvas({
    onMouseDown: handleMouseDown,
  });

  // Keep transformRef in sync with the canvas transform state
  useEffect(() => {
    transformRef.current = canvasTransform;
  }, [canvasTransform]);

  // Generate on mount
  useEffect(() => {
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportToPNG(canvas, 'voronoi-lab.png');
  }, [canvasRef]);

  const handleExportSVG = useCallback(() => {
    if (!diagram) return;
    exportToSVG(
      diagram,
      BOUNDS.width,
      BOUNDS.height,
      {
        showSites: settings.showSites,
        showEdges: settings.showEdges,
        showDelaunay: settings.showDelaunay,
        showCentroids: settings.showCentroids,
        showCellFill: settings.showCellFill,
        darkMode,
      },
      'voronoi-lab.svg'
    );
  }, [diagram, settings, darkMode]);

  const handleImageUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !diagram) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const img = new Image();
      img.onload = () => {
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.offsetWidth;
        offscreen.height = canvas.offsetHeight;
        const ctx = offscreen.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
        const imageData = ctx.getImageData(0, 0, offscreen.width, offscreen.height);
        const newSites = imageMosaic(ctx, imageData, diagram, offscreen.width, offscreen.height);
        updateSettings({ colorMode: 'image' });
        // Re-dispatch colors via a lightweight event
        window.dispatchEvent(new CustomEvent('voronoi:setColors', { detail: newSites }));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
      e.target.value = '';
    },
    [diagram, canvasRef, updateSettings]
  );

  const bg = darkMode
    ? 'bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-900'
    : 'bg-gradient-to-br from-slate-100 via-blue-50 to-violet-50';

  return (
    <div className={`flex h-screen overflow-hidden ${bg}`}>
      {showWelcome && (
        <WelcomeModal darkMode={darkMode} onClose={() => setShowWelcome(false)} />
      )}

      {/* Control Panel */}
      <div className="p-3 flex-shrink-0">
        <ControlPanel
          settings={settings}
          siteCount={sites.length}
          lloydStep={lloydStep}
          onUpdate={updateSettings}
          onGenerate={generate}
          onStepLloyd={stepLloyd}
          onStartLloyd={startLloydAnimation}
          onStopLloyd={stopLloydAnimation}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onResetView={resetTransform}
          onImageUpload={handleImageUpload}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
        />
      </div>

      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 relative overflow-hidden rounded-2xl m-3 ml-0">
          <VoronoiCanvas
            diagram={diagram}
            transform={canvasTransform}
            showSites={settings.showSites}
            showEdges={settings.showEdges}
            showDelaunay={settings.showDelaunay}
            showCentroids={settings.showCentroids}
            showCellFill={settings.showCellFill}
            darkMode={darkMode}
            canvasRef={canvasRef}
            onMouseDown={canvasMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        <div className="mx-3 mb-3 -mt-1">
          <InfoBar diagram={diagram} lloydStep={lloydStep} darkMode={darkMode} />
        </div>
      </div>
    </div>
  );
}
