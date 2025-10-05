import React from 'react';
import styles from './ImpactDay.module.css';
import OrbitCrash from './OrbitCrash';
import PanelTiempo from './PanelTiempo';
import TiempoData from './TiempoData';
import ZonaImpacto from './ZonaImpacto';

interface ImpactDayProps {
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
  onShowConsequences: () => void; // Nueva prop
}

const ImpactDay: React.FC<ImpactDayProps> = ({
  nombre,
  semiMajorAxis,
  eccentricity,
  inclination,
  longitudeAscending,
  argumentPerihelion,
  initialPhase,
  masa,
  radio,
  densidad,
  onShowConsequences
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Análisis de Impacto: {nombre}</h2>
      
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.orbitContainer}>
            <OrbitCrash
              asteroidElements={{
                a: semiMajorAxis,
                e: eccentricity,
                i: inclination,
                O: longitudeAscending,
                w: argumentPerihelion,
                M0: initialPhase
              }}
            />
          </div>
          <div className={styles.dataContainer}>
            <TiempoData />
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.paneles}>
            <PanelTiempo dia={23} mes={12} año={2030} />
            <ZonaImpacto 
              coordenada={[-55.183219, -16.653422]} 
              onShowConsequences={onShowConsequences} // Pasamos la prop
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDay;