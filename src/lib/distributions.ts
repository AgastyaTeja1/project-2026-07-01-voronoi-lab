import type { Point, Rect } from '../types';

export function randomPoints(count: number, bounds: Rect): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i < count; i++) {
    pts.push({
      x: bounds.x + Math.random() * bounds.width,
      y: bounds.y + Math.random() * bounds.height,
    });
  }
  return pts;
}

/**
 * Poisson Disk Sampling — minimum distance between any two points.
 * Generates a blue-noise distribution.
 */
export function poissonDisk(count: number, bounds: Rect): Point[] {
  const minDist = Math.sqrt((bounds.width * bounds.height) / count) * 0.8;
  const k = 30;
  const cellSize = minDist / Math.SQRT2;

  const cols = Math.ceil(bounds.width / cellSize);
  const rows = Math.ceil(bounds.height / cellSize);
  const grid: (Point | null)[] = new Array(cols * rows).fill(null);

  const idx = (p: Point) => {
    const col = Math.floor((p.x - bounds.x) / cellSize);
    const row = Math.floor((p.y - bounds.y) / cellSize);
    return row * cols + col;
  };

  const inBounds = (p: Point) =>
    p.x >= bounds.x && p.x < bounds.x + bounds.width &&
    p.y >= bounds.y && p.y < bounds.y + bounds.height;

  const tooClose = (p: Point): boolean => {
    const col = Math.floor((p.x - bounds.x) / cellSize);
    const row = Math.floor((p.y - bounds.y) / cellSize);
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nc = col + dc, nr = row + dr;
        if (nc < 0 || nc >= cols || nr < 0 || nr >= rows) continue;
        const neighbor = grid[nr * cols + nc];
        if (neighbor && Math.hypot(p.x - neighbor.x, p.y - neighbor.y) < minDist) return true;
      }
    }
    return false;
  };

  const first: Point = {
    x: bounds.x + Math.random() * bounds.width,
    y: bounds.y + Math.random() * bounds.height,
  };

  const points: Point[] = [first];
  const active: Point[] = [first];
  grid[idx(first)] = first;

  while (active.length > 0 && points.length < count) {
    const ai = Math.floor(Math.random() * active.length);
    const base = active[ai];
    let found = false;

    for (let attempt = 0; attempt < k; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = minDist * (1 + Math.random());
      const candidate: Point = {
        x: base.x + Math.cos(angle) * dist,
        y: base.y + Math.sin(angle) * dist,
      };
      if (!inBounds(candidate) || tooClose(candidate)) continue;
      points.push(candidate);
      active.push(candidate);
      grid[idx(candidate)] = candidate;
      found = true;
      if (points.length >= count) break;
    }

    if (!found) active.splice(ai, 1);
  }

  // Pad with random points if Poisson didn't generate enough
  while (points.length < count) {
    points.push(...randomPoints(1, bounds));
  }

  return points.slice(0, count);
}

export function hexagonalPoints(count: number, bounds: Rect): Point[] {
  const area = bounds.width * bounds.height;
  const spacing = Math.sqrt((area / count) * (2 / Math.sqrt(3)));
  const rows = Math.ceil(bounds.height / (spacing * Math.sqrt(3) / 2));
  const cols = Math.ceil(bounds.width / spacing);

  const pts: Point[] = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const offset = r % 2 === 0 ? 0 : spacing / 2;
      pts.push({
        x: bounds.x + c * spacing + offset,
        y: bounds.y + r * spacing * (Math.sqrt(3) / 2),
      });
    }
  }

  return pts
    .filter((p) =>
      p.x >= bounds.x && p.x <= bounds.x + bounds.width &&
      p.y >= bounds.y && p.y <= bounds.y + bounds.height
    )
    .slice(0, count);
}

export function gridPoints(count: number, bounds: Rect): Point[] {
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const dx = bounds.width / cols;
  const dy = bounds.height / rows;
  const pts: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pts.push({
        x: bounds.x + (c + 0.5) * dx,
        y: bounds.y + (r + 0.5) * dy,
      });
    }
  }
  return pts.slice(0, count);
}
