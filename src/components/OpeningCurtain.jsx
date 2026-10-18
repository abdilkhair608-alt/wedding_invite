import { useEffect, useId, useState } from 'react';
import { reception } from '../data/wedding.js';

const curtainShapes = [
  'M -20 -20 H 501 C 501 280 501 720 501 1020 H -20 Z',
  'M -20 -20 H 492 C 492 280 240 720 90 1020 H -20 Z',
  'M -20 -20 H 410 C 350 250 -100 600 -160 1020 H -20 Z',
  'M -20 -20 H -40 C -100 250 -180 600 -200 1020 H -20 Z',
].join(';');

export default function OpeningCurtain() {
  const [visible, setVisible] = useState(true);
  const curtainId = useId();

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => setVisible(false);
    // Also remove the decorative overlay if animation events are unavailable.
    const timer = window.setTimeout(finish, motion.matches ? 0 : 3500);
    const handleMotionChange = (event) => {
      if (event.matches) finish();
    };
    motion.addEventListener('change', handleMotionChange);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener('change', handleMotionChange);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="opening-curtain"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === 'wedding-curtain-finish') setVisible(false);
      }}
    >
      <svg className="opening-curtain-fabric" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${curtainId}-silk`}>
            <stop offset="0" stopColor="#263b2c" />
            <stop offset="0.22" stopColor="#3c543e" />
            <stop offset="0.48" stopColor="#657a58" />
            <stop offset="0.7" stopColor="#425b40" />
            <stop offset="1" stopColor="#263b2c" />
          </linearGradient>
          <pattern id={`${curtainId}-folds`} width="50" height="1000" patternUnits="userSpaceOnUse">
            <rect width="50" height="1000" fill={`url(#${curtainId}-silk)`} />
          </pattern>
          <path id={`${curtainId}-shape`} d={curtainShapes.split(';')[0]}>
            <animate
              attributeName="d"
              values={curtainShapes}
              begin="0.55s"
              dur="2.4s"
              keyTimes="0;0.35;0.7;1"
              calcMode="spline"
              keySplines="0.45 0 0.25 1;0.4 0 0.3 1;0.4 0 0.3 1"
              fill="freeze"
            />
          </path>
        </defs>
        <g className="opening-curtain-drape" fill={`url(#${curtainId}-folds)`}>
          <use href={`#${curtainId}-shape`} />
          <use href={`#${curtainId}-shape`} transform="translate(1000 0) scale(-1 1)" />
        </g>
      </svg>
      <div className="opening-curtain-seal">
        <span>THE WEDDING OF</span>
        <div>
          Ai <em>&</em> Cici
        </div>
        <span>{`${reception.date} ${reception.month} ${reception.year}`.toUpperCase()}</span>
      </div>
    </div>
  );
}
