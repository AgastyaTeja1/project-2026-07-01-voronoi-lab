export interface Point {
  x: number;
  y: number;
}

export interface Site extends Point {
  id: number;
  color: string;
}

export interface VoronoiEdge {
  start: Point;
  end: Point;
  leftSite: number;
  rightSite: number;
}

export interface VoronoiCell {
  siteId: number;
  vertices: Point[];
  area: number;
  centroid: Point;
  neighborIds: number[];
}

export interface VoronoiDiagram {
  sites: Site[];
  cells: VoronoiCell[];
  edges: VoronoiEdge[];
  bounds: Rect;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FortuneEvent {
  type: 'site' | 'circle';
  y: number;
  site?: Site;
  circleCenter?: Point;
  arcSiteId?: number;
}

export type ColorMode =
  | 'pastel'
  | 'vivid'
  | 'monochrome'
  | 'earth'
  | 'ocean'
  | 'sunset'
  | 'area'
  | 'neighbors'
  | 'image';

export type DistributionMode = 'random' | 'poisson' | 'hexagonal' | 'grid' | 'custom';

export interface AppSettings {
  colorMode: ColorMode;
  distribution: DistributionMode;
  siteCount: number;
  showSites: boolean;
  showEdges: boolean;
  showDelaunay: boolean;
  showCentroids: boolean;
  showCellFill: boolean;
  lloydIterations: number;
  animating: boolean;
}

export interface CanvasTransform {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export interface HalfEdge {
  origin: Point;
  twin: HalfEdge | null;
  next: HalfEdge | null;
  prev: HalfEdge | null;
  face: number;
}

export interface BeachArc {
  siteId: number;
  prev: BeachArc | null;
  next: BeachArc | null;
  circleEvent: CircleEvent | null;
}

export interface CircleEvent {
  arc: BeachArc;
  y: number;
  center: Point;
  valid: boolean;
}

export interface ExportOptions {
  format: 'png' | 'svg';
  width: number;
  height: number;
  backgroundColor: string;
}
