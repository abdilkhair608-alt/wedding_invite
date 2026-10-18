export function getRemainingTime(target, now = Date.now()) {
  const seconds = Math.max(0, Math.floor((target - now) / 1000));

  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor(seconds / 3600) % 24,
    minutes: Math.floor(seconds / 60) % 60,
    seconds: seconds % 60,
    finished: now >= target,
  };
}
