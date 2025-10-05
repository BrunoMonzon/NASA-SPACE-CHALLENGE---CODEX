import React from 'react';
import styles from './ZonaImpacto.module.css';
import Mapa from './Mapa';

interface ZonaImpactoProps {
  coordenada: [number, number];
  onShowConsequences: () => void; // Nueva prop
}

const ZonaImpacto: React.FC<ZonaImpactoProps> = ({ coordenada, onShowConsequences }) => {
  const handleVerConsecuencias = () => {
    onShowConsequences(); // Llamamos a la función en lugar del console.log
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Zona de impacto calculada:</h2>
      <div className={styles.mapaContainer}>
        <Mapa coordenada={coordenada} />
      </div>
      <button 
        className={styles.button}
        onClick={handleVerConsecuencias}
      >
        Ver consecuencias de impacto
      </button>
    </div>
  );
};

export default ZonaImpacto;