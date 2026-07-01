import { describe, it, expect } from 'vitest';
import { computeVoronoi, polygonArea, polygonCentroid, lloydRelaxation } from '../lib/fortune';
import type { Site, Rect } from '../types';

const BOUNDS: Rect = { x: 0, y: 0, width: 800, height: 600 };

function makeSites(pts: { x: number; y: number }[]): Site[] {
  return pts.map((p, i) => ({ id: i + 1, x: p.x, y: p.y, color: '#fff' }));
}

describe('computeVoronoi', () => {
  it('handles empty input gracefully', () => {
    const result = computeVoronoi([], BOUNDS);
    expect(result.sites).toHaveLength(0);
    expect(result.cells).toHaveLength(0);
    expect(result.edges).toHaveLength(0);
  });

  it('handles single site — returns full bounds as cell', () => {
    const sites = makeSites([{ x: 400, y: 300 }]);
    const result = computeVoronoi(sites, BOUNDS);
    expect(result.cells).toHaveLength(1);
    expect(result.cells[0].vertices).toHaveLength(4);
  });

  it('two sites produce one shared edge', () => {
    const sites = makeSites([
      { x: 200, y: 300 },
      { x: 600, y: 300 },
    ]);
    const result = computeVoronoi(sites, BOUNDS);
    expect(result.cells).toHaveLength(2);
    expect(result.edges.length).toBeGreaterThan(0);
  });

  it('produces one cell per site', () => {
    const pts = Array.from({ length: 20 }, (_, i) => ({
      x: 50 + (i % 5) * 150,
      y: 50 + Math.floor(i / 5) * 150,
    }));
    const sites = makeSites(pts);
    const result = computeVoronoi(sites, BOUNDS);
    expect(result.cells).toHaveLength(sites.length);
  });

  it('all cell siteIds map to valid sites', () => {
    const pts = Array.from({ length: 30 }, (_, i) => ({
      x: 10 + (i % 6) * 130,
      y: 10 + Math.floor(i / 6) * 120,
    }));
    const sites = makeSites(pts);
    const result = computeVoronoi(sites, BOUNDS);
    const siteIdSet = new Set(sites.map((s) => s.id));
    for (const cell of result.cells) {
      expect(siteIdSet.has(cell.siteId)).toBe(true);
    }
  });

  it('edges have valid start and end points', () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({
      x: 100 + i * 60,
      y: 300,
    }));
    const sites = makeSites(pts);
    const result = computeVoronoi(sites, BOUNDS);
    for (const edge of result.edges) {
      expect(edge.start).toBeDefined();
      expect(edge.end).toBeDefined();
      expect(isFinite(edge.start.x)).toBe(true);
      expect(isFinite(edge.start.y)).toBe(true);
      expect(isFinite(edge.end.x)).toBe(true);
      expect(isFinite(edge.end.y)).toBe(true);
    }
  });
});

describe('polygonArea', () => {
  it('calculates square area', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    expect(polygonArea(square)).toBeCloseTo(10000, 0);
  });

  it('calculates triangle area', () => {
    const tri = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 50, y: 100 },
    ];
    expect(polygonArea(tri)).toBeCloseTo(5000, 0);
  });

  it('returns 0 for degenerate input', () => {
    expect(polygonArea([])).toBe(0);
    expect(polygonArea([{ x: 0, y: 0 }])).toBeCloseTo(0, 5);
  });
});

describe('polygonCentroid', () => {
  it('centroid of square is center', () => {
    const square = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const c = polygonCentroid(square);
    expect(c.x).toBeCloseTo(50, 1);
    expect(c.y).toBeCloseTo(50, 1);
  });

  it('returns fallback for empty input', () => {
    const c = polygonCentroid([]);
    expect(c).toEqual({ x: 0, y: 0 });
  });
});

describe('lloydRelaxation', () => {
  it('returns same number of sites', () => {
    const pts = Array.from({ length: 15 }, (_, i) => ({
      x: 50 + (i % 5) * 150,
      y: 50 + Math.floor(i / 5) * 150,
    }));
    const sites = makeSites(pts);
    const diagram = computeVoronoi(sites, BOUNDS);
    const relaxed = lloydRelaxation(diagram);
    expect(relaxed).toHaveLength(sites.length);
  });

  it('sites remain within reasonable range after relaxation', () => {
    const pts = Array.from({ length: 10 }, (_, i) => ({
      x: 100 + i * 60,
      y: 300,
    }));
    const sites = makeSites(pts);
    const diagram = computeVoronoi(sites, BOUNDS);
    const relaxed = lloydRelaxation(diagram);
    for (const s of relaxed) {
      expect(s.x).toBeGreaterThanOrEqual(-50);
      expect(s.x).toBeLessThanOrEqual(BOUNDS.width + 50);
      expect(s.y).toBeGreaterThanOrEqual(-50);
      expect(s.y).toBeLessThanOrEqual(BOUNDS.height + 50);
    }
  });
});
