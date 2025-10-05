import React, { useState } from 'react';
import styles from './KineticImpactador.module.css';
import OrbitKineticImpactadorCrash from './OrbitKineticImpactadorCrash';

interface KineticImpactadorProps {
  onBack: () => void;
  asteroidData?: AsteroidData | null;
}

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

interface SpacecraftData {
  launchTime: number; // Days since J2000
  velocity: number; // km/s
}

const KineticImpactador: React.FC<KineticImpactadorProps> = ({ onBack, asteroidData: asteroidFromProp }) => {
  const initialAsteroid: AsteroidData = {
    nombre: 'Apophis',
    semiMajorAxis: 1.458,
    eccentricity: 0.2228,
    inclination: 10.83,
    longitudeAscending: 304.27,
    argumentPerihelion: 178.93,
    initialPhase: 310.55,
    masa: 2.7e12,
    radio: 0.325,
    densidad: 2.6
  };

  const initialSpacecraft: SpacecraftData = {
    launchTime: 0, // Start at J2000
    velocity: 10 // Default velocity in km/s
  };

  // Use asteroid data passed from the form (via Simular). If none provided, fall back to defaults.
  const asteroidData = asteroidFromProp ?? initialAsteroid;
  const [spacecraftData, setSpacecraftData] = useState<SpacecraftData>(initialSpacecraft);
  // removed impactIndex: impact point determined by spacecraft trajectory (impactJD)

  const handleSpacecraftChange = (key: keyof SpacecraftData, value: number) => {
    setSpacecraftData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Kinetic Impactors</h2>
      
      <div className={styles.content}>
        <p>Kinetic Impactors Component Content</p>
        <div style={{ display: 'flex', gap: 24, width: '100%', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <OrbitKineticImpactadorCrash 
              asteroidElements={{
                a: asteroidData.semiMajorAxis,
                e: asteroidData.eccentricity,
                i: asteroidData.inclination,
                O: asteroidData.longitudeAscending,
                w: asteroidData.argumentPerihelion,
                M0: asteroidData.initialPhase
              }}
              spacecraftData={spacecraftData}
              asteroidMass={asteroidData.masa}
            />
          </div>

          <aside style={{ width: 380 }}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Asteroid Parameters</h3>
              <div className={styles.paramsList}>
                <ParamDisplay label="a (Semi-major Axis)" value={asteroidData.semiMajorAxis} unit="AU" min={0.5} max={3} />
                <ParamDisplay label="e (Eccentricity)" value={asteroidData.eccentricity} unit="" min={0} max={1} />
                <ParamDisplay label="i (Inclination)" value={asteroidData.inclination} unit="°" min={0} max={180} />
                <ParamDisplay label="Ω (Ascending Node)" value={asteroidData.longitudeAscending} unit="°" min={0} max={360} />
                <ParamDisplay label="ω (Arg. of Perihelion)" value={asteroidData.argumentPerihelion} unit="°" min={0} max={360} />
                <ParamDisplay label="M₀ (Initial Phase)" value={asteroidData.initialPhase} unit="°" min={0} max={360} />
              </div>
            </div>

            <div className={styles.panel} style={{ marginTop: 16 }}>
              <h3 className={styles.panelTitle}>Spacecraft Parameters</h3>
              <div className={styles.paramsList}>
                <ParamSlider
                  label="Launch Time"
                  value={spacecraftData.launchTime}
                  unit="days since J2000"
                  min={-1000}
                  max={1000}
                  step={10}
                  onChange={(value) => handleSpacecraftChange('launchTime', value)}
                />
                <ParamSlider
                  label="Spacecraft Velocity"
                  value={spacecraftData.velocity}
                  unit="km/s"
                  min={5}
                  max={40}
                  step={0.1}
                  onChange={(value) => handleSpacecraftChange('velocity', value)}
                />
              </div>
            </div>

            {/* Riesgo panel and others ... (existing code) */}
          </aside>
        </div>
        {/* Legend below simulation */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 12 }}>
          <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))', padding: '10px 18px', borderRadius: 8, display: 'flex', gap: 20, alignItems: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, background: '#CCE7F8', borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)' }} />
              <span style={{ color: '#ffffffcc' }}>Earth</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, background: '#262E37', borderRadius: 4, border: '1px solid rgba(0,0,0,0.25)' }} />
              <span style={{ color: '#ffffffcc' }}>Asteroid</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, background: '#00FF00', borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)' }} />
              <span style={{ color: '#ffffffcc' }}>Spacecraft Orbit</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 18, height: 18, background: '#FF00FF', borderRadius: 4, border: '1px solid rgba(0,0,0,0.15)' }} />
              <span style={{ color: '#ffffffcc' }}>Asteroid Orbit Post-Impact</span>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Back to Mitigation Menu
      </button>
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

interface ParamSliderProps {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const ParamSlider: React.FC<ParamSliderProps> = ({ label, value, unit, min, max, step, onChange }) => {
  return (
    <div className={styles.paramItem}>
      <div className={styles.paramHeader}>
        <span>{label}:</span>
        <span className={styles.paramValue}>{value.toFixed(2)} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
};

export default KineticImpactador;