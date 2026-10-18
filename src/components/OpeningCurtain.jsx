import { useEffect, useId, useRef, useState } from 'react';
import { reception } from '../data/wedding.js';
import { curtainPath } from '../utils/curtain.js';

export default function OpeningCurtain() {
  const [visible, setVisible] = useState(true);
  const curtainId = useId();
  const overlayRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const startedAt = performance.now();
    let frame;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      setVisible(false);
    };
    const draw = (now) => {
      if (finished) return;
      const elapsed = now - startedAt;
      const path = curtainPath(elapsed / 2400);
      leftRef.current?.setAttribute('d', path);
      rightRef.current?.setAttribute('d', path);
      if (overlayRef.current) {
        overlayRef.current.style.opacity = String(
          Math.max(0, 1 - Math.max(0, elapsed - 2400) / 200),
        );
      }
      if (elapsed >= 2600) finish();
      else frame = requestAnimationFrame(draw);
    };
    // A wall-clock deadline also removes the overlay if rendering is suspended.
    const timer = window.setTimeout(finish, motion.matches ? 0 : 3000);
    if (!motion.matches) frame = requestAnimationFrame(draw);
    const handleMotionChange = (event) => {
      if (event.matches) finish();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') finish();
    };
    const handlePageShow = (event) => {
      if (event.persisted) finish();
    };
    motion.addEventListener('change', handleMotionChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    return () => {
      finished = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      motion.removeEventListener('change', handleMotionChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={overlayRef} className="opening-curtain" aria-hidden="true">
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
        </defs>
        <g className="opening-curtain-drape" fill={`url(#${curtainId}-folds)`}>
          <path ref={leftRef} d={curtainPath(0)} />
          <path ref={rightRef} d={curtainPath(0)} transform="translate(1000 0) scale(-1 1)" />
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
