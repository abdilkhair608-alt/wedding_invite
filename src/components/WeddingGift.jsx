import { useState } from 'react';
import Icon from './Icon.jsx';
import { gift, giftAccounts, giftTypes } from '../data/gift.js';
import { buildGiftConfirmationUrl } from '../utils/gift.js';

export default function WeddingGift() {
  const [type, setType] = useState('transfer');
  const [copyStatus, setCopyStatus] = useState('');
  const [manualCopy, setManualCopy] = useState('');
  const [error, setError] = useState('');

  async function copy(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      setManualCopy('');
      setCopyStatus(`${label} berhasil disalin.`);
    } catch {
      setManualCopy(text);
      setCopyStatus('Salin otomatis belum tersedia. Pilih dan salin teks pada kolom berikut.');
    }
  }

  function confirm(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    try {
      const url = buildGiftConfirmationUrl({
        sender: values.get('sender'),
        type,
        bankId: values.get('bank'),
        amount: values.get('amount') || '',
      });
      setError('');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setError(error.message);
    }
  }

  return (
    <section id="gift" className="gift-section section-space" aria-labelledby="gift-title">
      <div className="gift-content fade-in-section">
        <div className="section-heading">
          <p className="eyebrow justify-center">TANDA KASIH UNTUK KAMI</p>
          <h2 id="gift-title">
            Wedding <em>Gift</em>
          </h2>
          <p>
            Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Jika ingin berbagi tanda
            kasih, Anda dapat mengirimkan hadiah melalui rekening atau alamat berikut.
          </p>
        </div>
        <details className="gift-disclosure">
          <summary className="button button-dark">
            Lihat rekening & alamat <Icon name="gift" />
          </summary>
          <div className="gift-accounts">
            {giftAccounts.map((account) => (
              <article className={`gift-bank gift-bank-${account.id}`} key={account.id}>
                <div className="gift-bank-heading">
                  <span className="gift-bank-brand">{account.bank}</span>
                  <span>TRANSFER BANK</span>
                </div>
                <p className="gift-account-number">{account.number}</p>
                <p className="gift-account-holder">a.n. {gift.recipient}</p>
                <button
                  type="button"
                  className="button gift-copy"
                  onClick={() => copy(account.number, `Nomor rekening ${account.bank}`)}
                >
                  <Icon name="copy" /> Salin rekening
                </button>
              </article>
            ))}
          </div>
          <article className="gift-address">
            <Icon name="gift" />
            <div>
              <h3>Kirim kado</h3>
              <p className="gift-recipient">Penerima: {gift.recipient}</p>
              <address>{gift.address}</address>
              <button
                type="button"
                className="button gift-copy"
                onClick={() => copy(`${gift.recipient}\n${gift.address}`, 'Alamat kirim kado')}
              >
                <Icon name="copy" /> Salin alamat
              </button>
            </div>
          </article>
          <div className="gift-copy-status" role="status">
            {copyStatus && <p>{copyStatus}</p>}
            {manualCopy && (
              <textarea
                aria-label="Teks untuk disalin manual"
                readOnly
                value={manualCopy}
                onFocus={(event) => event.currentTarget.select()}
              />
            )}
          </div>
        </details>
        <form className="gift-confirmation" onSubmit={confirm}>
          <h3>Konfirmasi hadiah</h3>
          <p>Konfirmasi Anda akan diteruskan ke WhatsApp kami.</p>
          <div className="gift-fields">
            <label htmlFor="gift-sender">
              Nama pengirim
              <input
                id="gift-sender"
                name="sender"
                autoComplete="name"
                maxLength={80}
                required
                placeholder="Nama Anda"
              />
            </label>
            <label htmlFor="gift-type">
              Jenis hadiah
              <select
                id="gift-type"
                name="type"
                value={type}
                onChange={(event) => {
                  setType(event.target.value);
                  setError('');
                }}
              >
                {Object.entries(giftTypes).map(([value, title]) => (
                  <option key={value} value={value}>
                    {title}
                  </option>
                ))}
              </select>
            </label>
            {type !== 'parcel' && (
              <>
                <label htmlFor="gift-bank">
                  Rekening tujuan
                  <select id="gift-bank" name="bank" defaultValue="bri">
                    {giftAccounts.map((account) => (
                      <option value={account.id} key={account.id}>
                        {account.bank} — {account.number}
                      </option>
                    ))}
                  </select>
                </label>
                <label htmlFor="gift-amount">
                  Nominal (opsional)
                  <input
                    id="gift-amount"
                    name="amount"
                    type="number"
                    min="1"
                    max="999999999999"
                    step="1"
                    inputMode="numeric"
                    placeholder="Nominal dalam rupiah"
                  />
                </label>
              </>
            )}
          </div>
          {error && (
            <p className="gift-form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="button button-dark gift-confirm-button">
            Konfirmasi via WhatsApp <Icon name="arrow" />
          </button>
        </form>
      </div>
    </section>
  );
}
