import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

const links = [
  ['home', 'Beranda', 'home'],
  ['couple', 'Mempelai', 'heart'],
  ['events', 'Acara', 'calendar'],
  ['rsvp', 'Konfirmasi', 'envelope'],
  ['gallery', 'Galeri', 'image'],
];

export default function Navbar() {
  const [active, setActive] = useState('home');

  useEffect(() => {
    const sections = links.map(([id]) => document.getElementById(id)).filter(Boolean);
    let frame = null;
    function updateActive() {
      frame = null;
      const marker = window.innerHeight * 0.35;
      let current = 'home';
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= marker) current = section.id;
      }
      setActive(current);
    }
    function scheduleUpdate() {
      if (frame === null) frame = window.requestAnimationFrame(updateActive);
    }
    updateActive();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    return () => {
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
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
      </nav>
      <nav className="mobile-bottom-nav" aria-label="Navigasi ponsel">
        {links.map(([id, title, icon]) => (
          <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
            <Icon name={icon} />
            <span>{title}</span>
          </a>
        ))}
      </nav>
    </header>
  );
}
