import React from 'react';
import styles from './GravityTractor.module.css';

interface GravityTractorProps {
  onBack: () => void;
}

const GravityTractor: React.FC<GravityTractorProps> = ({ onBack }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tractores Gravitacionales</h2>
      
      <div className={styles.content}>
        <p>Contenido del componente Tractores Gravitacionales</p>
        {/* Aquí irá el contenido específico de esta estrategia */}
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Volver al menú de mitigación
      </button>
    </div>
  );
};

export default GravityTractor;