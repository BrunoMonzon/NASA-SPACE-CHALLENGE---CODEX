import React, { useState, useEffect } from 'react';
import styles from './PanelImpacto.module.css';

interface PanelImpactoProps {
  masa?: number;            // in kg
  radio?: number;           // in km
  densidad?: number;        // kg/m³
  velocidad?: number;       // m/s
  coordenada?: [number, number];
  onBack?: () => void;
  onShowMitigation?: () => void;
}

const PanelImpacto: React.FC<PanelImpactoProps> = ({
  masa,
  radio = 0.05, // radius in km
  densidad = 3000, // kg/m³
  velocidad = 20000, // m/s
  coordenada = [-55.183219, -16.653422],
  onBack,
  onShowMitigation
}) => {
  const [esMaritime, setEsMaritime] = useState<boolean | null>(null);
  const [cargandoElevacion, setCargandoElevacion] = useState(true);

  // Radius in meters
  const radioEnMetros = radio * 1000;

  // Calculated mass if not provided
  // mass = (4/3) * π * r³ * density
  const masaCalculada = masa || (4 / 3) * Math.PI * Math.pow(radioEnMetros, 3) * densidad;

  // Check if the location is maritime
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
          setEsMaritime(elevacion <= 0);
        } else {
          setEsMaritime(false);
        }
      } catch (error) {
        console.error('Error fetching elevation:', error);
        setEsMaritime(false);
      } finally {
        setCargandoElevacion(false);
      }
    };

    verificarElevacion();
  }, [coordenada]);

  // Realistic impact calculations
  const calcularConsecuencias = () => {
    // 1. Impact energy in joules
    const energiaJulios = 0.5 * masaCalculada * Math.pow(velocidad, 2);

    // 2. Conversion to megatons TNT
    const energiaMegatones = energiaJulios / (4.184 * 1e15);

    // 3. Crater diameter in km (Collins et al.)
    const diametroCraterKm = 0.001161 * Math.pow(energiaJulios / 1e6, 0.25);

    // 4. Seismic energy (fraction of total)
    const k = 1e-4; // seismic efficiency
    const energiaSismica = k * energiaJulios;

    // 5. Seismic magnitude (Richter scale)
    const magnitudSismica = (Math.log10(energiaSismica) - 4.8) / 1.5;

    // 6. Tsunami height (only if maritime)
    let alturaTsunami: number | null = null;
    if (esMaritime) {
      const craterM = diametroCraterKm * 1000;
      alturaTsunami = 0.05 * craterM; // ~5% of diameter
    }

    return {
      energia: energiaMegatones.toFixed(2),
      crater: diametroCraterKm.toFixed(2),
      magnitud: magnitudSismica.toFixed(2),
      tsunami: alturaTsunami !== null ? alturaTsunami.toFixed(1) : null
    };
  };

  const consecuencias = calcularConsecuencias();

  const handleVerEstrategias = () => {
    if (onShowMitigation) onShowMitigation();
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Impact Consequences</h3>

      <div className={styles.dataGrid}>
        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Impact Energy</span>
          <div className={styles.dataValue}>{consecuencias.energia} Mt</div>
        </div>

        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Crater Diameter</span>
          <div className={styles.dataValue}>{consecuencias.crater} km</div>
        </div>

        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Seismic Magnitude</span>
          <div className={styles.dataValue}>{consecuencias.magnitud} M</div>
        </div>

        <div className={styles.dataItem}>
          <span className={styles.dataLabel}>Tsunami</span>
          <div className={styles.dataValue}>
            {cargandoElevacion 
              ? 'Calculating...' 
              : consecuencias.tsunami !== null 
                ? `${consecuencias.tsunami} m` 
                : 'No tsunami risk'}
          </div>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <button className={styles.button} onClick={handleVerEstrategias}>
          View Impact Mitigation Strategies
        </button>
        <button className={styles.backButton} onClick={handleBack}>
          Back to Analysis
        </button>
      </div>
    </div>
  );
};

export default PanelImpacto;