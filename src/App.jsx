import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import Quote from './components/Quote.jsx';
import Couple from './components/Couple.jsx';
import Events from './components/Events.jsx';
import Rsvp from './components/Rsvp.jsx';
import Gallery from './components/Gallery.jsx';
import Footer from './components/Footer.jsx';
import useScrollReveal from './hooks/useScrollReveal.js';
import { useEffect, useRef, useState } from 'react';
import InvitationCover from './components/InvitationCover.jsx';
import GuestLinkBuilder from './components/GuestLinkBuilder.jsx';
import { readGuestName } from './utils/invitation.js';

export default function App() {
  const [opened, setOpened] = useState(false);
  const params = new URLSearchParams(window.location.search);
  if (params.get('kelola') === 'undangan') return <GuestLinkBuilder />;
  if (!opened) {
    return (
      <InvitationCover
        guestName={readGuestName(window.location.href)}
        onOpen={() => setOpened(true)}
      />
    );
  }
  return <WeddingPage />;
}

function WeddingPage() {
  const pageRef = useScrollReveal();
  const contentRef = useRef(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    contentRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div ref={pageRef} className="wedding-page">
      <Navbar />
      <main ref={contentRef} tabIndex={-1} className="wedding-main">
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
