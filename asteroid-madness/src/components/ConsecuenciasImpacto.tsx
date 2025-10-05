import React from 'react';
import styles from './ConsecuenciasImpacto.module.css';
import Mapa from './Mapa';
import MapaData from './MapaData';
import PanelImpacto from './PanelImpacto';

interface ConsecuenciasImpactoProps {
  nombre: string;
  coordenada?: [number, number];
  masa?: number;
  radio?: number;
  densidad?: number;
  velocidad?: number;
  onBack: () => void;
  onShowMitigation: () => void; // Nueva prop
}

const ConsecuenciasImpacto: React.FC<ConsecuenciasImpactoProps> = ({
  nombre,
  coordenada = [-55.183219, -16.653422],
  masa,
  radio = 50,
  densidad = 3000,
  velocidad = 20000,
  onBack,
  onShowMitigation
}) => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Consecuencias del Impacto: {nombre}</h2>
      
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.mapaContainer}>
            <Mapa coordenada={coordenada} />
          </div>
          <div className={styles.dataContainer}>
            <MapaData />
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.paneles}>
            <PanelImpacto 
              masa={masa}
              radio={radio}
              densidad={densidad}
              velocidad={velocidad}
              onBack={onBack}
              onShowMitigation={onShowMitigation} // Pasamos la nueva prop
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsecuenciasImpacto;