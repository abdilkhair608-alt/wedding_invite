import Countdown from './Countdown.jsx';
import Icon from './Icon.jsx';
import { events } from '../data/wedding.js';

export default function Events() {
  return (
    <section id="events" className="events-section section-space">
      <div className="section-heading fade-in-section">
        <p className="eyebrow justify-center">SEBUAH HARI YANG KAMI NANTIKAN</p>
        <h2>
          Waktu untuk <em>merayakan.</em>
        </h2>
        <p>
          Dengan memohon rahmat dan ridho Allah SWT,
          <br />
          kami bermaksud menyelenggarakan pernikahan kami pada:
        </p>
      </div>
      <div className="events-grid mx-auto max-w-5xl">
        {events.map((event) => (
          <article className="event-card fade-in-section" key={event.id}>
            <div className="event-topline">
              <Icon name={event.mapUrl ? 'heart' : 'leaf'} />
              <span>{event.number} / THE CELEBRATION</span>
            </div>
            <h3>{event.title}</h3>
            <div className="event-date">
              <strong>{event.date}</strong>
              <div>
                <span>{event.day.toUpperCase()}</span>
                <span>
                  {event.month.toUpperCase()} {event.year}
                </span>
              </div>
            </div>
            <p className="event-time">
              <Icon name="clock" />
              {event.time}
            </p>
            <div className="event-location">
              <Icon name="pin" />
              <div>
                <h4>{event.place}</h4>
                <p>{event.address}</p>
              </div>
            </div>
            {event.mapUrl ? (
              <a
                className="button button-dark"
                href={event.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Lihat peta lokasi <Icon name="arrow" />
              </a>
            ) : (
              <p className="event-blessing">Semoga menjadi awal yang penuh berkah.</p>
            )}
          </article>
        ))}
      </div>
      <div className="countdown-wrap fade-in-section">
        <p className="eyebrow justify-center">MENGHITUNG HARI MENUJU BAHAGIA</p>
        <Countdown />
      </div>
    </section>
  );
}
