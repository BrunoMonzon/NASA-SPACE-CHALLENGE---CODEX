import React from 'react';
import styles from './TiempoData.module.css'; // Opcional: puedes usar CSS modules

const TiempoData: React.FC = () => {
  return (
    <div className={styles.legendContainer}>
      {/* Tierra */}
      <div className={styles.legendItem}>
        <div className={styles.earthIcon} />
        <span className={styles.legendText}>Tierra</span>
      </div>

      {/* Asteroide */}
      <div className={styles.legendItem}>
        <div className={styles.asteroidIcon} />
        <span className={styles.legendText}>Asteroide</span>
      </div>
    </div>
  );
};

export default TiempoData;