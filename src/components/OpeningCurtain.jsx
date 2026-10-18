import { useEffect, useState } from 'react';
import { reception } from '../data/wedding.js';

export default function OpeningCurtain() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => setVisible(false);
    // Also remove the decorative overlay if animation events are unavailable.
    const timer = window.setTimeout(finish, motion.matches ? 0 : 2800);
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
    <div className="opening-curtain" aria-hidden="true">
      <div className="opening-curtain-panel opening-curtain-left" />
      <div
        className="opening-curtain-panel opening-curtain-right"
        onAnimationEnd={(event) => {
          if (event.animationName === 'wedding-curtain-right') setVisible(false);
        }}
      />
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
