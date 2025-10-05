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
      <h2 className={styles.title}>Select an Impact Mitigation Strategy</h2>
      
      <div className={styles.buttonGrid}>
        <button className={styles.mitigationButton} onClick={onSelectKinetic}>
          <div className={styles.buttonContent}>
            <img src="/impactador.png" alt="Kinetic Impactors" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Kinetic Impactors</span>
          </div>
        </button>
        
        <button className={styles.mitigationButton} onClick={onSelectGravity}>
          <div className={styles.buttonContent}>
            <img src="/tractor.png" alt="Gravity Tractors" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Gravity Tractors</span>
          </div>
        </button>
        
        <button className={styles.mitigationButton} onClick={onSelectLaser}>
          <div className={styles.buttonContent}>
            <img src="/laser.png" alt="Laser Ablation" className={styles.buttonImage} />
            <span className={styles.buttonTitle}>Laser Ablation</span>
          </div>
        </button>
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Back to Consequences
      </button>
    </div>
  );
};

export default MenuMitigacion;