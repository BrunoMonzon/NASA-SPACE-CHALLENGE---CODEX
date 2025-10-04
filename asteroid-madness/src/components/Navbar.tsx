import { useState } from 'react';
import styles from './Navbar.module.css';

type NavButton = 'Inicio' | 'Aprender' | 'Simular';

interface NavbarProps {
  onNavigate?: (section: NavButton) => void;
}

const Navbar = ({ onNavigate }: NavbarProps) => {
  const [selected, setSelected] = useState<NavButton>('Inicio');

  const handleClick = (button: NavButton) => {
    setSelected(button);
    if (onNavigate) {
      onNavigate(button);
    }
  };

  return (
    <nav className={styles.navbar}>
      <button
        className={`${styles.navButton} ${selected === 'Inicio' ? styles.selected : ''}`}
        onClick={() => handleClick('Inicio')}
      >
        Inicio
      </button>
      <button
        className={`${styles.navButton} ${selected === 'Aprender' ? styles.selected : ''}`}
        onClick={() => handleClick('Aprender')}
      >
        Aprender
      </button>
      <button
        className={`${styles.navButton} ${selected === 'Simular' ? styles.selected : ''}`}
        onClick={() => handleClick('Simular')}
      >
        Simular
      </button>
    </nav>
  );
};

export default Navbar;