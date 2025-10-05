import React, { useState } from 'react';
import styles from './ImpactDay.module.css';
import Mapa from './Mapa';

interface ImpactData {
  impact: boolean;
  date?: {
    day: number;
    month: number;
    year: number;
  };
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  closest_approach_km?: number;
}

interface ImpactDayProps {
  nombre: string;
  semiMajorAxis: number;
  eccentricity: number;
  inclination: number;
  longitudeAscending: number;
  argumentPerihelion: number;
  initialPhase: number;
  masa: number;
  radio: number;
  densidad: number;
  velocidad: number;
  impactData: ImpactData;
  onShowConsequences: (physicalParams: { masa: number; radio: number; densidad: number; velocidad: number }, coordinate: [number, number]) => void;
  onBack: () => void;
}

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  decimals?: number;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, min, max, step, onChange, decimals = 2 }) => {
  const formatValue = () => {
    if (label.includes('Mass') || label.includes('Velocity')) {
      return value.toLocaleString('en-US');
    }
    return value.toFixed(decimals);
  };

  return (
    <div className={styles.dataItem}>
      <div className={styles.dataLabel}>{label}</div>
      <div className={styles.dataValue}>{formatValue()}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.rangeSlider}
      />
    </div>
  );
};

const ImpactDay: React.FC<ImpactDayProps> = ({
  nombre,
  masa: initialMasa,
  radio: initialRadio,
  densidad: initialDensidad,
  velocidad: initialVelocidad,
  impactData,
  onShowConsequences,
  onBack,
}) => {
  const [physicalParams, setPhysicalParams] = useState({
    masa: initialMasa,
    radio: initialRadio,
    densidad: initialDensidad,
    velocidad: initialVelocidad,
  });

  const [, setLastChanged] = useState<'masa' | 'radio' | 'densidad' | 'velocidad'>('masa');

  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number]>(
    impactData.impact && impactData.latitude && impactData.longitude
      ? [impactData.longitude, impactData.latitude]
      : [-55.183219, -16.653422]
  );

  // Conversion formulas: m = (4/3) * π * r³ * ρ
  // m in tons, r in km, ρ in kg/m³

  const calcularMasaDesdeRadioYDensidad = (radioKm: number, densidad: number): number => {
    const radioMetros = radioKm * 1000;
    const volumen = (4/3) * Math.PI * Math.pow(radioMetros, 3);
    const masaKg = volumen * densidad;
    return masaKg / 1000; // convert to tons
  };

  const calcularRadioDesdeMasaYDensidad = (masaToneladas: number, densidad: number): number => {
    const masaKg = masaToneladas * 1000;
    const volumen = masaKg / densidad;
    const radioMetros = Math.pow((3 * volumen) / (4 * Math.PI), 1/3);
    return radioMetros / 1000; // convert to km
  };


  const handleParamChange = (param: 'masa' | 'radio' | 'densidad' | 'velocidad', value: number) => {
    setLastChanged(param);
    
    if (param === 'masa') {
      // If mass changes, recalculate radius keeping density constant
      const nuevoRadio = calcularRadioDesdeMasaYDensidad(value, physicalParams.densidad);
      setPhysicalParams({
        masa: value,
        radio: Math.max(0.01, Math.min(1, nuevoRadio)),
        densidad: physicalParams.densidad,
        velocidad: physicalParams.velocidad,
      });
    } else if (param === 'radio') {
      // If radius changes, recalculate mass keeping density constant
      const nuevaMasa = calcularMasaDesdeRadioYDensidad(value, physicalParams.densidad);
      setPhysicalParams({
        masa: Math.max(1000, Math.min(1000000, nuevaMasa)),
        radio: value,
        densidad: physicalParams.densidad,
        velocidad: physicalParams.velocidad,
      });
    } else if (param === 'densidad') {
      // If density changes, recalculate mass keeping radius constant
      const nuevaMasa = calcularMasaDesdeRadioYDensidad(physicalParams.radio, value);
      setPhysicalParams({
        masa: Math.max(1000, Math.min(1000000, nuevaMasa)),
        radio: physicalParams.radio,
        densidad: value,
        velocidad: physicalParams.velocidad,
      });
    } else if (param === 'velocidad') {
      // Velocity is independent, just update it
      setPhysicalParams({
        masa: physicalParams.masa,
        radio: physicalParams.radio,
        densidad: physicalParams.densidad,
        velocidad: value,
      });
    }
  };

  const handleCoordinateChange = (coord: [number, number]) => {
    setSelectedCoordinate(coord);
  };

  const handleShowConsequences = () => {
    onShowConsequences(physicalParams, selectedCoordinate);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Impact Analysis: {nombre}</h2>
      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <div className={styles.mapaContainer}>
            <Mapa
              coordenada={selectedCoordinate}
              onCoordinateChange={handleCoordinateChange}
            />
          </div>
        </div>
        <div className={styles.rightColumn}>
          <div className={styles.paneles}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Asteroid Parameters</h3>
              <p className={styles.helpText}>
                The parameters are physically related. Changing one will automatically adjust the others.
              </p>
              <div className={styles.dataGrid}>
                <RangeInput
                  label="Mass (tons)"
                  value={physicalParams.masa}
                  min={1000}
                  max={1000000}
                  step={1000}
                  onChange={(value) => handleParamChange('masa', value)}
                  decimals={0}
                />
                <RangeInput
                  label="Radius (km)"
                  value={physicalParams.radio}
                  min={0.01}
                  max={1}
                  step={0.001}
                  onChange={(value) => handleParamChange('radio', value)}
                  decimals={3}
                />
                <RangeInput
                  label="Density (kg/m³)"
                  value={physicalParams.densidad}
                  min={1200}
                  max={8000}
                  step={100}
                  onChange={(value) => handleParamChange('densidad', value)}
                  decimals={0}
                />
                <RangeInput
                  label="Velocity (m/s)"
                  value={physicalParams.velocidad}
                  min={1000}
                  max={50000}
                  step={100}
                  onChange={(value) => handleParamChange('velocidad', value)}
                  decimals={0}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.button} onClick={handleShowConsequences}>
                  View Impact Consequences
                </button>
                <button className={styles.backButton} onClick={onBack}>
                  Back to Visualization
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactDay;