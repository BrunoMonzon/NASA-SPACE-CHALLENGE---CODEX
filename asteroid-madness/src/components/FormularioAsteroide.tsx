import { useState } from 'react';
import styles from './FormularioAsteroide.module.css';

type TabType = 'Seleccionar' | 'Configurar';

interface AsteroidData {
  nombre: string;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeAscending: number;
  argumentPerihelion: number;
  initialPhase: number;
  masa: number;
  radio: number;
  densidad: number;
}

interface PopupInfo {
  show: boolean;
  content: string;
  x: number;
  y: number;
}

const FormularioAsteroide = () => {
  const [selectedTab, setSelectedTab] = useState<TabType>('Seleccionar');
  const [searchQuery, setSearchQuery] = useState('');
  const [popup, setPopup] = useState<PopupInfo>({ show: false, content: '', x: 0, y: 0 });
  
  const [formData, setFormData] = useState<AsteroidData>({
    nombre: '',
    semiMajorAxis: 0,
    eccentricity: 0,
    inclination: 0,
    longitudeAscending: 0,
    argumentPerihelion: 0,
    initialPhase: 0,
    masa: 0,
    radio: 0,
    densidad: 0
  });

  const handleSearch = () => {
    // TODO: Conectar con API real
    console.log('Buscando asteroide:', searchQuery);
  };

  const handleInputChange = (field: keyof AsteroidData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'nombre' ? value : parseFloat(value) || 0
    }));
  };

  const handleSimulate = () => {
    // TODO: Enviar datos al componente Sim.tsx
    console.log('Simulando con datos:', formData);
  };

  const showPopup = (content: string, e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const container = document.querySelector(`.${styles.container}`);
    const containerRect = container?.getBoundingClientRect();
    
    if (containerRect) {
      setPopup({
        show: true,
        content,
        x: rect.left - containerRect.left + rect.width + 10,
        y: rect.top - containerRect.top
      });
    }
  };

  const hidePopup = () => {
    setPopup({ show: false, content: '', x: 0, y: 0 });
  };

  const parameterInfo: Record<string, string> = {
    semiMajorAxis: 'Distancia promedio del asteroide al Sol, medida en unidades astronómicas (UA).',
    eccentricity: 'Medida de cuánto se desvía la órbita de una forma circular perfecta (0 = círculo, cerca de 1 = muy elíptica).',
    inclination: 'Ángulo entre el plano orbital del asteroide y el plano de la eclíptica, medido en grados.',
    longitudeAscending: 'Ángulo desde el punto vernal hasta el nodo ascendente de la órbita, medido en grados.',
    argumentPerihelion: 'Ángulo desde el nodo ascendente hasta el perihelio, medido en grados.',
    initialPhase: 'Posición angular inicial del asteroide en su órbita en el momento t=0.',
    masa: 'Masa del asteroide medida en kilogramos (kg).',
    radio: 'Radio del asteroide medido en kilómetros (km).',
    densidad: 'Densidad del asteroide medida en gramos por centímetro cúbico (g/cm³).'
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Formulario Asteroide</h2>
      
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'Seleccionar' ? styles.tabSelected : ''}`}
          onClick={() => setSelectedTab('Seleccionar')}
        >
          Seleccionar
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'Configurar' ? styles.tabSelected : ''}`}
          onClick={() => setSelectedTab('Configurar')}
        >
          Configurar
        </button>
      </div>

      <div className={styles.content}>
        {selectedTab === 'Seleccionar' ? (
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="Buscar por nombre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <img
              src="/material-symbols-light_search-rounded.svg"
              alt="Buscar"
              className={styles.searchIcon}
              onClick={handleSearch}
            />
          </div>
        ) : (
          <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Nombre del objeto</label>
              <input
                type="text"
                className={`${styles.input} ${styles.inputWide}`}
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
              />
            </div>

            <div className={styles.grid}>
              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Semi-major axis (a)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.semiMajorAxis, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.semiMajorAxis || ''}
                  onChange={(e) => handleInputChange('semiMajorAxis', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Eccentricity (e)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.eccentricity, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.eccentricity || ''}
                  onChange={(e) => handleInputChange('eccentricity', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Inclination (i)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.inclination, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.inclination || ''}
                  onChange={(e) => handleInputChange('inclination', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Longitude of ascending node (Ω)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.longitudeAscending, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.longitudeAscending || ''}
                  onChange={(e) => handleInputChange('longitudeAscending', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Argument of perihelion (ω)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.argumentPerihelion, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.argumentPerihelion || ''}
                  onChange={(e) => handleInputChange('argumentPerihelion', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>M₀ (Fase inicial)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.initialPhase, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.initialPhase || ''}
                  onChange={(e) => handleInputChange('initialPhase', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Masa</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.masa, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.masa || ''}
                  onChange={(e) => handleInputChange('masa', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Radio</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.radio, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.radio || ''}
                  onChange={(e) => handleInputChange('radio', e.target.value)}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Densidad</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.densidad, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.densidad || ''}
                  onChange={(e) => handleInputChange('densidad', e.target.value)}
                />
              </div>
            </div>

            <button className={styles.simulateButton} onClick={handleSimulate}>
              Simular
            </button>
          </div>
        )}
      </div>

      {popup.show && (
        <div 
          className={styles.popup}
          style={{ 
            left: `${popup.x}px`, 
            top: `${popup.y}px` 
          }}
          onMouseEnter={() => setPopup(prev => ({ ...prev, show: false }))}
        >
          {popup.content}
        </div>
      )}
    </div>
  );
};

export default FormularioAsteroide;