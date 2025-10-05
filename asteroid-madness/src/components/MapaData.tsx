import React from 'react';
import styles from './MapaData.module.css';

const MapaData: React.FC = () => {
  return (
    <div className={styles.legendContainer}>
      <div className={styles.legendItem}>
        <div className={styles.mapaIcon} />
        <span className={styles.legendText}>Zona afectada</span>
      </div>
    </div>
  );
};

export default MapaData;