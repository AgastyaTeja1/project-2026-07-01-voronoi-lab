import React from 'react';
import type { AppSettings, ColorMode, DistributionMode } from '../types';

interface Props {
  settings: AppSettings;
  siteCount: number;
  lloydStep: number;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onGenerate: (dist?: DistributionMode, count?: number, mode?: ColorMode) => void;
  onStepLloyd: () => void;
  onStartLloyd: () => void;
  onStopLloyd: () => void;
  onExportPNG: () => void;
  onExportSVG: () => void;
  onResetView: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'pastel', label: 'Pastel' },
  { value: 'vivid', label: 'Vivid' },
  { value: 'monochrome', label: 'Monochrome' },
  { value: 'earth', label: 'Earth' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'area', label: 'By Area' },
  { value: 'neighbors', label: 'By Neighbors' },
  { value: 'image', label: 'Image Mosaic' },
];

const DISTRIBUTIONS: { value: DistributionMode; label: string }[] = [
  { value: 'poisson', label: 'Poisson Disk' },
  { value: 'random', label: 'Random' },
  { value: 'hexagonal', label: 'Hexagonal' },
  { value: 'grid', label: 'Grid' },
];

export const ControlPanel: React.FC<Props> = ({
  settings,
  siteCount,
  lloydStep,
  onUpdate,
  onGenerate,
  onStepLloyd,
  onStartLloyd,
  onStopLloyd,
  onExportPNG,
  onExportSVG,
  onResetView,
  onImageUpload,
  darkMode,
  onToggleDark,
}) => {
  const glass = darkMode
    ? 'bg-white/5 border border-white/10 backdrop-blur-md'
    : 'bg-white/70 border border-black/10 backdrop-blur-md shadow-lg';

  const text = darkMode ? 'text-white' : 'text-gray-900';
  const subtext = darkMode ? 'text-white/60' : 'text-gray-500';
  const inputCls = darkMode
    ? 'bg-white/10 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-500'
    : 'bg-white border border-gray-200 text-gray-900 rounded-lg px-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-violet-400';
  const btnPrimary =
    'px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all shadow-md';
  const btnSecondary = darkMode
    ? 'px-3 py-1.5 rounded-lg text-sm font-medium bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all border border-white/10'
    : 'px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 active:scale-95 transition-all border border-gray-200';

  return (
    <aside
      className={`w-72 flex flex-col gap-4 p-4 h-full overflow-y-auto ${glass} rounded-2xl`}
      aria-label="Controls"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-lg font-bold ${text}`}>Voronoi Lab</h1>
          <p className={`text-xs ${subtext}`}>Interactive diagram studio</p>
        </div>
        <button
          onClick={onToggleDark}
          className={btnSecondary}
          aria-label="Toggle dark mode"
          title="Toggle dark/light mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Divider */}
      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Generation */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Generation
        </h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={`text-xs mb-1 block ${subtext}`}>
              Point count: <strong className={text}>{settings.siteCount}</strong>
            </label>
            <input
              type="range"
              min={5}
              max={300}
              value={settings.siteCount}
              onChange={(e) => onUpdate({ siteCount: +e.target.value })}
              className="w-full accent-violet-500"
              aria-label="Number of Voronoi sites"
            />
          </div>
          <div>
            <label className={`text-xs mb-1 block ${subtext}`}>Distribution</label>
            <select
              value={settings.distribution}
              onChange={(e) => onUpdate({ distribution: e.target.value as DistributionMode })}
              className={inputCls}
              aria-label="Point distribution method"
            >
              {DISTRIBUTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onGenerate()}
            className={`${btnPrimary} w-full`}
          >
            ✨ Generate
          </button>
        </div>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Color */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Color Mode
        </h2>
        <div className="grid grid-cols-3 gap-1.5">
          {COLOR_MODES.filter((c) => c.value !== 'image').map((c) => (
            <button
              key={c.value}
              onClick={() => onUpdate({ colorMode: c.value })}
              className={`text-xs py-1.5 px-2 rounded-lg border transition-all active:scale-95 ${
                settings.colorMode === c.value
                  ? 'bg-violet-600 text-white border-violet-500 font-semibold'
                  : darkMode
                  ? 'bg-white/10 text-white/70 border-white/10 hover:bg-white/20'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Display Options */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Display
        </h2>
        <div className="flex flex-col gap-2">
          {(
            [
              ['showCellFill', 'Cell Fill'],
              ['showEdges', 'Voronoi Edges'],
              ['showDelaunay', 'Delaunay Triangulation'],
              ['showSites', 'Seed Points'],
              ['showCentroids', 'Centroids'],
            ] as [keyof AppSettings, string][]
          ).map(([key, label]) => (
            <label key={key} className={`flex items-center gap-2 cursor-pointer ${text}`}>
              <input
                type="checkbox"
                checked={settings[key] as boolean}
                onChange={(e) => onUpdate({ [key]: e.target.checked })}
                className="accent-violet-500 w-4 h-4"
                aria-label={label}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Lloyd's Relaxation */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Lloyd&apos;s Relaxation
        </h2>
        <p className={`text-xs mb-3 ${subtext}`}>
          Step: <strong className={text}>{lloydStep}</strong> — moves sites to cell centroids
        </p>
        <div className="flex gap-2">
          <button onClick={onStepLloyd} className={`${btnSecondary} flex-1`}>
            Step
          </button>
          {settings.animating ? (
            <button onClick={onStopLloyd} className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all">
              Stop
            </button>
          ) : (
            <button onClick={onStartLloyd} className="flex-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 transition-all">
              Animate
            </button>
          )}
        </div>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Image Mosaic */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Image Mosaic
        </h2>
        <p className={`text-xs mb-2 ${subtext}`}>Upload an image to recolor cells by average pixel</p>
        <label className={`${btnSecondary} block text-center cursor-pointer`}>
          📷 Choose Image
          <input
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            aria-label="Upload image for mosaic"
          />
        </label>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Interaction hint */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${subtext}`}>
          Canvas Interaction
        </h2>
        <ul className={`text-xs space-y-1 ${subtext}`}>
          <li>🖱️ <strong className={text}>Left click</strong> — add point</li>
          <li>🖱️ <strong className={text}>Right click</strong> — remove nearby point</li>
          <li>🖱️ <strong className={text}>Alt+drag</strong> — pan</li>
          <li>🖱️ <strong className={text}>Scroll</strong> — zoom</li>
        </ul>
      </section>

      <div className={darkMode ? 'border-t border-white/10' : 'border-t border-gray-200'} />

      {/* Export */}
      <section>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${subtext}`}>
          Export
        </h2>
        <div className="flex gap-2">
          <button onClick={onExportPNG} className={`${btnSecondary} flex-1`}>
            PNG
          </button>
          <button onClick={onExportSVG} className={`${btnSecondary} flex-1`}>
            SVG
          </button>
          <button onClick={onResetView} className={`${btnSecondary} flex-1`}>
            Reset
          </button>
        </div>
      </section>

      {/* Stats */}
      <div className={`text-xs ${subtext} mt-auto pt-2`}>
        Sites: <strong className={text}>{siteCount}</strong>
      </div>
    </aside>
  );
};
