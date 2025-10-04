import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Inicio from './components/Inicio';
import Aprender from './components/Aprender';
import Simular from './components/Simular';

type Section = 'Inicio' | 'Aprender' | 'Simular';

function App() {
  const [currentSection, setCurrentSection] = useState<Section>('Inicio');

  const renderSection = () => {
    switch (currentSection) {
      case 'Inicio':
        return <Inicio />;
      case 'Aprender':
        return <Aprender />;
      case 'Simular':
        return <Simular />;
      default:
        return <Inicio />;
    }
  };

  return (
    <div className="App">
      <Navbar onNavigate={setCurrentSection} />
      {renderSection()}
    </div>
  );
}

export default App;