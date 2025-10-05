import { useState, useEffect } from 'react';
import styles from './Inicio.module.css';

const slides = [
  {
    heroImage: '/assets/images/logo meteorito.png',
    title: 'Calculate and analyze the impact of an asteroid on Earth.',
    subtitle: 'Simulate its consequences',
    highlight: null
  },
  {
    heroImage: '/assets/images/fondo Orbita.png',
    title: 'Orbits calculated with data from',
    highlight: 'Small-Body Database Query',
    subtitle: ''
  },
  {
    heroImage: '/assets/images/fondo mapa impacto.png',
    title: 'Calculate seismic, population, and environmental consequences using data from',
    highlight: 'USGS',  // 👈 green
    subtitle: ''
  }
];

function Inicio() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const currentSlideData = slides[currentSlide];

  return (
    <section className={styles.inicioContainer}>
      {/* NASA Logo (no navbar here) */}
      <div className={styles.logoContainer}>
        <img 
          src="/assets/images/Logo Nasa Space Challenge.png" 
          alt="NASA Space Apps Challenge" 
          className={styles.logo} 
        />
      </div>

      {/* Active Slide */}
      <div className={styles.slide}>
        <img 
          src={currentSlideData.heroImage} 
          alt={`Slide ${currentSlide + 1}`} 
          className={`${styles.heroImage} ${styles[`heroImageSlide${currentSlide + 1}`]}`} 
        />

        <div className={styles.content}>
          <h1 className={styles.title}>
            {currentSlideData.title}{' '}
            {currentSlideData.highlight && (
              <span className={styles.highlight}>{currentSlideData.highlight}</span>
            )}
          </h1>

          {currentSlideData.subtitle && (
            <p className={styles.subtitle}>{currentSlideData.subtitle}</p>
          )}
        </div>

        {/* Slide Indicators */}
        <div className={styles.slideIndicators}>
          {slides.map((_, index) => (
            <span
              key={index}
              className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Inicio;