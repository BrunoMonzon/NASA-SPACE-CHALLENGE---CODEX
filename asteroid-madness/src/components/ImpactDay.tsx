import React from 'react';
import styles from './ImpactDay.module.css';
import OrbitCrash from './OrbitCrash';

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
  densidad
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Análisis de Impacto: {nombre}</h2>
      
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
  );
};

export default ImpactDay;