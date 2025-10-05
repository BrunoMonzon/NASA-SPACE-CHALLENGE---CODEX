import { useState } from 'react';
import FormularioAsteroide from "./FormularioAsteroide";
import VisualizacionAsteroide from "./VisualizacionAsteroide";
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
  velocidad: number;
}

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

type ViewState = 'form' | 'visualization' | 'impactDay' | 'consequences' | 'mitigation' | 'kinetic' | 'gravity' | 'laser';

function Simular() {
  const [asteroidData, setAsteroidData] = useState<AsteroidData | null>(null);
  const [impactData, setImpactData] = useState<ImpactData | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('form');
  const [editedPhysicalParams, setEditedPhysicalParams] = useState<{ masa: number, radio: number, densidad: number, velocidad: number } | null>(null);
  const [selectedCoordinate, setSelectedCoordinate] = useState<[number, number] | null>(null);

  const handleSimulateData = (data: AsteroidData, impact: ImpactData) => {
    setAsteroidData(data);
    setImpactData(impact);
    setCurrentView('visualization');
  };

  const handleBackToForm = () => {
    setCurrentView('form');
  };

  const handleContinueToImpactDay = (impactData: ImpactData) => {
    setImpactData(impactData);
    setCurrentView('impactDay');
  };

  const handleShowConsequences = (physicalParams: { masa: number, radio: number, densidad: number, velocidad: number }, coordinate: [number, number]) => {
    setEditedPhysicalParams(physicalParams);
    setSelectedCoordinate(coordinate);
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

  const handleBackToVisualization = () => {
    setCurrentView('visualization');
  };

  return (
    <section>
      {currentView === 'form' && (
        <FormularioAsteroide onSimulate={handleSimulateData} />
      )}
      
      {currentView === 'visualization' && asteroidData && (
        <VisualizacionAsteroide
          asteroidData={asteroidData}
          onBack={handleBackToForm}
          onContinue={handleContinueToImpactDay}
        />
      )}
      
      {currentView === 'impactDay' && asteroidData && impactData && (
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
          velocidad={asteroidData.velocidad}
          impactData={impactData}
          onShowConsequences={handleShowConsequences}
          onBack={handleBackToVisualization}
        />
      )}
      
      {currentView === 'consequences' && asteroidData && (
        <ConsecuenciasImpacto
          nombre={asteroidData.nombre}
          masa={editedPhysicalParams ? editedPhysicalParams.masa : asteroidData.masa}
          radio={editedPhysicalParams ? editedPhysicalParams.radio : asteroidData.radio}
          densidad={editedPhysicalParams ? editedPhysicalParams.densidad : asteroidData.densidad}
          velocidad={editedPhysicalParams ? editedPhysicalParams.velocidad : asteroidData.velocidad}
          coordenada={selectedCoordinate || (impactData?.latitude && impactData?.longitude 
            ? [impactData.longitude, impactData.latitude] 
            : [-55.183219, -16.653422])}
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
      
      {currentView === 'gravity' && asteroidData && (
        <GravityTractor 
          asteroidData={asteroidData} 
          onBack={handleBackToMitigation} 
        />
      )}
      
      {currentView === 'laser' && (
        <LaserAblation onBack={handleBackToMitigation} />
      )}
    </section>
  );
}

export default Simular;