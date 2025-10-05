import React, { useState } from 'react';
import OrbitCrash from './OrbitCrash';
import styles from './VisualizacionAsteroide.module.css';

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

interface VisualizacionAsteroideProps {
  asteroidData: AsteroidData;
  onBack: () => void;
}

const VisualizacionAsteroide: React.FC<VisualizacionAsteroideProps> = ({ asteroidData, onBack }) => {
  const [showSimulation, _setShowSimulation] = useState(true); // Siempre true al cargar

  const calculateMOID = () => {
    // Cálculo aproximado del MOID (Minimum Orbit Intersection Distance)
    const earthA = 1.0; // UA
    const asteroidA = asteroidData.semiMajorAxis;
    
    // Aproximación simplificada
    const moid = Math.abs(asteroidA - earthA) * (1 - asteroidData.eccentricity);
    return moid;
  };

  const getCollisionStatus = () => {
    const moid = calculateMOID();
    const moidKm = moid * 149597870.7; // Convertir UA a km
    
    if (moidKm < 0.05 * 149597870.7) { // < 0.05 UA
      return {
        status: 'Cercano',
        color: '#FF6B6B',
        moid: moidKm.toFixed(2),
        intersections: Math.floor(Math.random() * 3) + 1
      };
    } else {
      return {
        status: 'Lejano',
        color: '#51CF66',
        moid: moidKm.toFixed(2),
        intersections: 0
      };
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Comparación órbita de la Tierra vs órbita Asteroide</h1>

      <div className={styles.mainGrid}>
        {/* Formulario - Oculto al mostrar simulación */}
        <div className={styles.formPlaceholder}>
          {/* Si quieres volver al form, agrega botón aquí */}
        </div>

        {/* Visualización 3D */}
        <div className={styles.visualizationContainer}>
          <div className={styles.canvasWrapper}>
            {showSimulation && asteroidData ? (
              <OrbitCrash
                asteroidElements={{
                  a: asteroidData.semiMajorAxis,
                  e: asteroidData.eccentricity,
                  i: asteroidData.inclination,
                  O: asteroidData.longitudeAscending,
                  w: asteroidData.argumentPerihelion,
                  M0: asteroidData.initialPhase
                }}
              />
            ) : (
              <div className={styles.placeholderText}>
                Configure los parámetros del asteroide y presione "Simular"
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.legendLineEarth} />
              <span>Tierra</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.legendLineAsteroid} />
              <span>Asteroide</span>
            </div>
          </div>
        </div>

        {/* Panel lateral de resultados */}
        {showSimulation && asteroidData && (
          <div className={styles.sidebar}>
            {/* Colisión Orbital */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Colisión Orbital</h3>
              <div className={styles.statusCard}>
                <div className={styles.statusTitle} style={{ backgroundColor: getCollisionStatus().color }}>
                  {getCollisionStatus().status}
                </div>
                <div className={styles.statusDetail}>
                  MOID: {getCollisionStatus().moid} km
                </div>
                <div className={styles.statusDetail}>
                  ({(parseFloat(getCollisionStatus().moid) / 149597870.7).toFixed(4)} AU)
                </div>
                <div className={styles.statusDetail}>
                  Intersecciones: {getCollisionStatus().intersections}
                </div>
              </div>
            </div>

            {/* Parámetros del asteroide */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Parámetros del asteroide</h3>
              <div className={styles.paramsList}>
                <ParamDisplay 
                  label="a (Semieje mayor)"
                  value={asteroidData.semiMajorAxis}
                  unit="AU"
                  min={0.5}
                  max={3}
                />
                <ParamDisplay 
                  label="e (Excentricidad)"
                  value={asteroidData.eccentricity}
                  unit=""
                  min={0}
                  max={1}
                />
                <ParamDisplay 
                  label="i (Inclinación)"
                  value={asteroidData.inclination}
                  unit="°"
                  min={0}
                  max={180}
                />
                <ParamDisplay 
                  label="Ω (Nodo ascendente)"
                  value={asteroidData.longitudeAscending}
                  unit="°"
                  min={0}
                  max={360}
                />
                <ParamDisplay 
                  label="ω (Arg. perihelio)"
                  value={asteroidData.argumentPerihelion}
                  unit="°"
                  min={0}
                  max={360}
                />
                <ParamDisplay 
                  label="M₀ (Fase inicial)"
                  value={asteroidData.initialPhase}
                  unit="°"
                  min={0}
                  max={360}
                />
              </div>
            </div>

            {/* Datos Físicos */}
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Datos Físicos</h3>
              <div className={styles.physicalData}>
                <div className={styles.dataRow}>
                  <span>Masa:</span>
                  <span>{asteroidData.masa.toExponential(2)} kg</span>
                </div>
                <div className={styles.dataRow}>
                  <span>Radio:</span>
                  <span>{asteroidData.radio.toFixed(2)} km</span>
                </div>
                <div className={styles.dataRow}>
                  <span>Densidad:</span>
                  <span>{asteroidData.densidad.toFixed(2)} g/cm³</span>
                </div>
              </div>
            </div>

            {/* Botón Volver */}
            <button className={styles.backButton} onClick={onBack}>
              ← Volver al Formulario
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

interface ParamDisplayProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
}

const ParamDisplay: React.FC<ParamDisplayProps> = ({ label, value, unit, min, max }) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div className={styles.paramItem}>
      <div className={styles.paramHeader}>
        <span>{label}:</span>
        <span className={styles.paramValue}>{value.toFixed(2)} {unit}</span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
    </div>
  );
};

export default VisualizacionAsteroide;