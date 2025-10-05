import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import styles from './Aprender.module.css';

type SectionKey = 'intro' | 'orbitas' | 'impactos' | 'mitigacion';

function Aprender() {
  const [activeSection, setActiveSection] = useState<SectionKey>('intro');
  const [showFormula, setShowFormula] = useState<number | null>(null);

  const sections: Record<SectionKey, { title: string; content?: string; icon: string }> = {
    intro: {
      title: '🌍 ¡Bienvenido al Mundo de los Asteroides!',
      content: 'Los asteroides son rocas espaciales que viajan alrededor del Sol. Algunos pasan cerca de la Tierra, y es importante saber dónde están y cómo protegernos.',
      icon: '☄️'
    },
    orbitas: {
      title: '🔭 ¿Cómo Calculamos Dónde Está un Asteroide?',
      icon: '🛰️'
    },
    impactos: {
      title: '💥 ¿Qué Pasa si un Asteroide Choca?',
      icon: '🌋'
    },
    mitigacion: {
      title: '🛡️ ¿Cómo Protegemos la Tierra?',
      icon: '🚀'
    }
  };

  const orbitFormulas = [
    { 
      name: 'Tamaño de órbita (a)', 
      desc: 'Qué tan lejos del Sol',
      formula: 'a = distancia media',
      unit: 'AU (unidades astronómicas)'
    },
    { 
      name: 'Forma ovalada (e)', 
      desc: 'Si es círculo o alargada',
      formula: 'e = 0 (círculo) a 1 (muy alargada)',
      unit: 'sin unidades'
    },
    { 
      name: 'Inclinación (i)', 
      desc: 'Qué tan inclinada está',
      formula: 'i = ángulo',
      unit: 'grados (°)'
    }
  ];

  const impactFormulas = [
    {
      name: 'Energía del Impacto',
      formula: 'E = ½ × masa × velocidad²',
      desc: 'Cuánta fuerza tendrá el choque',
      example: 'Si el asteroide pesa 1,000,000 kg y va a 20,000 m/s: E = ½ × 1,000,000 × 20,000² = 200,000,000,000,000 J'
    },
    {
      name: 'Tamaño del Cráter',
      formula: 'D ≈ 0.07 × E^(1/4)',
      desc: 'Qué tan grande será el agujero',
      example: 'Energía de 1 megatón → Cráter de ~1 km'
    },
    {
      name: 'Magnitud del Terremoto',
      formula: 'M = 0.67 × log(E × 0.0001) - 5.87',
      desc: 'Qué tan fuerte temblará',
      example: 'Impacto grande = terremoto 7.0+'
    }
  ];

  const mitigationMethods = [
    {
      name: 'Impactador Cinético',
      emoji: '🚀💥',
      desc: 'Golpear el asteroide como una bola de billar',
      formula: 'Δv = (β × masa_nave × velocidad) / masa_asteroide',
      params: [
        'masa_nave: 500 kg',
        'velocidad: 6,000 m/s',
        'β (factor de mejora): 3-4',
        'masa_asteroide: conocida'
      ],
      example: 'Nave de 500 kg a 6,000 m/s → cambio de 9 mm/s'
    },
    {
      name: 'Tractor Gravitacional',
      emoji: '🛸⚡',
      desc: 'Remolcar con gravedad sin tocar',
      formula: 'Δv = (G × masa_nave / distancia²) × tiempo',
      params: [
        'masa_nave: 20,000 kg',
        'distancia: 200 m',
        'tiempo: 10 años',
        'G: 6.674 × 10⁻¹¹'
      ],
      example: 'Nave de 20 toneladas durante 10 años → cambio de 1 cm/s'
    }
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>Aprende sobre Asteroides 📚</h1>
      
      {/* Navigation Tabs */}
      <div className={styles.tabContainer}>
        {(Object.keys(sections) as SectionKey[]).map((key) => (
          <button
            key={key}
            className={`${styles.tab} ${activeSection === key ? styles.tabActive : ''}`}
            onClick={() => setActiveSection(key)}
          >
            <span className={styles.tabIcon}>{sections[key].icon}</span>
            <span className={styles.tabText}>{sections[key].title.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeSection === 'intro' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{sections.intro.title}</h2>
            <p className={styles.text}>{sections.intro.content}</p>
            
            <div className={styles.cardGrid}>
              <div className={styles.card}>
                <div className={styles.cardIcon}>🔭</div>
                <h3 className={styles.cardTitle}>Detectar</h3>
                <p className={styles.cardText}>Encontramos asteroides con telescopios</p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardIcon}>📊</div>
                <h3 className={styles.cardTitle}>Calcular</h3>
                <p className={styles.cardText}>Medimos su órbita y velocidad</p>
              </div>
              <div className={styles.card}>
                <div className={styles.cardIcon}>🛡️</div>
                <h3 className={styles.cardTitle}>Proteger</h3>
                <p className={styles.cardText}>Desviamos los peligrosos</p>
              </div>
            </div>

            <button className={styles.nextButton} onClick={() => setActiveSection('orbitas')}>
              Comenzar el Viaje <ChevronRight size={20} />
            </button>
          </div>
        )}

        {activeSection === 'orbitas' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{sections.orbitas.title}</h2>
            <p className={styles.text}>
              Los asteroides viajan en <strong>órbitas</strong> alrededor del Sol. Para saber dónde están, usamos 6 números mágicos:
            </p>

            <div className={styles.formulaGrid}>
              {orbitFormulas.map((item, idx) => (
                <div key={idx} className={styles.formulaCard}>
                  <div className={styles.formulaNumber}>{idx + 1}</div>
                  <h4 className={styles.formulaName}>{item.name}</h4>
                  <p className={styles.formulaDesc}>{item.desc}</p>
                  <div className={styles.formulaBox}>{item.formula}</div>
                  <span className={styles.formulaUnit}>{item.unit}</span>
                </div>
              ))}
            </div>

            <div className={styles.highlightBox}>
              <h4 className={styles.highlightTitle}>📐 Fórmulas Principales (NASA)</h4>
              <div className={styles.formulaList}>
                <div className={styles.formulaItem}>
                  <strong>Tiempo:</strong> T = (año - 2000) / 100
                </div>
                <div className={styles.formulaItem}>
                  <strong>Posición en órbita:</strong> M = M₀ + velocidad × T
                </div>
                <div className={styles.formulaItem}>
                  <strong>Coordenadas:</strong> x = distancia × cos(ángulo)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'impactos' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{sections.impactos.title}</h2>
            <p className={styles.text}>
              Cuando un asteroide choca con la Tierra, libera mucha energía. Podemos calcular los efectos:
            </p>

            <div className={styles.impactGrid}>
              {impactFormulas.map((item, idx) => (
                <div key={idx} className={styles.impactCard}>
                  <div className={styles.impactHeader}>
                    <h4 className={styles.impactTitle}>{item.name}</h4>
                    <button
                      className={styles.infoButton}
                      onClick={() => setShowFormula(showFormula === idx ? null : idx)}
                    >
                      {showFormula === idx ? '−' : '+'}
                    </button>
                  </div>
                  <div className={styles.formulaBox}>{item.formula}</div>
                  <p className={styles.impactDesc}>{item.desc}</p>
                  
                  {showFormula === idx && (
                    <div className={styles.exampleBox}>
                      <strong>Ejemplo:</strong><br />
                      {item.example}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.warningBox}>
              <div className={styles.warningIcon}>⚠️</div>
              <p className={styles.warningText}>
                <strong>Tsunami:</strong> Si cae en el océano:<br />
                Altura de ola ≈ 0.1 × Diámetro del cráter
              </p>
            </div>
          </div>
        )}

        {activeSection === 'mitigacion' && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{sections.mitigacion.title}</h2>
            <p className={styles.text}>
              Tenemos dos técnicas principales para desviar asteroides peligrosos:
            </p>

            {mitigationMethods.map((method, idx) => (
              <div key={idx} className={styles.methodCard}>
                <div className={styles.methodHeader}>
                  <span className={styles.methodEmoji}>{method.emoji}</span>
                  <h3 className={styles.methodTitle}>{method.name}</h3>
                </div>
                <p className={styles.methodDesc}>{method.desc}</p>
                
                <div className={styles.methodFormula}>
                  <strong>Fórmula:</strong>
                  <div className={styles.formulaBox}>{method.formula}</div>
                </div>

                <div className={styles.paramBox}>
                  <strong>Datos necesarios:</strong>
                  <ul className={styles.paramList}>
                    {method.params.map((param, i) => (
                      <li key={i} className={styles.paramItem}>{param}</li>
                    ))}
                  </ul>
                </div>

                <div className={styles.exampleBox}>
                  <strong>💡 Ejemplo:</strong> {method.example}
                </div>
              </div>
            ))}

            <div className={styles.successBox}>
              <div className={styles.successIcon}>✅</div>
              <p className={styles.successText}>
                <strong>¡Con matemáticas y ciencia podemos proteger nuestro planeta!</strong><br />
                Un pequeño empujón con años de anticipación puede salvarnos 🌎✨
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Aprender;