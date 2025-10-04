import { useState } from 'react';
import FormularioAsteroide from "./FormularioAsteroide";
import VisualizacionAsteroide from "./VisualizacionAsteroide"; // Nuevo import

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
  const [showVisualization, setShowVisualization] = useState(false);

  const handleSimulateData = (data: AsteroidData) => {
    setAsteroidData(data);
    setShowVisualization(true);
  };

  return (
    <section>
      {!showVisualization ? (
        <FormularioAsteroide onSimulate={handleSimulateData} />
      ) : (
        asteroidData && (
          <VisualizacionAsteroide
            asteroidData={asteroidData}
            onBack={() => {
              setShowVisualization(false);
              setAsteroidData(null);
            }}
          />
        )
      )}
    </section>
  );
}

export default Simular;