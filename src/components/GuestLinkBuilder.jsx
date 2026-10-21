import { useState } from 'react';
import InvitationCover from './InvitationCover.jsx';
import Icon from './Icon.jsx';
import {
  buildGuestLink,
  buildInvitationMessage,
  guestNameLimit,
  normalizeGuestName,
} from '../utils/invitation.js';

export default function GuestLinkBuilder() {
  const [name, setName] = useState('');
  const [guest, setGuest] = useState(null);
  const [status, setStatus] = useState('');
  const [copyFailed, setCopyFailed] = useState(false);
  const link = guest ? buildGuestLink(window.location.href, guest) : '';
  const message = guest ? buildInvitationMessage(guest, link) : '';

  function generate(event) {
    event.preventDefault();
    const normalized = normalizeGuestName(name);
    if (!normalized) {
      setStatus('Masukkan nama tamu terlebih dahulu.');
      return;
    }
    setGuest(normalized);
    setCopyFailed(false);
    setStatus(`Undangan untuk ${normalized} siap dibagikan.`);
  }

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFailed(false);
      setStatus(`${label} berhasil disalin.`);
    } catch {
      setCopyFailed(true);
      setStatus(
        'Salin otomatis belum tersedia. Pilih teks pada kolom di bawah lalu salin secara manual.',
      );
    }
  }

  return (
    <main className="guest-builder">
      <header className="guest-builder-header">
        <a href={window.location.pathname} aria-label="Lihat undangan Ai dan Cici">
          Ai <span>&</span> Cici
        </a>
        <span>UNTUK ORANG-ORANG TERSAYANG</span>
      </header>
      <div className="guest-builder-layout">
        <section className="guest-builder-editor">
          <p className="eyebrow">BAGIKAN HARI BAHAGIA</p>
          <h1>
            Satu undangan.
            <br />
            <em>Sentuhan personal.</em>
          </h1>
          <p className="guest-builder-intro">
            Tuliskan nama tamu, buat tautannya, lalu kirimkan undangan dengan sapaan khusus untuk
            mereka.
          </p>
          <form onSubmit={generate} className="guest-builder-form">
            <label htmlFor="guest-name">Nama tamu undangan</label>
            <input
              id="guest-name"
              name="guest-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setStatus('');
              }}
              placeholder="Contoh: Abdil dan partner"
              required
              maxLength={guestNameLimit}
              autoComplete="off"
              aria-describedby="guest-name-help"
            />
            <p id="guest-name-help">
              Tulis nama beserta gelar atau pendamping sesuai yang ingin ditampilkan.
            </p>
            <button className="button button-dark" type="submit">
              Buat tautan undangan <Icon name="arrow" />
            </button>
          </form>
          <p className="guest-builder-feedback" role="status">
            {status}
          </p>
          {guest && (
            <section className="guest-builder-result" aria-label={`Undangan untuk ${guest}`}>
              <p className="eyebrow">SIAP DIKIRIM</p>
              <h2>{guest}</h2>
              <label htmlFor="guest-link">Tautan undangan</label>
              <input
                id="guest-link"
                value={link}
                readOnly
                onFocus={(event) => event.target.select()}
              />
              <div className="guest-builder-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => copy(link, 'Tautan')}
                >
                  <Icon name="copy" />
                  Salin tautan
                </button>
                <a
                  className="button button-outline"
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lihat undangan <Icon name="arrow" />
                </a>
              </div>
              <label htmlFor="guest-message">Pesan pengantar</label>
              <textarea
                id="guest-message"
                readOnly
                value={message}
                rows={10}
                onFocus={(event) => {
                  if (copyFailed) event.target.select();
                }}
              />
              <div className="guest-builder-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => copy(message, 'Pesan')}
                >
                  <Icon name="copy" />
                  Salin pesan
                </button>
                <a
                  className="button button-dark"
                  href={`https://wa.me/?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Kirim via WhatsApp <Icon name="arrow" />
                </a>
              </div>
              <p className="guest-builder-help">
                Untuk tamu berikutnya, ganti nama di atas lalu tekan Buat tautan undangan. Tautan
                yang sudah dikirim tetap berlaku.
              </p>
            </section>
          )}
        </section>
        <aside className="guest-builder-preview" aria-label="Pratinjau sampul">
          <p>PRATINJAU SAMPUL</p>
          <InvitationCover guestName={guest || normalizeGuestName(name)} preview />
        </aside>
      </div>
    </main>
  );
}
