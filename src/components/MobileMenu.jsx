import { useEffect, useRef, useState } from 'react';
import useModalDialog from '../hooks/useModalDialog.js';
import Icon from './Icon.jsx';

export default function MobileMenu({ links, onClose }) {
  const dialogRef = useModalDialog();
  const [closing, setClosing] = useState(false);
  const destinationRef = useRef(null);

  useEffect(() => {
    if (!closing) return;

    let active = true;
    const animations = dialogRef.current?.getAnimations?.() ?? [];
    Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (active) onClose(destinationRef.current);
    });

    return () => {
      active = false;
    };
  }, [closing, dialogRef, onClose]);

  function requestClose(sectionId = null) {
    if (closing) return;
    destinationRef.current = sectionId;
    setClosing(true);
  }

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)');
    function closeOnDesktop(event) {
      if (event.matches) onClose();
    }
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, [onClose]);

  function handleCancel(event) {
    event.preventDefault();
    requestClose();
  }

  return (
    <dialog
      ref={dialogRef}
      id="mobile-menu"
      className="mobile-menu"
      data-closing={closing}
      aria-labelledby="mobile-menu-title"
      onCancel={handleCancel}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="mobile-menu-panel">
        <div className="mobile-menu-heading">
          <h2 id="mobile-menu-title">
            Ai <em>&</em> Cici
          </h2>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => requestClose()}
            aria-label="Tutup navigasi"
            autoFocus
          >
            <Icon name="close" />
          </button>
        </div>
        <nav aria-label="Navigasi ponsel">
          {links.map(([id, title], index) => (
            <a
              key={id}
              href={`#${id}`}
              style={{ '--menu-item-index': index }}
              onClick={(event) => {
                event.preventDefault();
                requestClose(id);
              }}
            >
              <span className="mobile-nav-index" aria-hidden="true">
                0{index + 1}
              </span>
              <span>{title}</span>
              <Icon name="arrow" />
            </a>
          ))}
        </nav>
      </div>
    </dialog>
  );
}
