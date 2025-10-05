import React from 'react';
import styles from './LaserAblation.module.css';

interface LaserAblationProps {
  onBack: () => void;
}

const LaserAblation: React.FC<LaserAblationProps> = ({ onBack }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Ablación con Láser</h2>
      
      <div className={styles.content}>
        <p>Contenido del componente Ablación con Láser</p>
        {/* Aquí irá el contenido específico de esta estrategia */}
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Volver al menú de mitigación
      </button>
    </div>
  );
};

export default LaserAblation;