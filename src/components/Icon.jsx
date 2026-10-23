const paths = {
  gift: 'M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z',
  home: 'M3 10l9-7 9 7v11h-6v-7H9v7H3z',
  calendar: 'M4 5h16v16H4zM8 3v4m8-4v4M4 10h16m-11 4h1m4 0h1m-6 3h1',
  image: 'M3 4h18v16H3zM3 16l6-6 5 5 3-3 4 4M15 8h.01',
  envelope: 'M3 5h18v14H3zM3 6l9 7 9-7',
  copy: 'M8 8h13v13H8zM16 8V3H3v13h5',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  clock: 'M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  close: 'm6 6 12 12M6 18 18 6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  leaf: 'M5 20C5 12 12 5 20 4c0 9-4 15-10 15-4 0-6-4-4-7m-3 9L16 8',
};

export default function Icon({ name, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.heart} />
    </svg>
  );
}
