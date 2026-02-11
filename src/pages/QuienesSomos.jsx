import { useState } from 'react';

const SLIDES = [
  {
    title: 'Mision',
    text:
      'Crear piezas artesanales unicas que conecten con la esencia y el valor de lo hecho con intencion.',
  },
  {
    title: 'Vision',
    text:
      'Inspirar una comunidad creativa que valore lo hecho a mano y use la artesania para transformar su vida.',
  },
  {
    title: 'Valores',
    text: 'Artesania consciente, creatividad, autenticidad, colaboracion y empoderamiento.',
  },
];

function AboutPage() {
  const [index, setIndex] = useState(0);

  return (
    <>
      <div className="hero">
        <h1>Quienes Somos</h1>
        <p>
          Desde 2019, Hunnab.Q es un proyecto artesanal enfocado en joyeria y accesorios
          hechos con dedicacion.
        </p>
      </div>
      <div className="hero" style={{ marginTop: '16px' }}>
        <h2 style={{ margin: '0 0 8px' }}>Valores de la Empresa</h2>
        <div className="simple-carousel" data-simple-carousel>
          <button
            className="simple-nav simple-prev"
            type="button"
            aria-label="Anterior"
            onClick={() => setIndex((index - 1 + SLIDES.length) % SLIDES.length)}
          >
            {'<'}
          </button>
          <div className="simple-track">
            <div className="simple-slide">
              <div>
                <strong>{SLIDES[index].title}</strong>
                <p style={{ margin: '6px 0 0', color: 'var(--muted)' }}>{SLIDES[index].text}</p>
              </div>
            </div>
          </div>
          <button
            className="simple-nav simple-next"
            type="button"
            aria-label="Siguiente"
            onClick={() => setIndex((index + 1) % SLIDES.length)}
          >
            {'>'}
          </button>
        </div>
      </div>
    </>
  );
}

export default AboutPage;
