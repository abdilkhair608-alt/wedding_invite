export function curtainPath(progress) {
  const t = Math.min(1, Math.max(0, progress));
  const eased = t * t * (3 - 2 * t);
  const top = 501 - 550 * eased ** 2.8;
  const upperFold = 501 - 600 * eased ** 1.9;
  const lowerFold = 501 - 720 * eased ** 1.05;
  const bottom = 501 - 710 * eased;
  return `M -20 -20 H ${top} C ${upperFold} ${280 - 30 * eased} ${lowerFold} ${720 - 120 * eased} ${bottom} 1020 H -20 Z`;
}
