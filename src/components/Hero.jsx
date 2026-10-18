import garden from '../assets/wedding-garden.jpg';
import Icon from './Icon.jsx';
import { reception } from '../data/wedding.js';

export default function Hero() {
  return (
    <section id="home" className="hero-section">
      <img
        className="hero-background"
        src={garden}
        alt="Ilustrasi pelaminan taman dengan lengkungan mawar putih dan dedaunan hijau"
        fetchPriority="high"
        width="1536"
        height="1024"
      />
      <div className="hero-copy fade-in-section is-visible">
        <div className="eyebrow">
          <span /> THE WEDDING OF <span />
        </div>
        <h1>
          Ai <em>&</em>
          Cici<span className="hero-period">.</span>
        </h1>
        <p className="hero-subtitle">
          Dua hati, satu perjalanan.
          <br />
          Sebuah awal untuk selamanya.
        </p>
        <div className="hero-date">
          <time dateTime={new Date(reception.startsAt).toISOString()}>
            {`${reception.day}, ${reception.date} ${reception.month} ${reception.year}`}
          </time>
          <p>Bukittinggi, Sumatera Barat</p>
        </div>
        <div className="hero-actions">
          <a className="button button-dark" href="#events">
            Lihat detail acara <Icon name="arrow" />
          </a>
          <a className="button hero-rsvp-link" href="#rsvp">
            Konfirmasi kehadiran <Icon name="heart" />
          </a>
        </div>
      </div>
    </section>
  );
}
