import React from 'react';
import styles from './PanelImpacto.module.css';

interface PanelImpactoProps {
  masa?: number;
  radio?: number;
  densidad?: number;
  velocidad?: number;
  onBack?: () => void;
  onShowMitigation?: () => void; // Nueva prop
}

const PanelImpacto: React.FC<PanelImpactoProps> = ({
  masa,
  radio = 50,
  densidad = 3000,
  velocidad = 20000,
  onBack,
  onShowMitigation
}) => {
  // Calcular masa si no se proporciona
  const masaCalculada = masa || (4/3) * Math.PI * Math.pow(radio, 3) * densidad;
  
  // Cálculos según las fórmulas proporcionadas
  const calcularConsecuencias = () => {
    // Energía del impacto en julios
    const energiaJulios = 0.5 * masaCalculada * Math.pow(velocidad, 2);
    
    // Conversión a megatones TNT
    const energiaMegatones = energiaJulios / (4.184 * Math.pow(10, 15));
    
    // Diámetro del cráter en km
    const diametroCraterKm = 0.07 * Math.pow(energiaMegatones, 0.25);
    
    // Energía sísmica
    const energiaSismica = 0.0001 * energiaJulios;
    
    // Magnitud sísmica
    const magnitudSismica = 0.67 * Math.log10(energiaSismica) - 5.87;
    
    // Altura del tsunami en metros
    const alturaTsunami = 0.1 * (diametroCraterKm * 1000);
    
    return {
      energia: energiaMegatones.toFixed(2),
      crater: diametroCraterKm.toFixed(2),
      magnitud: magnitudSismica.toFixed(1),
      tsunami: alturaTsunami.toFixed(1)
    };
  };

  const consecuencias = calcularConsecuencias();

  const handleVerEstrategias = () => {
    if (onShowMitigation) {
      onShowMitigation(); // Usamos la nueva prop
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Consecuencias de impacto:</h3>
      
      <div className={styles.dataGrid}>
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Energía del impacto</span>
          <div className={styles.dataValue}>{consecuencias.energia} Mt</div>
        </div>
        
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Crater</span>
          <div className={styles.dataValue}>{consecuencias.crater} km</div>
        </div>
        
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Magnitud sísmica</span>
          <div className={styles.dataValue}>{consecuencias.magnitud} M</div>
        </div>
        
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Tsunami</span>
          <div className={styles.dataValue}>{consecuencias.tsunami} m</div>
        </div>
      </div>
      
      <div className={styles.buttonGroup}>
        <button 
          className={styles.button}
          onClick={handleVerEstrategias}
        >
          Ver estrategias de mitigación de impacto
        </button>
        <button 
          className={styles.backButton}
          onClick={handleBack}
        >
          Volver al análisis
        </button>
      </div>
    </div>
  );
};

export default PanelImpacto;