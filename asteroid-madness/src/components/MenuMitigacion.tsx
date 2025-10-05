import React from 'react';
import styles from './MenuMitigacion.module.css';

interface MenuMitigacionProps {
  onBack: () => void;
  onSelectKinetic: () => void;
  onSelectGravity: () => void;
  onSelectLaser: () => void;
}

const MenuMitigacion: React.FC<MenuMitigacionProps> = ({ 
  onBack, 
  onSelectKinetic, 
  onSelectGravity, 
  onSelectLaser 
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Seleccionar una estrategia para mitigar impacto</h2>
      
      <div className={styles.buttonGrid}>
        <button className={styles.mitigationButton} onClick={onSelectKinetic}>
          <div className={styles.buttonContent}>
            <img src="/impactador.png" alt="Impactadores Cinéticos" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Impactadores Cinéticos</span>
          </div>
        </button>
        
        <button className={styles.mitigationButton} onClick={onSelectGravity}>
          <div className={styles.buttonContent}>
            <img src="/tractor.png" alt="Tractores Gravitacionales" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Tractores Gravitacionales</span>
          </div>
        </button>
        
        <button className={styles.mitigationButton} onClick={onSelectLaser}>
          <div className={styles.buttonContent}>
            <img src="/laser.png" alt="Ablación con Láser" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Ablación con Láser</span>
          </div>
        </button>
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Volver a consecuencias
      </button>
    </div>
  );
};

export default MenuMitigacion;