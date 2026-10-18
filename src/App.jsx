import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Quote from './components/Quote.jsx';
import Couple from './components/Couple.jsx';
import Events from './components/Events.jsx';
import Rsvp from './components/Rsvp.jsx';
import Gallery from './components/Gallery.jsx';
import Footer from './components/Footer.jsx';
import OpeningCurtain from './components/OpeningCurtain.jsx';
import useScrollReveal from './hooks/useScrollReveal.js';

export default function App() {
  const pageRef = useScrollReveal();

  return (
    <div ref={pageRef}>
      <OpeningCurtain />
      <Navbar />
      <main>
        <Hero />
        <Quote />
        <Couple />
        <Events />
        <Rsvp />
        <Gallery />
      </main>
      <Footer />
    </div>
  );
}
