import React from 'react';
import styles from './PanelTiempo.module.css';

interface PanelTiempoProps {
  dia?: number;
  mes?: number;
  año?: number;
}

const PanelTiempo: React.FC<PanelTiempoProps> = ({ 
  dia = 15, 
  mes = 8, 
  año = 2029 
}) => {
  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Tiempo de impacto calculado:</h3>
      
      <div className={styles.dateContainer}>
        <div className={styles.dateBox}>
          <span className={styles.label}>Día</span>
          <div className={styles.valueBox}>
            <span className={styles.value}>{dia}</span>
          </div>
        </div>

        <div className={styles.dateBox}>
          <span className={styles.label}>Mes</span>
          <div className={styles.valueBox}>
            <span className={styles.value}>{mes}</span>
          </div>
        </div>

        <div className={styles.dateBox}>
          <span className={styles.label}>Año</span>
          <div className={styles.valueBox}>
            <span className={styles.value}>{año}</span>
          </div>
        </div>
      </div>

      <p className={styles.message}>
        Según los datos orbitales, el asteroide impactaría contra la tierra en la fecha de arriba
      </p>
    </div>
  );
};

export default PanelTiempo;