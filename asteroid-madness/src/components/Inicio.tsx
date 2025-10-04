// src/components/Inicio.tsx
import React, { useState, useEffect } from 'react';
import styles from './Inicio.module.css';

const slides = [
  {
    heroImage: '/assets/images/logo meteorito.png',
    title: 'Calcula y analiza el impacto de un asteroide en la Tierra.',
    subtitle: 'Simula sus consecuencias',
    highlight: null
  },
  {
    heroImage: '/assets/images/fondo Orbita.png',
    title: 'Órbitas calculadas con los datos de',
    highlight: 'Small-Body Database Query',
    subtitle: ''
  },
  {
    heroImage: '/assets/images/fondo mapa impacto.png',
    title: 'Calcula las consecuencias sísmicas, poblacionales y ambientales, usamos los datos de',
    highlight: 'USGS',  // 👈 verde
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
      {/* Logo NASA (sin navbar aquí) */}
      <div className={styles.logoContainer}>
        <img 
          src="/assets/images/Logo Nasa Space Challenge.png" 
          alt="NASA Space Apps Challenge" 
          className={styles.logo} 
        />
      </div>

      {/* Slide activo */}
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

        {/* Indicadores de slide */}
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
