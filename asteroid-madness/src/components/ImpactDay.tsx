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
  impactData: ImpactData;
  onShowConsequences: (physicalParams: { masa: number; radio: number; densidad: number }, coordinate: [number, number]) => void;
  onBack: () => void;
}

interface RangeInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const RangeInput: React.FC<RangeInputProps> = ({ label, value, min, max, step, onChange }) => {
  return (
    <div className={styles.dataItem}>
      <div className={styles.dataLabel}>{label}</div>
      <div className={styles.dataValue}>{value.toFixed(2)}</div>
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
  impactData,
  onShowConsequences,
  onBack,
}) => {
  const [physicalParams, setPhysicalParams] = useState({
    masa: initialMasa,
    radio: initialRadio,
    densidad: initialDensidad,
  });

  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number]>(
    impactData.impact && impactData.latitude && impactData.longitude
      ? [impactData.longitude, impactData.latitude]
      : [-55.183219, -16.653422]
  );

  const handleParamChange = (param: keyof typeof physicalParams, value: number) => {
    setPhysicalParams((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleCoordinateChange = (coord: [number, number]) => {
    setSelectedCoordinate(coord);
  };

  const handleShowConsequences = () => {
    onShowConsequences(physicalParams, selectedCoordinate);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Análisis de Impacto: {nombre}</h2>
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
              <h3 className={styles.panelTitle}>Parámetros del asteroide</h3>
              <div className={styles.dataGrid}>
                <RangeInput
                  label="Masa (kg)"
                  value={physicalParams.masa}
                  min={1e10}
                  max={1e20}
                  step={1e10}
                  onChange={(value) => handleParamChange('masa', value)}
                />
                <RangeInput
                  label="Radio (m)"
                  value={physicalParams.radio}
                  min={10}
                  max={1000}
                  step={1}
                  onChange={(value) => handleParamChange('radio', value)}
                />
                <RangeInput
                  label="Densidad (kg/m³)"
                  value={physicalParams.densidad}
                  min={1000}
                  max={5000}
                  step={100}
                  onChange={(value) => handleParamChange('densidad', value)}
                />
              </div>
              <div className={styles.buttonGroup}>
                <button className={styles.button} onClick={handleShowConsequences}>
                  Ver consecuencias de impacto
                </button>
                <button className={styles.backButton} onClick={onBack}>
                  Volver a Visualización
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