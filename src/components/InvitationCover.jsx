import garden from '../assets/wedding-garden.jpg';
import Icon from './Icon.jsx';
import { reception } from '../data/wedding.js';

export default function InvitationCover({ guestName, onOpen, preview = false }) {
  return (
    <section
      className={`invitation-cover${preview ? ' invitation-cover-preview' : ''}`}
      aria-label="Sampul undangan pernikahan"
    >
      <div className="cover-leaves cover-leaves-top" aria-hidden="true">
        <Icon name="leaf" />
        <Icon name="leaf" />
        <Icon name="leaf" />
      </div>
      <div className="cover-leaves cover-leaves-bottom" aria-hidden="true">
        <Icon name="leaf" />
        <Icon name="leaf" />
        <Icon name="leaf" />
      </div>
      <div className="cover-card">
        <p className="cover-eyebrow">THE WEDDING OF</p>
        <div className="cover-picture">
          <img
            src={garden}
            alt="Ilustrasi taman pernikahan dengan mawar putih"
            width="1536"
            height="1024"
            fetchPriority={preview ? 'auto' : 'high'}
          />
          <span className="cover-monogram" aria-hidden="true">
            A <i>&</i> C
          </span>
        </div>
        <h1 className="cover-names">
          Ai <span>&</span> Cici
        </h1>
        <p className="cover-date">
          {reception.date} {reception.month} {reception.year}
        </p>
        <div className="cover-divider" aria-hidden="true">
          <span />
          <Icon name="leaf" />
          <span />
        </div>
        <p className="cover-salutation">Kepada Yth. Bapak/Ibu/Saudara/i</p>
        <h2 className="cover-guest">{guestName || 'Tamu Undangan'}</h2>
        <p className="cover-description">
          Dengan penuh rasa syukur, kami mengundang Anda untuk menjadi bagian dari hari bahagia
          kami.
        </p>
        {preview ? (
          <span className="button button-dark cover-open">
            <Icon name="envelope" /> Buka Undangan
          </span>
        ) : (
          <button type="button" className="button button-dark cover-open" onClick={onOpen}>
            <Icon name="envelope" /> Buka Undangan
          </button>
        )}
        <p className="cover-note">
          Mohon maaf apabila terdapat kesalahan
          <br />
          penulisan nama atau gelar.
        </p>
      </div>
    </section>
  );
}
