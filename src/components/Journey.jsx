const chapters = [
  {
    title: 'Teman Biasa',
    period: '2005–2015',
    story:
      'Kami hanyalah teman sekolah biasa. Satu angkatan, satu seragam. Tidak ada cinta, hanya saling sapa di lorong sekolah. Setelah lulus, kami berpisah dan menjalani hidup masing-masing.',
  },
  {
    title: 'Bertemu Kembali',
    period: 'Awal 2026',
    story:
      'Bukan di reuni, bukan di acara besar. Kami bertemu kembali secara sederhana di dekat rumah. Obrolan singkat yang ternyata membuka kembali cerita yang sempat tertutup 11 tahun.',
  },
  {
    title: 'Lamaran',
    period: 'Agustus 2026',
    story:
      'Dari pertemuan sederhana itu, kami saling mengenal kembali sebagai orang dewasa. Dan pada bulan Agustus 2026, dengan niat baik dan restu keluarga, sebuah lamaran dilaksanakan.',
  },
];

export default function Journey() {
  return (
    <section className="journey-section section-space" aria-labelledby="journey-title">
      <div className="journey-decoration journey-decoration-top" aria-hidden="true">
        <Icon name="leaf" />
      </div>
      <div className="journey-decoration journey-decoration-bottom" aria-hidden="true">
        <Icon name="leaf" />
      </div>
      <div className="journey-content">
        <header className="journey-heading fade-in-section">
          <p className="eyebrow justify-center">CERITA PERJALANAN KAMI</p>
          <h2 id="journey-title">
            Our <em>Journey</em>
          </h2>
          <span className="fine-line" aria-hidden="true" />
        </header>
        <ol className="journey-timeline">
          {chapters.map((chapter, index) => (
            <li className="journey-chapter fade-in-section" key={chapter.title}>
              <span className="journey-step" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <article className="journey-card">
                <header>
                  <p className="journey-period">{chapter.period}</p>
                  <h3>{chapter.title}</h3>
                </header>
                <p className="journey-story">{chapter.story}</p>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
import Icon from './Icon.jsx';
