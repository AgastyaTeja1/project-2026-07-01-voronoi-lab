import { describe, it, expect } from 'vitest';
import { randomPoints, poissonDisk, hexagonalPoints, gridPoints } from '../lib/distributions';
import type { Rect } from '../types';

const BOUNDS: Rect = { x: 0, y: 0, width: 800, height: 600 };

describe('randomPoints', () => {
  it('generates exactly the requested count', () => {
    const pts = randomPoints(50, BOUNDS);
    expect(pts).toHaveLength(50);
  });

  it('all points are within bounds', () => {
    const pts = randomPoints(100, BOUNDS);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(BOUNDS.x);
      expect(p.x).toBeLessThan(BOUNDS.x + BOUNDS.width);
      expect(p.y).toBeGreaterThanOrEqual(BOUNDS.y);
      expect(p.y).toBeLessThan(BOUNDS.y + BOUNDS.height);
    }
  });
});

describe('poissonDisk', () => {
  it('generates approximately the requested count', () => {
    const pts = poissonDisk(50, BOUNDS);
    // Poisson may generate slightly fewer if not enough space, but pads
    expect(pts.length).toBeGreaterThanOrEqual(40);
    expect(pts.length).toBeLessThanOrEqual(60);
  });

  it('points maintain minimum spacing', () => {
    const n = 20;
    const pts = poissonDisk(n, BOUNDS);
    const minDist = Math.sqrt((BOUNDS.width * BOUNDS.height) / n) * 0.8 * 0.9; // 10% tolerance
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
        expect(d).toBeGreaterThan(minDist);
      }
    }
  });
});

describe('hexagonalPoints', () => {
  it('generates at least some points', () => {
    const pts = hexagonalPoints(30, BOUNDS);
    expect(pts.length).toBeGreaterThan(0);
    expect(pts.length).toBeLessThanOrEqual(30);
  });

  it('all points are within bounds', () => {
    const pts = hexagonalPoints(20, BOUNDS);
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(BOUNDS.x - 0.1);
      expect(p.x).toBeLessThanOrEqual(BOUNDS.x + BOUNDS.width + 0.1);
      expect(p.y).toBeGreaterThanOrEqual(BOUNDS.y - 0.1);
      expect(p.y).toBeLessThanOrEqual(BOUNDS.y + BOUNDS.height + 0.1);
    }
  });
});

describe('gridPoints', () => {
  it('generates exactly the requested count', () => {
    const pts = gridPoints(25, BOUNDS);
    expect(pts).toHaveLength(25);
  });

  it('points form a grid pattern', () => {
    const pts = gridPoints(16, BOUNDS);
    // Should have roughly sqrt(16)=4 unique x and y values
    const xs = new Set(pts.map((p) => Math.round(p.x)));
    const ys = new Set(pts.map((p) => Math.round(p.y)));
    expect(xs.size).toBeGreaterThanOrEqual(3);
    expect(ys.size).toBeGreaterThanOrEqual(3);
  });
});
