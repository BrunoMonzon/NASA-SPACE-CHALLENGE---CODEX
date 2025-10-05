import React from 'react';
import styles from './KineticImpactador.module.css';

interface KineticImpactadorProps {
  onBack: () => void;
}

const KineticImpactador: React.FC<KineticImpactadorProps> = ({ onBack }) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Impactadores Cinéticos</h2>
      
      <div className={styles.content}>
        <p>Contenido del componente Impactadores Cinéticos</p>
        {/* Aquí irá el contenido específico de esta estrategia */}
      </div>

      <button className={styles.backButton} onClick={onBack}>
        Volver al menú de mitigación
      </button>
    </div>
  );
};

export default KineticImpactador;