import { useState } from 'react';
import FormularioAsteroide from "./FormularioAsteroide";
import ImpactDay from "./ImpactDay";

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

function Simular() {
  const [asteroidData, setAsteroidData] = useState<AsteroidData | null>(null);
  const [showImpactDay, setShowImpactDay] = useState(false);

  const handleSimulateData = (data: AsteroidData) => {
    setAsteroidData(data);
    setShowImpactDay(true);
  };

  return (
    <section>
      {!showImpactDay ? (
        <FormularioAsteroide onSimulate={handleSimulateData} />
      ) : (
        asteroidData && (
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
          />
        )
      )}
    </section>
  );
}

export default Simular;