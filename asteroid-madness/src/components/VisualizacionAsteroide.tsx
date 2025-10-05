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

interface VisualizacionAsteroideProps {
  asteroidData: AsteroidData;
  onBack: () => void;
  onContinue: (impactData: ImpactData) => void;
}

const VisualizacionAsteroide: React.FC<VisualizacionAsteroideProps> = ({ 
  asteroidData, 
  onBack, 
  onContinue
}) => {
  const [currentAsteroidData, setCurrentAsteroidData] = useState<AsteroidData>(asteroidData);
  const [hasIntersections, setHasIntersections] = useState(false);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  const handleParamChange = (field: keyof AsteroidData, value: number) => {
    setCurrentAsteroidData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinueToImpactDay = async () => {
    setIsLoadingImpact(true);
    
    try {
      // Call the /impact API with current asteroid data
      const response = await fetch('http://localhost:5000/impact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          a: currentAsteroidData.semiMajorAxis,
          e: currentAsteroidData.eccentricity,
          i: currentAsteroidData.inclination,
          om: currentAsteroidData.longitudeAscending,
          w: currentAsteroidData.argumentPerihelion,
          ma: currentAsteroidData.initialPhase
        }),
      });

      if (!response.ok) {
        throw new Error('Error predicting impact');
      }

      const impactData: ImpactData = await response.json();
      console.log('Impact prediction result:', impactData);

      // Pass impact data to parent component
      onContinue(impactData);
      
    } catch (error) {
      console.error('Error predicting impact:', error);
      alert('Error predicting impact. Please check the server connection.');
    } finally {
      setIsLoadingImpact(false);
    }
  };

  const calculateMOID = () => {
    const earthA = 1.0;
    const asteroidA = currentAsteroidData.semiMajorAxis;
    const moid = Math.abs(asteroidA - earthA) * (1 - currentAsteroidData.eccentricity);
    return moid;
  };

  const getCollisionStatus = () => {
    if (hasIntersections) {
      return {
        status: 'Close',
        color: '#FF6B6B',
        moid: '0.00'
      };
    }
    
    const moid = calculateMOID();
    const moidKm = moid * 149597870.7;
    
    return {
      status: 'Far',
      color: '#51CF66',
      moid: moidKm.toFixed(2)
    };
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Earth Orbit vs. Asteroid Orbit Comparison</h1>

      <div className={styles.mainGrid}>
        <div className={styles.visualizationContainer}>
          <div className={styles.canvasWrapper}>
            <OrbitCrash
              asteroidElements={{
                a: currentAsteroidData.semiMajorAxis,
                e: currentAsteroidData.eccentricity,
                i: currentAsteroidData.inclination,
                O: currentAsteroidData.longitudeAscending,
                w: currentAsteroidData.argumentPerihelion,
                M0: currentAsteroidData.initialPhase
              }}
              onIntersectionsDetected={setHasIntersections}
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
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Orbital Collision</h3>
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
            </div>
            {getCollisionStatus().status === 'Close' && (
              <button 
                className={styles.continueButton} 
                onClick={handleContinueToImpactDay} 
                style={{ marginTop: '15px', width: '100%' }}
                disabled={isLoadingImpact}
              >
                {isLoadingImpact ? 'Calculating Impact...' : 'Continue to Impact Day →'}
              </button>
            )}
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Asteroid Parameters</h3>
            <div className={styles.paramsList}>
              <RangeInput 
                label="a (Semi-major Axis, AU)"
                value={currentAsteroidData.semiMajorAxis}
                min={0.5}
                max={3}
                step={0.01}
                onChange={(value) => handleParamChange('semiMajorAxis', value)}
              />
              <RangeInput 
                label="e (Eccentricity)"
                value={currentAsteroidData.eccentricity}
                min={0}
                max={1}
                step={0.01}
                onChange={(value) => handleParamChange('eccentricity', value)}
              />
              <RangeInput 
                label="i (Inclination, degrees)"
                value={currentAsteroidData.inclination}
                min={0}
                max={180}
                step={0.1}
                onChange={(value) => handleParamChange('inclination', value)}
              />
              <RangeInput 
                label="Ω (Longitude of Ascending Node, degrees)"
                value={currentAsteroidData.longitudeAscending}
                min={0}
                max={360}
                step={0.1}
                onChange={(value) => handleParamChange('longitudeAscending', value)}
              />
              <RangeInput 
                label="ω (Argument of Perihelion, degrees)"
                value={currentAsteroidData.argumentPerihelion}
                min={0}
                max={360}
                step={0.1}
                onChange={(value) => handleParamChange('argumentPerihelion', value)}
              />
              <RangeInput 
                label="M₀ (Initial Phase, degrees)"
                value={currentAsteroidData.initialPhase}
                min={0}
                max={360}
                step={0.1}
                onChange={(value) => handleParamChange('initialPhase', value)}
              />
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Physical Data</h3>
            <div className={styles.physicalData}>
              <div className={styles.dataRow}>
                <span>Mass:</span>
                <span>{currentAsteroidData.masa.toString()} tons</span>
              </div>
              <div className={styles.dataRow}>
                <span>Radius:</span>
                <span>{currentAsteroidData.radio.toFixed(2)} km</span>
              </div>
              <div className={styles.dataRow}>
                <span>Density:</span>
                <span>{currentAsteroidData.densidad.toFixed(2)} g/cm³</span>
              </div>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button className={styles.backButton} onClick={onBack}>
              ← Back to Form
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component for range inputs
interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className={styles.paramItem}>
      <div className={styles.paramHeader}>
        <span>{label}</span>
        <span className={styles.paramValue}>{value.toFixed(2)}</span>
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

export default VisualizacionAsteroide;