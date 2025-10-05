import { useState } from 'react';
import FormularioAsteroide from "./FormularioAsteroide";
import ImpactDay from "./ImpactDay";
import ConsecuenciasImpacto from "./ConsecuenciasImpacto";
import MenuMitigacion from "./MenuMitigacion";
import KineticImpactador from "./KineticImpactador";
import GravityTractor from "./GravityTractor";
import LaserAblation from "./LaserAblation";

interface AsteroidData {
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
}

type ViewState = 'form' | 'impactDay' | 'consequences' | 'mitigation' | 'kinetic' | 'gravity' | 'laser';

function Simular() {
  const [asteroidData, setAsteroidData] = useState<AsteroidData | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('form');

  const handleSimulateData = (data: AsteroidData) => {
    setAsteroidData(data);
    setCurrentView('impactDay');
  };

  const handleShowConsequences = () => {
    setCurrentView('consequences');
  };

  const handleBackToImpactDay = () => {
    setCurrentView('impactDay');
  };

  const handleShowMitigation = () => {
    setCurrentView('mitigation');
  };

  const handleBackToConsequences = () => {
    setCurrentView('consequences');
  };

  const handleSelectKinetic = () => {
    setCurrentView('kinetic');
  };

  const handleSelectGravity = () => {
    setCurrentView('gravity');
  };

  const handleSelectLaser = () => {
    setCurrentView('laser');
  };

  const handleBackToMitigation = () => {
    setCurrentView('mitigation');
  };

  return (
    <section>
      {currentView === 'form' && (
        <FormularioAsteroide onSimulate={handleSimulateData} />
      )}
      {currentView === 'impactDay' && asteroidData && (
        <ImpactDay
          nombre={asteroidData.nombre}
          semiMajorAxis={asteroidData.semiMajorAxis}
          eccentricity={asteroidData.eccentricity}
          inclination={asteroidData.inclination}
          longitudeAscending={asteroidData.longitudeAscending}
          argumentPerihelion={asteroidData.argumentPerihelion}
          initialPhase={asteroidData.initialPhase}
          masa={asteroidData.masa}
          radio={asteroidData.radio}
          densidad={asteroidData.densidad}
          onShowConsequences={handleShowConsequences}
        />
      )}
      {currentView === 'consequences' && asteroidData && (
        <ConsecuenciasImpacto
          nombre={asteroidData.nombre}
          masa={asteroidData.masa}
          radio={asteroidData.radio}
          densidad={asteroidData.densidad}
          coordenada={[-55.183219, -16.653422]}
          onBack={handleBackToImpactDay}
          onShowMitigation={handleShowMitigation}
        />
      )}
      {currentView === 'mitigation' && (
        <MenuMitigacion 
          onBack={handleBackToConsequences}
          onSelectKinetic={handleSelectKinetic}
          onSelectGravity={handleSelectGravity}
          onSelectLaser={handleSelectLaser}
        />
      )}
      {currentView === 'kinetic' && (
        <KineticImpactador onBack={handleBackToMitigation} asteroidData={asteroidData} />
      )}
      {currentView === 'gravity' && (
        <GravityTractor onBack={handleBackToMitigation} />
      )}
      {currentView === 'laser' && (
        <LaserAblation onBack={handleBackToMitigation} />
      )}
    </section>
  );
}

export default Simular;