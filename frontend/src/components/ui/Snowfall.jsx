import { useMemo } from 'react';

// A cheap CSS-only snowfall layer. Generates N flakes with randomized
// horizontal position, drift duration, delay, size and opacity. Rendered as
// a `pointer-events-none` absolutely positioned overlay so it sits above the
// content it's placed over without interfering with clicks.
const FLAKES = ['❄', '❅', '❆', '*'];

export function Snowfall({ count = 60, className = '' }) {
  const flakes = useMemo(() => {
    const rng = (min, max) => Math.random() * (max - min) + min;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      char: FLAKES[Math.floor(Math.random() * FLAKES.length)],
      left: `${rng(0, 100)}%`,
      size: `${rng(8, 20)}px`,
      duration: `${rng(6, 14)}s`,
      delay: `${rng(-14, 0)}s`,
      opacity: rng(0.35, 0.9),
      sway: `${rng(-20, 20)}px`,
    }));
  }, [count]);

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden z-[60] ${className}`}
    >
      {flakes.map((f) => (
        <span
          key={f.id}
          className="absolute top-0 text-sky-100 snowfall-flake"
          style={{
            left: f.left,
            fontSize: f.size,
            opacity: f.opacity,
            animationDuration: f.duration,
            animationDelay: f.delay,
            // Pass the sway amount to the keyframe via CSS variable
            ['--sway']: f.sway,
            textShadow: '0 0 6px rgba(186,230,253,0.5)',
          }}
        >
          {f.char}
        </span>
      ))}
    </div>
  );
}
