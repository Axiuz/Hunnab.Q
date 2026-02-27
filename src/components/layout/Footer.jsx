import { useEffect, useState } from 'react';

const FOOTER_SLIDES = [
  { src: '/imagenes/Collar_Arbolvida.jpeg', alt: 'Collar arbol de vida' },
  { src: '/imagenes/Anillo_Modelo.jpeg', alt: 'Anillo modelo' },
  { src: '/imagenes/Collar_Libelula.jpeg', alt: 'Collar libelula' },
];

/** Pie de pagina con carrusel visual y datos de contacto. */
function Footer() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % FOOTER_SLIDES.length);
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  // Render
  return (
    <>
      <section className="carousel" aria-label="Carrusel de imagenes">
        <div className="carousel__viewport">
          <div
            className="carousel__track"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {FOOTER_SLIDES.map((slide) => (
              <figure key={slide.src} className="carousel__slide">
                <img src={slide.src} alt={slide.alt} />
              </figure>
            ))}
          </div>
        </div>
        <div className="carousel__dots" role="tablist" aria-label="Seleccion de imagen">
          {FOOTER_SLIDES.map((slide, idx) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              className={`carousel__dot ${idx === activeIndex ? 'is-active' : ''}`}
              aria-label={`Ir a imagen ${idx + 1}`}
              aria-selected={idx === activeIndex ? 'true' : 'false'}
              onClick={() => setActiveIndex(idx)}
            />
          ))}
        </div>
      </section>

      <section className="footer-contact" aria-label="Informacion de contacto">
        <div className="footer-contact__inner">
          <a
            className="footer-contact__item"
            href="https://maps.google.com/?q=Plaza%20de%20la%20Republica"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="footer-contact__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 2c-3.86 0-7 3.14-7 7 0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
              </svg>
            </span>
            <span className="footer-contact__text">Location</span>
          </a>

          <a className="footer-contact__item" href="tel:+523325362722">
            <span className="footer-contact__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.85 21 3 13.15 3 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" />
              </svg>
            </span>
            <span className="footer-contact__text">+52 33 2536 2722</span>
          </a>

          <a className="footer-contact__item" href="mailto:hunnab.q.ventas@gmail.com">
            <span className="footer-contact__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
              </svg>
            </span>
            <span className="footer-contact__text">hunnab.q.ventas@gmail.com</span>
          </a>
        </div>
      </section>

      <div className="copyright">
        <div className="container">
          <p>
            <b>2026 All Rights Reserved HOIM.</b> Made with love by{' '}
            <a href="https://www.instagram.com/hunnab.q/" target="_blank" rel="noopener noreferrer">
              @ HUNNAB.Q
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export default Footer;
