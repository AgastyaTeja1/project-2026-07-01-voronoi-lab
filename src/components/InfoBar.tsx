import React from 'react';
import type { VoronoiDiagram } from '../types';

interface Props {
  diagram: VoronoiDiagram | null;
  lloydStep: number;
  darkMode: boolean;
}

export const InfoBar: React.FC<Props> = ({ diagram, lloydStep, darkMode }) => {
  if (!diagram) return null;

  const totalArea = diagram.cells.reduce((sum, c) => sum + c.area, 0);
  const avgArea = diagram.cells.length ? totalArea / diagram.cells.length : 0;
  const avgNeighbors =
    diagram.cells.length
      ? diagram.cells.reduce((sum, c) => sum + c.neighborIds.length, 0) / diagram.cells.length
      : 0;

  const bar = darkMode ? 'bg-black/30 text-white/60' : 'bg-white/60 text-gray-600';
  const strong = darkMode ? 'text-white' : 'text-gray-900';

  return (
    <div
      className={`flex items-center gap-6 px-4 py-2 text-xs ${bar} backdrop-blur-sm border-t ${darkMode ? 'border-white/10' : 'border-gray-200'}`}
      role="status"
      aria-live="polite"
    >
      <span>
        Sites: <strong className={strong}>{diagram.sites.length}</strong>
      </span>
      <span>
        Edges: <strong className={strong}>{diagram.edges.length}</strong>
      </span>
      <span>
        Avg Area: <strong className={strong}>{avgArea.toFixed(0)}px²</strong>
      </span>
      <span>
        Avg Neighbors: <strong className={strong}>{avgNeighbors.toFixed(1)}</strong>
      </span>
      <span>
        Lloyd Steps: <strong className={strong}>{lloydStep}</strong>
      </span>
    </div>
  );
};
