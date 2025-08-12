import React, { useEffect, useMemo, useState } from 'react';

const WatermarkOverlay = ({ text, density = 6, opacity = 0.08, fontSize = 14, rotateDeg = -30 }) => {
  const [timestamp, setTimestamp] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTimestamp(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const displayText = useMemo(() => {
    const ts = timestamp.toLocaleString();
    return `${text || ''} • ${ts}`.trim();
  }, [text, timestamp]);

  const items = useMemo(() => {
    const rows = density;
    const cols = density + 2;
    const arr = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        arr.push(`${r}-${c}`);
      }
    }
    return arr;
  }, [density]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[45] print:block"
      style={{
        mixBlendMode: 'multiply',
      }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: `rotate(${rotateDeg}deg)`,
          transformOrigin: 'center',
          display: 'grid',
          gridTemplateRows: `repeat(${density}, 1fr)`,
          gridTemplateColumns: `repeat(${density + 2}, 1fr)`,
          gap: '48px',
          opacity,
        }}
      >
        {items.map((key) => (
          <div
            key={key}
            className="flex items-center justify-center select-none"
            style={{
              fontSize,
              color: '#0f172a',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {displayText}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatermarkOverlay;


