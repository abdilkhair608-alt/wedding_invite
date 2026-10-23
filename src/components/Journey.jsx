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
      <div className="journey-content">
        <h2 id="journey-title" className="fade-in-section">
          Our <em>Journey</em>
        </h2>
        {chapters.map((chapter) => (
          <article className="journey-chapter fade-in-section" key={chapter.title}>
            <h3>{chapter.title}</h3>
            <p className="journey-period">
              {chapter.period} — {chapter.title}
            </p>
            <p className="journey-story">{chapter.story}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
