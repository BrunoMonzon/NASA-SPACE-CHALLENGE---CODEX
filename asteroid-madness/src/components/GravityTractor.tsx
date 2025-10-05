import React, { useState } from 'react';
import OrbitCrash from './OrbitCrash';
import styles from './GravityTractor.module.css';

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

interface GravityTractorProps {
  asteroidData: AsteroidData;
  onBack: () => void;
}

const GravityTractor: React.FC<GravityTractorProps> = ({ asteroidData, onBack }) => {
  const [spacecraftParams, setSpacecraftParams] = useState({
    masaNave: 20000, // 20 tons by default
    distanciaOperacion: 200, // meters
    tiempoOperacion: 10, // years
    modoOperacion: 'hovering' as 'hovering' | 'orbiting'
  });

  const handleParamChange = (field: keyof typeof spacecraftParams, value: number | string) => {
    setSpacecraftParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calcularAceleracion = () => {
    const G = 6.67430e-11;
    const a_GT = G * spacecraftParams.masaNave / Math.pow(spacecraftParams.distanciaOperacion, 2);
    return a_GT;
  };

  const calcularDeltaV = () => {
    const a_GT = calcularAceleracion();
    const segundosPorAnio = 365.25 * 24 * 3600;
    const deltaV = a_GT * spacecraftParams.tiempoOperacion * segundosPorAnio;
    return deltaV;
  };

  const calcularDeltaSemiejeMayor = () => {
    const deltaV = calcularDeltaV();
    const G = 6.67430e-11;
    const M_sun = 1.989e30;
    const AU_in_m = 1.496e11;
    
    const a_m = asteroidData.semiMajorAxis * AU_in_m;
    const n = Math.sqrt(G * M_sun / Math.pow(a_m, 3));
    
    const deltaA = (2 * deltaV) / (n * a_m) * a_m;
    return deltaA / AU_in_m;
  };

  const deltaSemiejeMayor = calcularDeltaSemiejeMayor();

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Gravity Tractors</h2>
      
      <div className={styles.mainGrid}>
        <div className={styles.visualizationContainer}>
          <div className={styles.canvasWrapper}>
            <OrbitCrash
              asteroidElements={{
                a: asteroidData.semiMajorAxis,
                e: asteroidData.eccentricity,
                i: asteroidData.inclination,
                O: asteroidData.longitudeAscending,
                w: asteroidData.argumentPerihelion,
                M0: asteroidData.initialPhase
              }}
              spacecraftParams={spacecraftParams}
              onIntersectionsDetected={() => {}}
            />
          </div>

          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendLineEarth} />
              <span>Earth</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineAsteroid} />
              <span>Asteroid</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineTractor} />
              <span>Tractor Effect</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineModified} style={{ backgroundColor: '#29FF82' }} />
              <span>Modified Orbit</span>
            </div>
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Gravity Tractor Effect</h3>
            <div className={styles.statusCard}>
              <div className={styles.statusTitle} style={{ backgroundColor: '#697aa8' }}>
                Distance Between Orbits
              </div>
              <div className={styles.statusDetail}>
                {Math.abs(deltaSemiejeMayor).toExponential(2)} AU
              </div>
              <div className={styles.statusDetail}>
                {(Math.abs(deltaSemiejeMayor) * 1.496e11 / 1000).toExponential(2)} km
              </div>
              <div className={styles.statusDetail} style={{ 
                marginTop: '15px', 
                fontStyle: 'italic', 
                color: '#3C3C5A',
                fontSize: '0.95em'
              }}>
                The changes caused by the gravity tractor are slight
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Spacecraft Parameters</h3>
            <div className={styles.paramsList}>
              <RangeInput 
                label="Spacecraft Mass"
                value={spacecraftParams.masaNave}
                min={1000}
                max={100000}
                step={1000}
                unit="kg"
                onChange={(value) => handleParamChange('masaNave', value)}
              />
              <RangeInput 
                label="Operating Distance"
                value={spacecraftParams.distanciaOperacion}
                min={50}
                max={1000}
                step={10}
                unit="m"
                onChange={(value) => handleParamChange('distanciaOperacion', value)}
              />
              <RangeInput 
                label="Operating Time"
                value={spacecraftParams.tiempoOperacion}
                min={1}
                max={20}
                step={0.5}
                unit="years"
                onChange={(value) => handleParamChange('tiempoOperacion', value)}
              />
              
              <div className={styles.paramItem}>
                <div className={styles.paramHeader}>
                  <span>Operating Mode:</span>
                </div>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="hovering"
                      checked={spacecraftParams.modoOperacion === 'hovering'}
                      onChange={(e) => handleParamChange('modoOperacion', e.target.value)}
                    />
                    Hovering
                  </label>
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      value="orbiting"
                      checked={spacecraftParams.modoOperacion === 'orbiting'}
                      onChange={(e) => handleParamChange('modoOperacion', e.target.value)}
                    />
                    Orbiting
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Asteroid Data</h3>
            <div className={styles.physicalData}>
              <div className={styles.dataRow}>
                <span>Name:</span>
                <span>{asteroidData.nombre}</span>
              </div>
              <div className={styles.dataRow}>
                <span>Mass:</span>
                <span>{asteroidData.masa.toExponential(2)} kg</span>
              </div>
              <div className={styles.dataRow}>
                <span>Radius:</span>
                <span>{asteroidData.radio.toFixed(2)} km</span>
              </div>
              <div className={styles.dataRow}>
                <span>Density:</span>
                <span>{asteroidData.densidad.toFixed(2)} g/cm³</span>
              </div>
              <div className={styles.dataRow}>
                <span>Semi-Major Axis:</span>
                <span>{asteroidData.semiMajorAxis.toFixed(3)} AU</span>
              </div>
              <div className={styles.dataRow}>
                <span>Eccentricity:</span>
                <span>{asteroidData.eccentricity.toFixed(3)}</span>
              </div>
            </div>
          </div>

          <button className={styles.backButton} onClick={onBack}>
            Return to Mitigation Menu
          </button>
        </div>
      </div>
    </div>
  );
};

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, min, max, step, unit, onChange }) => {
  return (
    <div className={styles.paramItem}>
      <div className={styles.paramHeader}>
        <span>{label}:</span>
        <span className={styles.paramValue}>{value.toLocaleString()} {unit}</span>
      </div>
      <div className={styles.rangeInput}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={styles.rangeSlider}
        />
      </div>
    </div>
  );
};

export default GravityTractor;