import { useCallback, useState } from 'react';
import MobileMenu from './MobileMenu.jsx';

const links = [
  ['home', 'Beranda'],
  ['couple', 'Mempelai'],
  ['events', 'Acara'],
  ['rsvp', 'Konfirmasi'],
  ['gallery', 'Galeri'],
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const closeMenu = useCallback((sectionId) => {
    setOpen(false);
    if (sectionId) window.location.hash = sectionId;
  }, []);

  return (
    <header className="site-header">
      <nav
        aria-label="Navigasi utama"
        className="navbar-content mx-auto max-w-7xl px-6 py-5 md:px-12"
      >
        <a href="#home" className="monogram" aria-label="Ai dan Cici, beranda">
          A<span>&</span>C<i />
        </a>
        <div className="nav-menu hidden items-center gap-5 md:flex lg:gap-9">
          {links.map(([id, title]) => (
            <a className="nav-link" key={id} href={`#${id}`}>
              {title}
            </a>
          ))}
        </div>
        <button
          type="button"
          className="menu-button md:hidden"
          aria-expanded={open}
          aria-controls={open ? 'mobile-menu' : undefined}
          aria-label={open ? 'Tutup navigasi' : 'Buka navigasi'}
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            setOpen(true);
          }}
        >
          <svg
            className="burger-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path className="burger-line" d="M4 6h16" />
            <path className="burger-line" d="M4 12h16" />
            <path className="burger-line" d="M4 18h16" />
          </svg>
        </button>
      </nav>
      {open && <MobileMenu links={links} onClose={closeMenu} />}
    </header>
  );
}
