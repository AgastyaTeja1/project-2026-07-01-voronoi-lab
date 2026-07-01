import { describe, it, expect } from 'vitest';
import { assignColors, getPaletteColors, hexToRgb, lighten } from '../lib/colors';
import type { Site, VoronoiCell } from '../types';

function makeSite(id: number): Site {
  return { id, x: id * 10, y: id * 10, color: '#aaa' };
}

function makeCell(siteId: number): VoronoiCell {
  return {
    siteId,
    vertices: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }],
    area: 10000,
    centroid: { x: 50, y: 50 },
    neighborIds: [siteId - 1, siteId + 1].filter((n) => n > 0),
  };
}

describe('getPaletteColors', () => {
  it('returns correct palette for pastel', () => {
    const colors = getPaletteColors('pastel');
    expect(colors.length).toBeGreaterThan(0);
    expect(colors[0]).toMatch(/^#/);
  });

  it('returns correct palette for ocean', () => {
    const colors = getPaletteColors('ocean');
    expect(colors.length).toBeGreaterThan(0);
  });

  it('falls back to pastel for unknown mode', () => {
    const colors = getPaletteColors('image');
    expect(colors.length).toBeGreaterThan(0);
  });
});

describe('assignColors', () => {
  const sites = [1, 2, 3, 4, 5].map(makeSite);
  const cells = [1, 2, 3, 4, 5].map(makeCell);

  it('assigns a color to every site', () => {
    const colored = assignColors(sites, 'pastel');
    expect(colored).toHaveLength(sites.length);
    for (const s of colored) {
      expect(s.color).toBeTruthy();
      expect(s.color).not.toBe('#aaa');
    }
  });

  it('area mode produces rgb colors', () => {
    const colored = assignColors(sites, 'area', cells);
    for (const s of colored) {
      expect(s.color).toMatch(/^rgb/);
    }
  });

  it('neighbors mode produces rgb colors', () => {
    const colored = assignColors(sites, 'neighbors', cells);
    for (const s of colored) {
      expect(s.color).toMatch(/^rgb/);
    }
  });

  it('cycles through palette for large site counts', () => {
    const manySites = Array.from({ length: 25 }, (_, i) => makeSite(i + 1));
    const colored = assignColors(manySites, 'vivid');
    expect(colored).toHaveLength(25);
    expect(colored.every((s) => !!s.color)).toBe(true);
  });
});

describe('hexToRgb', () => {
  it('parses #RRGGBB correctly', () => {
    expect(hexToRgb('#FF6B6B')).toEqual({ r: 255, g: 107, b: 107 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('not-a-color')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });
});

describe('lighten', () => {
  it('returns a lighter color', () => {
    const original = hexToRgb('#aaaaaa')!;
    const result = lighten('#aaaaaa', 50);
    expect(result).toMatch(/^rgb/);
    const [r, g, b] = result.match(/\d+/g)!.map(Number);
    expect(r).toBeGreaterThan(original.r);
    expect(g).toBeGreaterThan(original.g);
    expect(b).toBeGreaterThan(original.b);
  });

  it('clamps at 255', () => {
    const result = lighten('#ffffff', 100);
    expect(result).toMatch(/255/);
  });
});
