import React, { useState } from 'react';

interface Props {
  darkMode: boolean;
  onClose: () => void;
}

export const WelcomeModal: React.FC<Props> = ({ darkMode, onClose }) => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center p-4';
  const backdrop = darkMode ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/30 backdrop-blur-sm';
  const card = darkMode
    ? 'bg-gray-900/90 border border-white/15 text-white max-w-md w-full rounded-2xl p-6 shadow-2xl'
    : 'bg-white/95 border border-gray-200 text-gray-900 max-w-md w-full rounded-2xl p-6 shadow-2xl';
  const subtext = darkMode ? 'text-white/60' : 'text-gray-500';
  const badge = darkMode
    ? 'bg-violet-900/60 text-violet-200 px-2 py-0.5 rounded text-xs'
    : 'bg-violet-100 text-violet-800 px-2 py-0.5 rounded text-xs';

  return (
    <div className={overlay} role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <div className={`absolute inset-0 ${backdrop}`} onClick={handleClose} aria-hidden="true" />
      <div className={`relative ${card}`} style={{ animation: 'fadeInUp 0.3s ease' }}>
        <h2 id="welcome-title" className="text-2xl font-bold mb-1">
          Voronoi Lab
        </h2>
        <p className={`text-sm mb-4 ${subtext}`}>
          Interactive diagram studio — explore the geometry of proximity
        </p>

        <div className="space-y-3 mb-6">
          <Feature emoji="📐" title="Fortune's Algorithm" desc="The sweep-line algorithm that computes Voronoi diagrams in O(n log n)" badge={badge} />
          <Feature emoji="⚖️" title="Lloyd's Relaxation" desc="Iteratively move sites to cell centroids for uniform distributions" badge={badge} />
          <Feature emoji="🔺" title="Delaunay Dual" desc="Toggle the dual Delaunay triangulation overlay" badge={badge} />
          <Feature emoji="🖼️" title="Image Mosaic" desc="Upload any image — each cell gets the average color of covered pixels" badge={badge} />
          <Feature emoji="🎨" title="6 Color Palettes" desc="Plus area-based and neighbor-count-based color modes" badge={badge} />
        </div>

        <p className={`text-xs mb-4 ${subtext}`}>
          <strong>Tip:</strong> Left-click to add points · Right-click to remove · Scroll to zoom · Alt+drag to pan
        </p>

        <button
          onClick={handleClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition-all shadow-lg"
          autoFocus
        >
          Start Exploring ✨
        </button>
      </div>
    </div>
  );
};

const Feature: React.FC<{
  emoji: string;
  title: string;
  desc: string;
  badge: string;
}> = ({ emoji, title, desc, badge }) => (
  <div className="flex gap-3 items-start">
    <span className="text-xl leading-none mt-0.5">{emoji}</span>
    <div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">{title}</span>
        <span className={badge}>✓</span>
      </div>
      <p className="text-xs opacity-70 mt-0.5">{desc}</p>
    </div>
  </div>
);
