import type { VoronoiDiagram, Site, CanvasTransform, Rect } from '../types';

export interface DrawOptions {
  showSites: boolean;
  showEdges: boolean;
  showDelaunay: boolean;
  showCentroids: boolean;
  showCellFill: boolean;
  sweepY?: number;
  darkMode: boolean;
}

export function worldToScreen(p: { x: number; y: number }, t: CanvasTransform): { x: number; y: number } {
  return { x: p.x * t.scale + t.offsetX, y: p.y * t.scale + t.offsetY };
}

export function screenToWorld(p: { x: number; y: number }, t: CanvasTransform): { x: number; y: number } {
  return { x: (p.x - t.offsetX) / t.scale, y: (p.y - t.offsetY) / t.scale };
}

export function drawDiagram(
  ctx: CanvasRenderingContext2D,
  diagram: VoronoiDiagram,
  transform: CanvasTransform,
  opts: DrawOptions
): void {
  const { scale, offsetX, offsetY } = transform;

  const toScreen = (p: { x: number; y: number }) => ({
    x: p.x * scale + offsetX,
    y: p.y * scale + offsetY,
  });

  ctx.save();

  // Cell fills
  if (opts.showCellFill) {
    for (const cell of diagram.cells) {
      if (cell.vertices.length < 3) continue;
      const site = diagram.sites.find((s) => s.id === cell.siteId);
      if (!site) continue;

      ctx.beginPath();
      const first = toScreen(cell.vertices[0]);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < cell.vertices.length; i++) {
        const sp = toScreen(cell.vertices[i]);
        ctx.lineTo(sp.x, sp.y);
      }
      ctx.closePath();
      ctx.fillStyle = site.color + 'cc'; // slight transparency
      ctx.fill();
    }
  }

  // Voronoi edges
  if (opts.showEdges) {
    ctx.strokeStyle = opts.darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1.5;
    for (const edge of diagram.edges) {
      const s = toScreen(edge.start);
      const e = toScreen(edge.end);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }
  }

  // Delaunay triangulation (dual graph: connect neighbor sites)
  if (opts.showDelaunay) {
    ctx.strokeStyle = opts.darkMode ? 'rgba(100,200,255,0.4)' : 'rgba(50,100,255,0.3)';
    ctx.lineWidth = 1;
    const drawn = new Set<string>();
    for (const edge of diagram.edges) {
      const key = [edge.leftSite, edge.rightSite].sort().join('-');
      if (drawn.has(key)) continue;
      drawn.add(key);
      const left = diagram.sites.find((s) => s.id === edge.leftSite);
      const right = diagram.sites.find((s) => s.id === edge.rightSite);
      if (!left || !right) continue;
      const sl = toScreen(left);
      const sr = toScreen(right);
      ctx.beginPath();
      ctx.moveTo(sl.x, sl.y);
      ctx.lineTo(sr.x, sr.y);
      ctx.stroke();
    }
  }

  // Centroids
  if (opts.showCentroids) {
    ctx.fillStyle = opts.darkMode ? 'rgba(255,220,100,0.8)' : 'rgba(200,100,0,0.7)';
    for (const cell of diagram.cells) {
      const sc = toScreen(cell.centroid);
      ctx.beginPath();
      ctx.arc(sc.x, sc.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Sites (seed points)
  if (opts.showSites) {
    for (const site of diagram.sites) {
      const ss = toScreen(site);
      ctx.beginPath();
      ctx.arc(ss.x, ss.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = opts.darkMode ? '#fff' : '#222';
      ctx.fill();
      ctx.strokeStyle = opts.darkMode ? '#888' : '#ccc';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Sweep line
  if (opts.sweepY !== undefined) {
    const sy = opts.sweepY * scale + offsetY;
    ctx.strokeStyle = 'rgba(255,80,80,0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(ctx.canvas.width, sy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.restore();
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  darkMode: boolean
): void {
  ctx.fillStyle = darkMode ? '#0f0f1a' : '#f8f8fc';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  transform: CanvasTransform,
  darkMode: boolean,
  bounds: Rect
): void {
  const { scale, offsetX, offsetY } = transform;
  ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;

  const gridSize = 50 * scale;
  const startX = offsetX % gridSize;
  const startY = offsetY % gridSize;

  const canvasW = ctx.canvas.width;
  const canvasH = ctx.canvas.height;

  for (let x = startX; x < canvasW; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasH);
    ctx.stroke();
  }
  for (let y = startY; y < canvasH; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasW, y);
    ctx.stroke();
  }

  // Bounds outline
  const bx = bounds.x * scale + offsetX;
  const by = bounds.y * scale + offsetY;
  const bw = bounds.width * scale;
  const bh = bounds.height * scale;
  ctx.strokeStyle = darkMode ? 'rgba(100,100,200,0.3)' : 'rgba(50,50,150,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
}

export function exportToPNG(canvas: HTMLCanvasElement, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function exportToSVG(
  diagram: VoronoiDiagram,
  width: number,
  height: number,
  opts: DrawOptions,
  filename: string
): void {
  const lines: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="${width}" height="${height}" fill="${opts.darkMode ? '#0f0f1a' : '#f8f8fc'}"/>`,
  ];

  if (opts.showCellFill) {
    for (const cell of diagram.cells) {
      if (cell.vertices.length < 3) continue;
      const site = diagram.sites.find((s) => s.id === cell.siteId);
      if (!site) continue;
      const d = cell.vertices.map((v, i) => `${i === 0 ? 'M' : 'L'}${v.x.toFixed(2)} ${v.y.toFixed(2)}`).join(' ') + 'Z';
      lines.push(`<path d="${d}" fill="${site.color}cc" />`);
    }
  }

  if (opts.showEdges) {
    for (const edge of diagram.edges) {
      lines.push(
        `<line x1="${edge.start.x.toFixed(2)}" y1="${edge.start.y.toFixed(2)}" x2="${edge.end.x.toFixed(2)}" y2="${edge.end.y.toFixed(2)}" stroke="${opts.darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'}" stroke-width="1.5"/>`
      );
    }
  }

  if (opts.showSites) {
    for (const site of diagram.sites) {
      lines.push(`<circle cx="${site.x.toFixed(2)}" cy="${site.y.toFixed(2)}" r="4" fill="${opts.darkMode ? '#fff' : '#222'}" stroke="${opts.darkMode ? '#888' : '#ccc'}" stroke-width="1.5"/>`);
    }
  }

  lines.push('</svg>');
  const blob = new Blob([lines.join('\n')], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function imageMosaic(
  _ctx: CanvasRenderingContext2D,
  imageData: ImageData,
  diagram: VoronoiDiagram,
  canvasW: number,
  canvasH: number
): Site[] {
  const scaleX = imageData.width / canvasW;
  const scaleY = imageData.height / canvasH;
  const { data, width } = imageData;

  return diagram.sites.map((site) => {
    const cell = diagram.cells.find((c) => c.siteId === site.id);
    if (!cell || cell.vertices.length < 3) return site;

    // Sample pixels within the bounding box of the cell
    const xs = cell.vertices.map((v) => v.x);
    const ys = cell.vertices.map((v) => v.y);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(canvasW - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(canvasH - 1, Math.ceil(Math.max(...ys)));

    let r = 0, g = 0, b = 0, count = 0;

    for (let py = minY; py <= maxY; py += 2) {
      for (let px = minX; px <= maxX; px += 2) {
        if (!pointInPolygon({ x: px, y: py }, cell.vertices)) continue;
        const ix = Math.floor(px * scaleX);
        const iy = Math.floor(py * scaleY);
        const idx = (iy * width + ix) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }

    if (count === 0) return site;
    const avg = `rgb(${Math.round(r / count)},${Math.round(g / count)},${Math.round(b / count)})`;
    return { ...site, color: avg };
  });
}

function pointInPolygon(pt: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if (yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
