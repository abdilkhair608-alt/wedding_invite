import Icon from './Icon.jsx';

export default function Quote() {
  return (
    <section className="quote-section section-space">
      <div className="mx-auto max-w-3xl text-center fade-in-section">
        <Icon name="leaf" className="mx-auto mb-7 h-9 w-9" />
        <p className="eyebrow justify-center">DENGAN CINTA DAN RIDHO-NYA</p>
        <blockquote>
          “Dan di antara tanda-tanda kebesaran-Nya ialah Dia menciptakan pasangan-pasangan untukmu
          dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia
          menjadikan di antaramu rasa kasih dan sayang.”
        </blockquote>
        <p className="quote-source">QS. Ar-Rum: 21</p>
        <span className="fine-line" />
      </div>
    </section>
  );
}
