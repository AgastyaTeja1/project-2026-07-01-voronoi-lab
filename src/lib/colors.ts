import type { ColorMode, Site, VoronoiCell } from '../types';

const PALETTES: Record<string, string[]> = {
  pastel: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
    '#E8BAFF', '#FFB3E6', '#C9BAFF', '#BAF0FF', '#D4FFBA',
  ],
  vivid: [
    '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C77DFF',
    '#FF9F45', '#00D4FF', '#FF6FC8', '#9BFF6B', '#FF6B9D',
  ],
  monochrome: [
    '#1a1a2e', '#16213e', '#0f3460', '#533483', '#7a5c9e',
    '#a07cc5', '#c4a8d8', '#dbbfe8', '#ead4f5', '#f5ecfc',
  ],
  earth: [
    '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887',
    '#F4A460', '#DAA520', '#B8860B', '#556B2F', '#6B8E23',
  ],
  ocean: [
    '#001f54', '#023e8a', '#0077b6', '#0096c7', '#00b4d8',
    '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8', '#e0f7fa',
  ],
  sunset: [
    '#03045e', '#3a0ca3', '#7209b7', '#b5179e', '#f72585',
    '#f77f00', '#fcbf49', '#eae2b7', '#ff9e00', '#ff4800',
  ],
};

export function getPaletteColors(mode: ColorMode, palette?: string): string[] {
  const key = palette ?? mode;
  return PALETTES[key] ?? PALETTES.pastel;
}

export function assignColors(
  sites: Site[],
  mode: ColorMode,
  cells?: VoronoiCell[]
): Site[] {
  if (mode === 'area' && cells) {
    const areas = cells.map((c) => c.area);
    const maxArea = Math.max(...areas, 1);
    return sites.map((s) => {
      const cell = cells.find((c) => c.siteId === s.id);
      const ratio = cell ? cell.area / maxArea : 0;
      return { ...s, color: interpolateBlue(ratio) };
    });
  }

  if (mode === 'neighbors' && cells) {
    const counts = cells.map((c) => c.neighborIds.length);
    const maxCount = Math.max(...counts, 1);
    return sites.map((s) => {
      const cell = cells.find((c) => c.siteId === s.id);
      const ratio = cell ? cell.neighborIds.length / maxCount : 0;
      return { ...s, color: interpolatePurple(ratio) };
    });
  }

  const palette = getPaletteColors(mode);
  return sites.map((s, i) => ({
    ...s,
    color: palette[i % palette.length],
  }));
}

function interpolateBlue(t: number): string {
  const r = Math.round(lerp(0, 100, t));
  const g = Math.round(lerp(100, 200, t));
  const b = Math.round(lerp(200, 255, t));
  return `rgb(${r},${g},${b})`;
}

function interpolatePurple(t: number): string {
  const r = Math.round(lerp(50, 220, t));
  const g = Math.round(lerp(0, 50, t));
  const b = Math.round(lerp(150, 255, t));
  return `rgb(${r},${g},${b})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m
    ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
    : null;
}

export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = Math.min(255, rgb.r + amount);
  const g = Math.min(255, rgb.g + amount);
  const b = Math.min(255, rgb.b + amount);
  return `rgb(${r},${g},${b})`;
}
