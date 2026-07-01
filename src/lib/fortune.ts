import type { Point, Site, VoronoiCell, VoronoiDiagram, VoronoiEdge, Rect } from '../types';

// ── Parabola helpers ──────────────────────────────────────────────────────────

function parabolaY(focus: Point, directrixY: number, x: number): number {
  const d = focus.y - directrixY;
  if (Math.abs(d) < 1e-10) return focus.y;
  return ((x - focus.x) ** 2) / (2 * d) + (focus.y + directrixY) / 2;
}

function intersectParabolas(
  left: Site,
  right: Site,
  sweepY: number
): number {
  if (Math.abs(left.y - right.y) < 1e-10) {
    return (left.x + right.x) / 2;
  }
  const dl = left.y - sweepY;
  const dr = right.y - sweepY;
  if (Math.abs(dl) < 1e-10) return left.x;
  if (Math.abs(dr) < 1e-10) return right.x;
  const a = 1 / dl - 1 / dr;
  const b = -2 * (left.x / dl - right.x / dr);
  const c = (left.x ** 2 + left.y ** 2 - sweepY ** 2) / dl -
    (right.x ** 2 + right.y ** 2 - sweepY ** 2) / dr;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return (left.x + right.x) / 2;
  const sq = Math.sqrt(disc);
  const x1 = (-b + sq) / (2 * a);
  const x2 = (-b - sq) / (2 * a);
  return left.y < right.y ? Math.min(x1, x2) : Math.max(x1, x2);
}

function circumcenter(a: Point, b: Point, c: Point): Point | null {
  const ax = b.x - a.x, ay = b.y - a.y;
  const bx = c.x - a.x, by = c.y - a.y;
  const D = 2 * (ax * by - ay * bx);
  if (Math.abs(D) < 1e-10) return null;
  const ux = (by * (ax * ax + ay * ay) - ay * (bx * bx + by * by)) / D;
  const uy = (ax * (bx * bx + by * by) - bx * (ax * ax + ay * ay)) / D;
  return { x: a.x + ux, y: a.y + uy };
}

// ── Beachline ─────────────────────────────────────────────────────────────────

interface Arc {
  site: Site;
  prev: Arc | null;
  next: Arc | null;
  leftEdge: HalfEdgeRecord | null;
  rightEdge: HalfEdgeRecord | null;
  circleEvent: CircleEvt | null;
}

interface HalfEdgeRecord {
  start: Point | null;
  end: Point | null;
  leftSite: number;
  rightSite: number;
}

interface CircleEvt {
  arc: Arc;
  y: number;
  center: Point;
  valid: boolean;
}

// ── Fortune's Algorithm ───────────────────────────────────────────────────────

export function computeVoronoi(sites: Site[], bounds: Rect): VoronoiDiagram {
  if (sites.length === 0) {
    return { sites: [], cells: [], edges: [], bounds };
  }
  if (sites.length === 1) {
    const s = sites[0];
    const cell: VoronoiCell = {
      siteId: s.id,
      vertices: [
        { x: bounds.x, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y },
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
        { x: bounds.x, y: bounds.y + bounds.height },
      ],
      area: bounds.width * bounds.height,
      centroid: { x: s.x, y: s.y },
      neighborIds: [],
    };
    return { sites, cells: [cell], edges: [], bounds };
  }

  const sorted = [...sites].sort((a, b) => a.y - b.y || a.x - b.x);

  const edges: HalfEdgeRecord[] = [];
  let beachHead: Arc | null = null;

  const siteEvents = [...sorted];
  const circleEvents: CircleEvt[] = [];

  function addCircleEvent(arc: Arc): void {
    if (!arc.prev || !arc.next) return;
    const center = circumcenter(arc.prev.site, arc.site, arc.next.site);
    if (!center) return;
    const r = Math.hypot(arc.site.x - center.x, arc.site.y - center.y);
    const y = center.y + r;
    if (y <= arc.site.y + 1e-10) return;
    const evt: CircleEvt = { arc, y, center, valid: true };
    arc.circleEvent = evt;
    circleEvents.push(evt);
    circleEvents.sort((a, b) => a.y - b.y);
  }

  function removeCircleEvent(arc: Arc): void {
    if (arc.circleEvent) {
      arc.circleEvent.valid = false;
      arc.circleEvent = null;
    }
  }

  function insertArc(site: Site): void {
    if (!beachHead) {
      beachHead = { site, prev: null, next: null, leftEdge: null, rightEdge: null, circleEvent: null };
      return;
    }
    let arc = beachHead;
    while (arc.next) {
      const intersectX = intersectParabolas(arc.site, arc.next.site, site.y);
      if (site.x < intersectX) break;
      arc = arc.next;
    }

    removeCircleEvent(arc);

    const splitY = parabolaY(arc.site, site.y, site.x);

    const edge1: HalfEdgeRecord = { start: { x: site.x, y: splitY }, end: null, leftSite: arc.site.id, rightSite: site.id };
    const edge2: HalfEdgeRecord = { start: { x: site.x, y: splitY }, end: null, leftSite: site.id, rightSite: arc.site.id };
    edges.push(edge1, edge2);

    const arcLeft: Arc = { site: arc.site, prev: arc.prev, next: null, leftEdge: arc.leftEdge, rightEdge: edge1, circleEvent: null };
    const arcMiddle: Arc = { site, prev: arcLeft, next: null, leftEdge: edge1, rightEdge: edge2, circleEvent: null };
    const arcRight: Arc = { site: arc.site, prev: arcMiddle, next: arc.next, leftEdge: edge2, rightEdge: arc.rightEdge, circleEvent: null };

    arcLeft.next = arcMiddle;
    arcMiddle.next = arcRight;
    if (arcLeft.prev) arcLeft.prev.next = arcLeft;
    if (arcRight.next) arcRight.next.prev = arcRight;

    if (!arcLeft.prev) beachHead = arcLeft;

    addCircleEvent(arcLeft);
    addCircleEvent(arcRight);
  }

  function handleCircleEvent(evt: CircleEvt): void {
    if (!evt.valid) return;
    const arc = evt.arc;
    const { center } = evt;

    if (arc.leftEdge) arc.leftEdge.end = center;
    if (arc.rightEdge) arc.rightEdge.end = center;

    const newEdge: HalfEdgeRecord = {
      start: center,
      end: null,
      leftSite: arc.prev!.site.id,
      rightSite: arc.next!.site.id,
    };
    edges.push(newEdge);
    if (arc.prev) arc.prev.rightEdge = newEdge;
    if (arc.next) arc.next.leftEdge = newEdge;

    removeCircleEvent(arc.prev!);
    removeCircleEvent(arc.next!);

    if (arc.prev) arc.prev.next = arc.next;
    if (arc.next) arc.next.prev = arc.prev;
    if (!arc.prev!.prev) beachHead = arc.prev!;

    addCircleEvent(arc.prev!);
    addCircleEvent(arc.next!);
  }

  while (siteEvents.length > 0 || circleEvents.length > 0) {
    const nextSite = siteEvents[0];
    const nextCircle = circleEvents[0];

    if (nextSite && (!nextCircle || nextSite.y <= nextCircle.y)) {
      siteEvents.shift();
      insertArc(nextSite);
    } else if (nextCircle) {
      circleEvents.shift();
      handleCircleEvent(nextCircle);
    }
  }

  // Finish open edges at bounding box
  const { x: bx, y: by, width: bw, height: bh } = bounds;
  for (const edge of edges) {
    if (!edge.end) {
      edge.end = clampToBounds(edge.start!, getEdgeDirection(edge, sites, bounds), bounds);
    }
    if (!edge.start) {
      edge.start = clampToBounds(edge.end!, getEdgeDirection(edge, sites, bounds), bounds);
    }
    // Clamp both endpoints inside bounds
    edge.start = clampPoint(edge.start!, bx, by, bx + bw, by + bh);
    edge.end = clampPoint(edge.end!, bx, by, bx + bw, by + bh);
  }

  const validEdges: VoronoiEdge[] = edges
    .filter((e) => e.start && e.end)
    .map((e) => ({
      start: e.start!,
      end: e.end!,
      leftSite: e.leftSite,
      rightSite: e.rightSite,
    }));

  const cells = buildCells(sites, validEdges, bounds);
  return { sites, cells, edges: validEdges, bounds };
}

function getEdgeDirection(edge: HalfEdgeRecord, sites: Site[], bounds: Rect): Point {
  const left = sites.find((s) => s.id === edge.leftSite);
  const right = sites.find((s) => s.id === edge.rightSite);
  if (!left || !right || !edge.start) {
    return { x: bounds.x + bounds.width / 2, y: bounds.y };
  }
  const mx = (left.x + right.x) / 2;
  const my = (left.y + right.y) / 2;
  const dx = right.y - left.y;
  const dy = left.x - right.x;
  const len = Math.hypot(dx, dy) || 1;
  return {
    x: edge.start.x + (dx / len) * bounds.width * 2,
    y: edge.start.y + (dy / len) * bounds.height * 2,
  };
  // suppress unused warning
  void mx; void my;
}

function clampToBounds(from: Point, to: Point, bounds: Rect): Point {
  const { x: bx, y: by, width: bw, height: bh } = bounds;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let tMin = 0, tMax = 1;

  for (const [p, d, lo, hi] of [
    [from.x, dx, bx, bx + bw],
    [from.y, dy, by, by + bh],
  ] as [number, number, number, number][]) {
    if (Math.abs(d) < 1e-10) {
      if (p < lo || p > hi) return { x: from.x, y: from.y };
    } else {
      const t1 = (lo - p) / d;
      const t2 = (hi - p) / d;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }
  }

  if (tMin > tMax) return from;
  const t = tMax < 1 ? tMax : tMin;
  return { x: from.x + dx * t, y: from.y + dy * t };
}

function clampPoint(p: Point, x0: number, y0: number, x1: number, y1: number): Point {
  return {
    x: Math.max(x0, Math.min(x1, p.x)),
    y: Math.max(y0, Math.min(y1, p.y)),
  };
}

// ── Cell Assembly ─────────────────────────────────────────────────────────────

function buildCells(sites: Site[], edges: VoronoiEdge[], bounds: Rect): VoronoiCell[] {
  const { x: bx, y: by, width: bw, height: bh } = bounds;
  const corners: Point[] = [
    { x: bx, y: by },
    { x: bx + bw, y: by },
    { x: bx + bw, y: by + bh },
    { x: bx, y: by + bh },
  ];

  return sites.map((site) => {
    const siteEdges = edges.filter((e) => e.leftSite === site.id || e.rightSite === site.id);

    const points: Point[] = [];
    for (const e of siteEdges) {
      points.push(e.start, e.end);
    }

    // Add bounding box corners that are inside this cell's Voronoi region
    for (const corner of corners) {
      if (isNearestSite(corner, site, sites)) {
        points.push(corner);
      }
    }

    if (points.length < 3) {
      return { siteId: site.id, vertices: [], area: 0, centroid: site, neighborIds: [] };
    }

    const hull = convexHull(points);
    const area = polygonArea(hull);
    const centroid = polygonCentroid(hull);
    const neighborIds = [...new Set(
      siteEdges.flatMap((e) => [e.leftSite, e.rightSite]).filter((id) => id !== site.id)
    )];

    return { siteId: site.id, vertices: hull, area, centroid, neighborIds };
  });
}

function isNearestSite(point: Point, candidate: Site, allSites: Site[]): boolean {
  const d = distSq(point, candidate);
  return allSites.every((s) => distSq(point, s) >= d - 1e-6);
}

function distSq(a: Point, b: Point): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: Point[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return [...lower, ...upper];
}

function cross(O: Point, A: Point, B: Point): number {
  return (A.x - O.x) * (B.y - O.y) - (A.y - O.y) * (B.x - O.x);
}

export function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    area += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
  }
  return Math.abs(area) / 2;
}

export function polygonCentroid(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  let cx = 0, cy = 0, area = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[j].x * pts[i].y - pts[i].x * pts[j].y;
    area += a;
    cx += (pts[j].x + pts[i].x) * a;
    cy += (pts[j].y + pts[i].y) * a;
  }
  area /= 2;
  if (Math.abs(area) < 1e-10) {
    return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
  }
  return { x: cx / (6 * area), y: cy / (6 * area) };
}

// ── Lloyd's Relaxation ────────────────────────────────────────────────────────

export function lloydRelaxation(diagram: VoronoiDiagram): Site[] {
  return diagram.sites.map((site) => {
    const cell = diagram.cells.find((c) => c.siteId === site.id);
    if (!cell || cell.vertices.length < 3) return site;
    const centroid = polygonCentroid(cell.vertices);
    return { ...site, x: centroid.x, y: centroid.y };
  });
}
