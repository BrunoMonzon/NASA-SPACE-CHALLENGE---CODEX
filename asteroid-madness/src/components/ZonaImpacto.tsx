import React from 'react';
import styles from './ZonaImpacto.module.css';
import Mapa from './Mapa';

interface ZonaImpactoProps {
  coordenada: [number, number];
  onShowConsequences: () => void;
  onBack: () => void; // Nueva prop para volver atrás
}

const ZonaImpacto: React.FC<ZonaImpactoProps> = ({ coordenada, onShowConsequences, onBack }) => {
  const handleVerConsecuencias = () => {
    onShowConsequences();
  };

  const handleVolver = () => {
    onBack(); // Llamamos a la función para volver
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
      {/* Nuevo botón para volver */}
      <button 
        className={styles.backButton}
        onClick={handleVolver}
      >
        ← Volver a Visualización
      </button>
    </div>
  );
};

export default ZonaImpacto;