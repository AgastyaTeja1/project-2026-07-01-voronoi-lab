import { useState, useCallback, useRef } from 'react';
import type { Site, VoronoiDiagram, Rect, DistributionMode, ColorMode, AppSettings } from '../types';
import { computeVoronoi, lloydRelaxation } from '../lib/fortune';
import { randomPoints, poissonDisk, hexagonalPoints, gridPoints } from '../lib/distributions';
import { assignColors } from '../lib/colors';

let nextId = 1;

function makeId(): number {
  return nextId++;
}

function makeSites(points: { x: number; y: number }[]): Site[] {
  return points.map((p) => ({
    id: makeId(),
    x: p.x,
    y: p.y,
    color: '#aaaaaa',
  }));
}

export function useVoronoi(bounds: Rect) {
  const [sites, setSites] = useState<Site[]>([]);
  const [diagram, setDiagram] = useState<VoronoiDiagram | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    colorMode: 'pastel',
    distribution: 'poisson',
    siteCount: 60,
    showSites: true,
    showEdges: true,
    showDelaunay: false,
    showCentroids: false,
    showCellFill: true,
    lloydIterations: 0,
    animating: false,
  });
  const [lloydStep, setLloydStep] = useState(0);
  const lloydRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recompute = useCallback(
    (newSites: Site[], colorMode: ColorMode = settings.colorMode) => {
      const diagram = computeVoronoi(newSites, bounds);
      const colored = assignColors(newSites, colorMode, diagram.cells);
      const finalDiagram = computeVoronoi(colored, bounds);
      setSites(colored);
      setDiagram(finalDiagram);
    },
    [bounds, settings.colorMode]
  );

  const generate = useCallback(
    (distribution?: DistributionMode, count?: number, colorMode?: ColorMode) => {
      const dist = distribution ?? settings.distribution;
      const n = count ?? settings.siteCount;
      const mode = colorMode ?? settings.colorMode;
      nextId = 1;

      let pts: { x: number; y: number }[];
      if (dist === 'random') pts = randomPoints(n, bounds);
      else if (dist === 'poisson') pts = poissonDisk(n, bounds);
      else if (dist === 'hexagonal') pts = hexagonalPoints(n, bounds);
      else if (dist === 'grid') pts = gridPoints(n, bounds);
      else pts = randomPoints(n, bounds);

      const raw = makeSites(pts);
      recompute(raw, mode);
      setLloydStep(0);
    },
    [settings, bounds, recompute]
  );

  const addSite = useCallback(
    (x: number, y: number) => {
      const newSite: Site = { id: makeId(), x, y, color: '#aaaaaa' };
      const newSites = [...sites, newSite];
      recompute(newSites, settings.colorMode);
    },
    [sites, settings.colorMode, recompute]
  );

  const removeSiteAt = useCallback(
    (x: number, y: number, radius = 15) => {
      const target = sites.find(
        (s) => Math.hypot(s.x - x, s.y - y) < radius
      );
      if (!target) return;
      const newSites = sites.filter((s) => s.id !== target.id);
      recompute(newSites, settings.colorMode);
    },
    [sites, settings.colorMode, recompute]
  );

  const stepLloyd = useCallback(() => {
    if (!diagram) return;
    const relaxed = lloydRelaxation(diagram);
    setLloydStep((s) => s + 1);
    recompute(relaxed, settings.colorMode);
  }, [diagram, settings.colorMode, recompute]);

  const startLloydAnimation = useCallback(() => {
    if (lloydRef.current) return;
    setSettings((s) => ({ ...s, animating: true }));
    lloydRef.current = setInterval(() => {
      setSites((prevSites) => {
        if (!prevSites.length) return prevSites;
        return prevSites;
      });
      stepLloyd();
    }, 120);
  }, [stepLloyd]);

  const stopLloydAnimation = useCallback(() => {
    if (lloydRef.current) {
      clearInterval(lloydRef.current);
      lloydRef.current = null;
    }
    setSettings((s) => ({ ...s, animating: false }));
  }, []);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        if (patch.colorMode && patch.colorMode !== prev.colorMode) {
          // Recolor without regenerating
          if (diagram) {
            const recolored = assignColors(sites, next.colorMode, diagram.cells);
            const newDiagram = computeVoronoi(recolored, bounds);
            setSites(recolored);
            setDiagram(newDiagram);
          }
        }
        return next;
      });
    },
    [sites, diagram, bounds]
  );

  const moveSite = useCallback(
    (id: number, x: number, y: number) => {
      const updated = sites.map((s) => (s.id === id ? { ...s, x, y } : s));
      recompute(updated, settings.colorMode);
    },
    [sites, settings.colorMode, recompute]
  );

  return {
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
    moveSite,
  };
}
