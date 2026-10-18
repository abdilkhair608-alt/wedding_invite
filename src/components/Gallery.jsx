import { useState } from 'react';
import garden from '../assets/wedding-garden.jpg';
import bouquet from '../assets/bridal-bouquet.jpg';
import rings from '../assets/wedding-rings.jpg';
import Icon from './Icon.jsx';
import Lightbox from './Lightbox.jsx';

const photos = [
  {
    src: garden,
    title: 'A beautiful beginning',
    alt: 'Ilustrasi pelaminan taman dengan mawar ivory',
    className: 'gallery-wide',
  },
  {
    src: bouquet,
    title: 'Love in every little detail',
    alt: 'Ilustrasi buket mawar putih dan dedaunan sage',
  },
  { src: rings, title: 'A promise, forever', alt: 'Ilustrasi dua cincin pernikahan emas' },
];

export default function Gallery() {
  const [selected, setSelected] = useState(null);

  function openPhoto(event, photo) {
    event.currentTarget.focus({ preventScroll: true });
    setSelected(photo);
  }

  return (
    <section id="gallery" className="gallery-section section-space">
      <div className="gallery-heading fade-in-section">
        <div>
          <p className="eyebrow">LITTLE THINGS, LOTS OF LOVE</p>
          <h2>
            Nuansa hari <em>bahagia.</em>
          </h2>
        </div>
        <p>
          Sentuhan sederhana untuk sebuah
          <br />
          perayaan yang penuh makna.
        </p>
      </div>
      <div className="gallery-grid">
        {photos.map((photo) => (
          <button
            type="button"
            className={`gallery-photo fade-in-section ${photo.className || ''}`}
            key={photo.src}
            onClick={(event) => openPhoto(event, photo)}
            aria-label={`Perbesar: ${photo.alt}`}
          >
            <img src={photo.src} alt={photo.alt} loading="lazy" width="1536" height="1024" />
            <span className="gallery-overlay">
              <span>{photo.title}</span>
              <Icon name="expand" />
            </span>
          </button>
        ))}
      </div>
      {selected && <Lightbox photo={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
