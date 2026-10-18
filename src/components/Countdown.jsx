import { useEffect, useState } from 'react';
import { reception } from '../data/wedding.js';
import { getRemainingTime } from '../utils/countdown.js';

const units = [
  ['days', 'HARI'],
  ['hours', 'JAM'],
  ['minutes', 'MENIT'],
  ['seconds', 'DETIK'],
];

export default function Countdown() {
  const [time, setTime] = useState(() => getRemainingTime(reception.startsAt));
  useEffect(() => {
    if (time.finished) return;

    const timer = setInterval(() => {
      setTime(getRemainingTime(reception.startsAt));
    }, 1000);

    return () => clearInterval(timer);
  }, [time.finished]);

  return (
    <div className="countdown" aria-label="Hitung mundur menuju resepsi">
      {units.map(([key, label]) => (
        <div key={key}>
          <strong>{String(time[key]).padStart(2, '0')}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}
