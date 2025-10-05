import { useState } from 'react';
import styles from './FormularioAsteroide.module.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

type TabType = 'Select' | 'Configure';

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
  velocidad: number;
}

interface ImpactData {
  impact: boolean;
  date?: {
    day: number;
    month: number;
    year: number;
  };
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  closest_approach_km?: number;
}

interface PopupInfo {
  show: boolean;
  content: string;
  x: number;
  y: number;
}

interface FormularioAsteroideProps {
  onSimulate: (asteroidData: AsteroidData, impactData: ImpactData) => void;
}

const FormularioAsteroide = ({ onSimulate }: FormularioAsteroideProps) => {
  const [selectedTab, setSelectedTab] = useState<TabType>('Select');
  const [searchQuery, setSearchQuery] = useState('');
  const [popup, setPopup] = useState<PopupInfo>({ show: false, content: '', x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
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
    densidad: 0,
    velocidad: 0
  });

  // Date range and asteroid list states
  const today = new Date();
  const defaultStart = new Date(today.getTime() - 7 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const defaultEnd = today.toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [asteroids, setAsteroids] = useState<Array<any>>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  const fetchAsteroids = async () => {
    setIsLoading(true);
    setError('');
    setAsteroids([]);
    setSelectedId('');
    try {
      const url = `${BACKEND_URL}/asteroides?start_date=${startDate}&end_date=${endDate}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        const snippet = text.slice(0, 300).replace(/\n/g, ' ');
        throw new Error(`Non-JSON response from backend (${url}): ${snippet}`);
      }

      const data = await res.json();
      setAsteroids(data.asteroids || []);
    } catch (e: any) {
      const msg = e?.message || String(e);
      if (msg.includes('<!doctype') || msg.includes('<html')) {
        setError('Unexpected response (HTML) from backend. Is the service running at http://localhost:5000?');
      } else if (msg.includes('ECONNREFUSED') || msg.includes('Failed to fetch')) {
        setError('Cannot connect to backend. Start the Python server and/or configure VITE_BACKEND_URL.');
      } else {
        setError(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/asteroid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('Asteroid not found or server error');
      }

      const data = await response.json();

      setFormData({
        nombre: data.full_name || '',
        semiMajorAxis: data.a || 0,
        eccentricity: data.e || 0,
        inclination: data.i || 0,
        longitudeAscending: data['Ω (node)'] || 0,
        argumentPerihelion: data['ω (peri)'] || 0,
        initialPhase: data['M₀'] || 0,
        masa: (data['masa (kg)'] / 1000) || 0,
        radio: data['radio (km)'] || 0,
        densidad: data['densidad (kg/m³)'] || 0,
        velocidad: data['velocidad (m/s)'] || 0
      });

      setSelectedTab('Configure');
    } catch (error) {
      console.error('Error searching for asteroid:', error);
      setError('Error searching for the asteroid. Please check the name or server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFromList = () => {
    const ast = asteroids.find(x => x.id === selectedId);
    if (ast) {
      setFormData({
        nombre: ast.name || '',
        semiMajorAxis: ast.a || 0,
        eccentricity: ast.e || 0,
        inclination: (ast.i || 0) * 180 / Math.PI,
        longitudeAscending: (ast.Omega || 0) * 180 / Math.PI,
        argumentPerihelion: (ast.omega || 0) * 180 / Math.PI,
        initialPhase: (ast.M || 0) * 180 / Math.PI,
        masa: (ast.masa / 1000) || 0,
        radio: ast.radio || 0,
        densidad: (ast.densidad * 1000) || 0,
        velocidad: 0
      });
      setSelectedTab('Configure');
    }
  };

  const handleInputChange = (field: keyof AsteroidData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'nombre' ? value : parseFloat(value) || 0
    }));
  };

  const handleSimulate = () => {
    const emptyImpactData: ImpactData = {
      impact: false
    };
    
    onSimulate(formData, emptyImpactData);
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
    semiMajorAxis: 'Average distance of the asteroid from the Sun, measured in astronomical units (AU).',
    eccentricity: 'Measure of how much the orbit deviates from a perfect circle (0 = circle, close to 1 = highly elliptical).',
    inclination: 'Angle between the asteroid’s orbital plane and the ecliptic plane, measured in degrees.',
    longitudeAscending: 'Angle from the vernal equinox to the ascending node of the orbit, measured in degrees.',
    argumentPerihelion: 'Angle from the ascending node to the perihelion, measured in degrees.',
    initialPhase: 'Initial angular position of the asteroid in its orbit at time t=0.',
    masa: 'Mass of the asteroid, measured in tons.',
    radio: 'Radius of the asteroid, measured in kilometers (km).',
    densidad: 'Density of the asteroid, measured in kilograms per cubic meter (kg/m³).',
    velocidad: 'Velocity of the asteroid relative to Earth at the time of impact, measured in meters per second (m/s).'
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Asteroid Form</h2>
      
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${selectedTab === 'Select' ? styles.tabSelected : ''}`}
          onClick={() => setSelectedTab('Select')}
        >
          Select
        </button>
        <button
          className={`${styles.tabButton} ${selectedTab === 'Configure' ? styles.tabSelected : ''}`}
          onClick={() => setSelectedTab('Configure')}
        >
          Configure
        </button>
      </div>

      <div className={styles.content}>
        {selectedTab === 'Select' ? (
          <div className={styles.searchContainer}>
            <input
              type="text"
              className={styles.searchBar}
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <img
              src="/material-symbols-light_search-rounded.svg"
              alt="Search"
              className={styles.searchIcon}
              onClick={handleSearch}
            />

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>Start Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label className={styles.label}>End Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <button className={styles.simulateButton} onClick={fetchAsteroids} disabled={isLoading}>
                  List
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              {isLoading && <div>Loading asteroids...</div>}
              {error && <div style={{ color: 'var(--danger, #ff6b6b)' }}>{error}</div>}
              {!isLoading && asteroids.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className={styles.label}>Select asteroid</label>
                  <select className={styles.input} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                    <option value="">-- Select --</option>
                    {asteroids.map(a => (
                      <option key={a.id} value={a.id}>{a.name} (a={a.a.toFixed(3)} AU)</option>
                    ))}
                  </select>
                  <div>
                    <button
                      className={styles.simulateButton}
                      onClick={handleLoadFromList}
                      disabled={!selectedId || isLoading}
                    >
                      Load
                    </button>
                  </div>
                </div>
              )}
              {!isLoading && asteroids.length === 0 && <div style={{ marginTop: 8 }}>No asteroids listed yet.</div>}
            </div>
          </div>
        ) : (
          <div className={styles.formContainer}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Object Name</label>
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
                  <label className={styles.label}>Semi-major Axis (a, AU)</label>
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
                  <label className={styles.label}>Inclination (i, degrees)</label>
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
                  <label className={styles.label}>Longitude of Ascending Node (Ω, degrees)</label>
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
                  <label className={styles.label}>Argument of Perihelion (ω, degrees)</label>
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
                  <label className={styles.label}>Initial Phase (M₀, degrees)</label>
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
                  <label className={styles.label}>Mass (tons)</label>
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
                  <label className={styles.label}>Radius (km)</label>
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
                  <label className={styles.label}>Density (kg/m³)</label>
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

              <div className={styles.inputGroup}>
                <div className={styles.labelContainer}>
                  <label className={styles.label}>Velocity (m/s)</label>
                  <img
                    src="/ask.svg"
                    alt="Info"
                    className={styles.infoIcon}
                    onMouseEnter={(e) => showPopup(parameterInfo.velocidad, e)}
                    onMouseLeave={hidePopup}
                  />
                </div>
                <input
                  type="number"
                  step="any"
                  className={styles.input}
                  value={formData.velocidad || ''}
                  onChange={(e) => handleInputChange('velocidad', e.target.value)}
                />
              </div>
            </div>

            <button 
              className={styles.simulateButton} 
              onClick={handleSimulate}
              disabled={isLoading}
            >
              {isLoading ? 'Simulating...' : 'Simulate'}
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
        >
          {popup.content}
        </div>
      )}
    </div>
  );
};

export default FormularioAsteroide;