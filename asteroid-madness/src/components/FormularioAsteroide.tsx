import { useState } from 'react';
import styles from './FormularioAsteroide.module.css';

// Backend base URL (configure with VITE_BACKEND_URL). If not set, fallback to localhost:5000
const BACKEND_URL = (import.meta as any)?.env?.VITE_BACKEND_URL || 'http://localhost:5000';

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

interface FormularioAsteroideProps {
  onSimulate: (data: AsteroidData) => void;
}

const FormularioAsteroide = ({ onSimulate }: FormularioAsteroideProps) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('Seleccionar');
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

  // Selection tab state: date range and asteroid list from backend
  const today = new Date();
  const defaultStart = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const defaultEnd = today.toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [asteroids, setAsteroids] = useState<Array<any>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string>('');

  const fetchAsteroids = async () => {
    setLoading(true);
    setError('');
    setAsteroids([]);
    setSelectedId('');
    try {
      const url = `${BACKEND_URL}/asteroides?start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Guardar el content-type para evitar intentar parsear HTML (p.ej. index.html) como JSON
      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        // If we got HTML (starts with <!doctype or <), show a helpful error message
        const snippet = text.slice(0, 300).replace(/\n/g, ' ');
        throw new Error(`Respuesta no JSON desde backend (${url}): ${snippet}`);
      }

      const data = await res.json();
      setAsteroids(data.asteroids || []);
    } catch (e: any) {
      // Provide clearer messages for HTML/non-JSON responses or connection refused
      const msg = e?.message || String(e);
      if (msg.includes('<!doctype') || msg.includes('<html')) {
        setError('Respuesta inesperada (HTML) al consultar el backend. ¿Está corriendo el servicio en http://localhost:5000 ?');
      } else if (msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        setError('No se puede conectar al backend. Inicia el servidor Python (backend) y/o configura VITE_BACKEND_URL.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  

  const handleInputChange = (field: keyof AsteroidData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'nombre' ? value : parseFloat(value) || 0
    }));
  };

  const handleSimulate = () => {
    // Enviar datos al componente padre (Simular.tsx)
    onSimulate(formData);
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
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>Fecha inicio</label>
                <input
                  type="date"
                  className={styles.input}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>Fecha fin</label>
                <input
                  type="date"
                  className={styles.input}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <button className={styles.simulateButton} onClick={async () => { await fetchAsteroids(); }}>
                  Listar
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {loading && <div>Cargando asteroides...</div>}
              {error && <div style={{ color: 'var(--danger, #ff6b6b)' }}>{error}</div>}
              {!loading && asteroids.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className={styles.label}>Seleccione asteroide</label>
                  <select className={styles.input} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    <option value="">-- Seleccionar --</option>
                    {asteroids.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (a={a.a.toFixed(3)} AU)</option>
                    ))}
                  </select>
                  <div>
                    <button
                      className={styles.simulateButton}
                      onClick={() => {
                        const ast = asteroids.find(x => x.id === selectedId);
                        if (ast) {
                          // Map backend asteroid to FormularioAsteroide AsteroidData and simulate
                          const mapped = {
                            nombre: ast.name,
                            semiMajorAxis: ast.a,
                            eccentricity: ast.e,
                            inclination: (ast.i || 0) * 180 / Math.PI,
                            longitudeAscending: (ast.Omega || 0) * 180 / Math.PI,
                            argumentPerihelion: (ast.omega || 0) * 180 / Math.PI,
                            initialPhase: (ast.M || 0) * 180 / Math.PI,
                            masa: ast.masa || 0,
                            radio: ast.radio || 0,
                            densidad: ast.densidad || 0
                          };
                          onSimulate(mapped);
                        }
                      }}
                      disabled={!selectedId}
                    >
                      Simular
                    </button>
                  </div>
                </div>
              )}
              {!loading && asteroids.length === 0 && <div style={{ marginTop: 8 }}>No se han listado asteroides aún.</div>}
            </div>
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