import Icon from './Icon.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="fade-in-section">
        <Icon name="leaf" className="mx-auto mb-8 h-9 w-9" />
        <p className="eyebrow justify-center">SEBUAH KEBAHAGIAAN BAGI KAMI</p>
        <h2>
          Sampai jumpa di
          <br />
          <em>hari bahagia kami.</em>
        </h2>
        <p>
          Terima kasih atas doa, cinta, dan kehadiran Anda.
          <br />
          Semoga langkah kami senantiasa diberkahi Allah SWT.
        </p>
        <span className="footer-signature">Ai & Cici</span>
        <span className="footer-hashtag">#AidilCiciMenyatu</span>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Ai & Cici</span>
        <span>
          MADE WITH LOVE <Icon name="heart" />
        </span>
      </div>
    </footer>
  );
}
