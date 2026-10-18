import useRsvp from '../hooks/useRsvp.js';
import Icon from './Icon.jsx';

export default function Rsvp() {
  const { data, loading, saving, error, refresh, respond } = useRsvp();

  return (
    <section id="rsvp" className="rsvp-section section-space">
      <div className="rsvp-content fade-in-section">
        <div className="section-heading">
          <p className="eyebrow justify-center">KEHADIRAN ANDA BEGITU BERARTI</p>
          <h2>
            Rayakan bersama <em>kami.</em>
          </h2>
          <p>
            Berkenan hadir di hari bahagia kami?
            <br />
            Konfirmasikan kehadiran Anda melalui tombol di bawah ini.
          </p>
        </div>
        <div className="rsvp-actions" aria-label="Konfirmasi kehadiran" aria-busy={saving}>
          <button
            type="button"
            className="button button-dark"
            aria-pressed={data?.attendance === 'attending'}
            disabled={loading || !data || saving || data.attendance === 'attending'}
            onClick={() => respond('attending')}
          >
            <Icon name="heart" /> Saya akan hadir
          </button>
        </div>
        <div className="rsvp-status" aria-live="polite">
          {saving ? (
            <p>Menyimpan konfirmasi…</p>
          ) : data?.attendance === 'attending' ? (
            <p>
              Terima kasih. Konfirmasi <strong>hadir</strong> Anda sudah tersimpan.
            </p>
          ) : (
            <p>
              {loading ? 'Memuat konfirmasi kehadiran…' : 'Silakan konfirmasikan kehadiran Anda.'}
            </p>
          )}
        </div>
        {error && (
          <div className="rsvp-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={refresh} disabled={saving}>
              Coba muat ulang
            </button>
          </div>
        )}
        <dl className="rsvp-counts" aria-label="Jumlah konfirmasi kehadiran" aria-live="polite">
          <div>
            <dt>Konfirmasi hadir</dt>
            <dd>{data ? data.counts.attending.toLocaleString('id-ID') : '—'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
