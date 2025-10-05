import React, { useState, useEffect } from 'react';
import styles from './PanelImpacto.module.css';

interface PanelImpactoProps {
  masa?: number;
  radio?: number;
  densidad?: number;
  velocidad?: number;
  coordenada?: [number, number];
  onBack?: () => void;
  onShowMitigation?: () => void;
}

const PanelImpacto: React.FC<PanelImpactoProps> = ({
  masa,
  radio = 50,
  densidad = 3000,
  velocidad = 20000,
  coordenada = [-55.183219, -16.653422],
  onBack,
  onShowMitigation
}) => {
  const [esMaritime, setEsMaritime] = useState<boolean | null>(null);
  const [cargandoElevacion, setCargandoElevacion] = useState(true);

  // Calcular masa si no se proporciona
  const masaCalculada = masa || (4/3) * Math.PI * Math.pow(radio, 3) * densidad;
  
  // Verificar si la ubicación es marítima
  useEffect(() => {
    const verificarElevacion = async () => {
      setCargandoElevacion(true);
      try {
        const [lon, lat] = coordenada;
        const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const elevacion = data.results[0].elevation;
          // Considerar marítimo si elevación es <= 0
          setEsMaritime(elevacion <= 0);
        } else {
          setEsMaritime(false);
        }
      } catch (error) {
        console.error('Error al obtener elevación:', error);
        // En caso de error, asumir que no es marítimo
        setEsMaritime(false);
      } finally {
        setCargandoElevacion(false);
      }
    };

    verificarElevacion();
  }, [coordenada]);
  
  // Cálculos según las fórmulas proporcionadas
  const calcularConsecuencias = () => {
    // 1. Energía del impacto en julios
    const energiaJulios = 0.5 * masaCalculada * Math.pow(velocidad, 2);
    
    // 2. Conversión a megatones TNT
    const energiaMegatones = energiaJulios / (4.184 * Math.pow(10, 15));
    
    // 3. Diámetro del cráter en km
    const diametroCraterKm = 0.07 * Math.pow(energiaMegatones, 0.25);
    
    // 4. Energía sísmica (10^-4 de la energía total)
    const energiaSismica = 0.0001 * energiaJulios;
    
    // 5. Magnitud sísmica
    const magnitudSismica = 0.67 * Math.log10(energiaSismica) - 5.87;
    
    // 6. Altura del tsunami en metros (solo si es marítimo)
    let alturaTsunami: number | null = null;
    if (esMaritime) {
      alturaTsunami = 0.1 * (diametroCraterKm * 1000);
    }
    
    return {
      energia: energiaMegatones.toFixed(2),
      crater: diametroCraterKm.toFixed(2),
      magnitud: magnitudSismica.toFixed(1),
      tsunami: alturaTsunami !== null ? alturaTsunami.toFixed(1) : null
    };
  };

  const consecuencias = calcularConsecuencias();

  const handleVerEstrategias = () => {
    if (onShowMitigation) {
      onShowMitigation();
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
          <span className={styles.dataLabel}>Diámetro del cráter</span>
          <div className={styles.dataValue}>{consecuencias.crater} km</div>
        </div>
        
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Magnitud sísmica</span>
          <div className={styles.dataValue}>{consecuencias.magnitud} M</div>
        </div>
        
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Tsunami</span>
          <div className={styles.dataValue}>
            {cargandoElevacion 
              ? 'Calculando...' 
              : consecuencias.tsunami !== null 
                ? `${consecuencias.tsunami} m` 
                : 'Sin riesgo tsunami'}
          </div>
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