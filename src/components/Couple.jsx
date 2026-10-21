import bouquet from '../assets/bridal-bouquet.jpg';
import rings from '../assets/wedding-rings.jpg';

export default function Couple() {
  return (
    <section id="couple" className="section-space">
      <div className="section-heading fade-in-section">
        <p className="eyebrow justify-center">BISMILLAHIRRAHMANIRRAHIM</p>
        <h2>
          Dua hati yang <em>dipertemukan.</em>
        </h2>
        <p>
          Dengan penuh rasa syukur, kami mengundang Bapak/Ibu/Saudara/i
          <br className="hidden md:block" /> untuk menjadi bagian dari hari bahagia kami.
        </p>
      </div>
      <div className="couple-layout mx-auto max-w-5xl">
        <article className="couple-person fade-in-section">
          <div className="portrait-frame">
            <img
              src={rings}
              alt="Ilustrasi dua cincin emas dalam kotak beludru sage"
              loading="lazy"
              width="1536"
              height="1024"
            />
            <span>A</span>
          </div>
          <p className="eyebrow justify-center mt-8">MEMPELAI PRIA</p>
          <h3>
            Mis Aidil Fajri<span> A.Md</span>
          </h3>
          <p>
            Putra dari
            <br />
            <strong>Bapak Zainul St.Bandaro</strong>
            <br />& Ibu Fitrawati, S.Ag
          </p>
          <span className="signature">Ai</span>
        </article>
        <span className="couple-ampersand" aria-hidden="true">
          &
        </span>
        <article className="couple-person fade-in-section">
          <div className="portrait-frame">
            <img
              src={bouquet}
              alt="Ilustrasi buket pengantin mawar ivory dengan pita sutra"
              loading="lazy"
              width="1536"
              height="1024"
            />
            <span>C</span>
          </div>
          <p className="eyebrow justify-center mt-8">MEMPELAI WANITA</p>
          <h3>
            Aknesia Laurenza<span>, S.Pd</span>
          </h3>
          <p>
            Putri dari
            <br />
            <strong>Bapak Akmal Yulisa</strong>
            <br />& Ibu Emniriza (almarhum)
          </p>
          <span className="signature">Cici</span>
        </article>
      </div>
    </section>
  );
}
