import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Constantes
const J2000 = 2451545.0;
const AU_SCALE = 5;

// Elementos orbitales de la Tierra
const EARTH_ELEMENTS = {
  a0: 1.00000261,
  aDot: 0.00000562,
  e0: 0.01671123,
  eDot: -0.00004392,
  I0: -0.00001531,
  IDot: -0.01294668,
  L0: 100.46457166,
  LDot: 35999.37244981,
  w0: 102.93768193,
  wDot: 0.32327364,
  O0: 0.0,
  ODot: 0.0
};

interface AsteroidElements {
  a: number;
  e: number;
  i: number;
  O: number;
  w: number;
  M0: number;
}

function solveKepler(M: number, e: number, tolerance = 1e-6): number {
  const deg2rad = Math.PI / 180;
  const M_rad = M * deg2rad;
  const eStar = 57.29578 * e;
  
  let E = M + eStar * Math.sin(M_rad);
  let E_rad = E * deg2rad;
  
  for (let i = 0; i < 10; i++) {
    const deltaM = M - (E - eStar * Math.sin(E_rad));
    const deltaE = deltaM / (1 - e * Math.cos(E_rad));
    E = E + deltaE;
    E_rad = E * deg2rad;
    if (Math.abs(deltaE) < tolerance) break;
  }
  
  return E;
}

function calculateEarthElements(T: number) {
  return {
    a: EARTH_ELEMENTS.a0 + EARTH_ELEMENTS.aDot * T,
    e: EARTH_ELEMENTS.e0 + EARTH_ELEMENTS.eDot * T,
    I: EARTH_ELEMENTS.I0 + EARTH_ELEMENTS.IDot * T,
    L: EARTH_ELEMENTS.L0 + EARTH_ELEMENTS.LDot * T,
    w: EARTH_ELEMENTS.w0 + EARTH_ELEMENTS.wDot * T,
    O: EARTH_ELEMENTS.O0 + EARTH_ELEMENTS.ODot * T
  };
}

function calculateEarthPosition(T: number): THREE.Vector3 {
  const elements = calculateEarthElements(T);
  const deg2rad = Math.PI / 180;
  
  const omega = elements.w - elements.O;
  let M = elements.L - elements.w;
  M = ((M + 180) % 360) - 180;
  
  const E = solveKepler(M, elements.e);
  const E_rad = E * deg2rad;
  
  const xPrime = elements.a * (Math.cos(E_rad) - elements.e);
  const yPrime = elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(E_rad);
  
  const omega_rad = omega * deg2rad;
  const I_rad = elements.I * deg2rad;
  const O_rad = elements.O * deg2rad;
  
  const cosO = Math.cos(O_rad);
  const sinO = Math.sin(O_rad);
  const cosI = Math.cos(I_rad);
  const sinI = Math.sin(I_rad);
  const cosW = Math.cos(omega_rad);
  const sinW = Math.sin(omega_rad);
  
  const xEcl = (cosW * cosO - sinW * sinO * cosI) * xPrime +
               (-sinW * cosO - cosW * sinO * cosI) * yPrime;
  const yEcl = (cosW * sinO + sinW * cosO * cosI) * xPrime +
               (-sinW * sinO + cosW * cosO * cosI) * yPrime;
  const zEcl = (sinW * sinI) * xPrime + (cosW * sinI) * yPrime;
  
  return new THREE.Vector3(xEcl, zEcl, yEcl);
}

function calculateAsteroidPosition(elements: AsteroidElements, T: number): THREE.Vector3 {
  const deg2rad = Math.PI / 180;
  const epoch = J2000;
  const n = 0.9856076686 / Math.pow(elements.a, 1.5);
  const daysSinceEpoch = T - epoch;
  let M = elements.M0 + n * daysSinceEpoch;
  M = ((M + 180) % 360) - 180;
  
  const E = solveKepler(M, elements.e);
  const E_rad = E * deg2rad;
  
  const xPrime = elements.a * (Math.cos(E_rad) - elements.e);
  const yPrime = elements.a * Math.sqrt(1 - elements.e * elements.e) * Math.sin(E_rad);
  
  const omega_rad = elements.w * deg2rad;
  const I_rad = elements.i * deg2rad;
  const O_rad = elements.O * deg2rad;
  
  const cosO = Math.cos(O_rad);
  const sinO = Math.sin(O_rad);
  const cosI = Math.cos(I_rad);
  const sinI = Math.sin(I_rad);
  const cosW = Math.cos(omega_rad);
  const sinW = Math.sin(omega_rad);
  
  const xEcl = (cosW * cosO - sinW * sinO * cosI) * xPrime +
               (-sinW * cosO - cosW * sinO * cosI) * yPrime;
  const yEcl = (cosW * sinO + sinW * cosO * cosI) * xPrime +
               (-sinW * sinO + cosW * cosO * cosI) * yPrime;
  const zEcl = (sinW * sinI) * xPrime + (cosW * sinI) * yPrime;
  
  return new THREE.Vector3(xEcl, zEcl, yEcl);
}

function generateOrbitPoints(
  type: 'earth' | 'asteroid',
  elements?: AsteroidElements,
  numPoints = 360
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const msPerDay = 86400000;
  const currentJD = (Date.now() / msPerDay) + 2440587.5;
  
  if (type === 'earth') {
    for (let i = 0; i <= numPoints; i++) {
      const dayOffset = (i / numPoints) * 365.25;
      const julianDate = currentJD + dayOffset;
      const T = (julianDate - J2000) / 36525;
      const pos = calculateEarthPosition(T);
      points.push(pos.multiplyScalar(AU_SCALE));
    }
  } else if (type === 'asteroid' && elements) {
    const period = 365.25 * Math.pow(elements.a, 1.5);
    for (let i = 0; i <= numPoints; i++) {
      const dayOffset = (i / numPoints) * period;
      const julianDate = currentJD + dayOffset;
      const pos = calculateAsteroidPosition(elements, julianDate);
      points.push(pos.multiplyScalar(AU_SCALE));
    }
  }
  
  return points;
}

function detectIntersections(
  earthPoints: THREE.Vector3[],
  asteroidPoints: THREE.Vector3[],
  threshold = 0.1 * AU_SCALE
): THREE.Vector3[] {
  const intersections: THREE.Vector3[] = [];
  
  for (let i = 0; i < asteroidPoints.length - 1; i++) {
    for (let j = 0; j < earthPoints.length - 1; j++) {
      const astP1 = asteroidPoints[i];
      const astP2 = asteroidPoints[i + 1];
      const earthP1 = earthPoints[j];
      const earthP2 = earthPoints[j + 1];
      
      const minDist = segmentToSegmentDistance(astP1, astP2, earthP1, earthP2);
      
      if (minDist < threshold) {
        const midPoint = astP1.clone().add(astP2).multiplyScalar(0.5);
        const isDuplicate = intersections.some(p => p.distanceTo(midPoint) < threshold * 0.5);
        if (!isDuplicate) {
          intersections.push(midPoint);
        }
      }
    }
  }
  
  return intersections;
}

function segmentToSegmentDistance(
  a1: THREE.Vector3, a2: THREE.Vector3,
  b1: THREE.Vector3, b2: THREE.Vector3
): number {
  const distances = [
    pointToSegmentDistance(a1, b1, b2),
    pointToSegmentDistance(a2, b1, b2),
    pointToSegmentDistance(b1, a1, a2),
    pointToSegmentDistance(b2, a1, a2)
  ];
  return Math.min(...distances);
}

function pointToSegmentDistance(
  p: THREE.Vector3,
  a: THREE.Vector3,
  b: THREE.Vector3
): number {
  const ab = b.clone().sub(a);
  const ap = p.clone().sub(a);
  const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.dot(ab)));
  const closest = a.clone().add(ab.multiplyScalar(t));
  return p.distanceTo(closest);
}

const OrbitLine: React.FC<{
  points: THREE.Vector3[];
  color: string;
  opacity?: number;
}> = ({ points, color, opacity = 0.6 }) => {
  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const material = useMemo(() => {
    return new THREE.LineBasicMaterial({ color, opacity, transparent: true });
  }, [color, opacity]);

  const line = useMemo(() => {
    return new THREE.Line(geometry, material);
  }, [geometry, material]);

  return <primitive object={line} />;
};

const IntersectionMarkers: React.FC<{
  intersections: THREE.Vector3[];
}> = ({ intersections }) => {
  const meshRefs = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    meshRefs.current.forEach((mesh, i) => {
      if (mesh) {
        mesh.rotation.z = state.clock.elapsedTime * 2 + i;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.3;
        mesh.scale.set(scale, scale, scale);
      }
    });
  });
  
  return (
    <>
      {intersections.map((pos, index) => (
        <group key={index} position={pos}>
          <mesh
            ref={(el) => { if (el) meshRefs.current[index] = el; }}
            rotation={[0, 0, Math.PI / 4]}
          >
            <boxGeometry args={[0.5, 0.05, 0.05]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.5, 0.05, 0.05]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshBasicMaterial color="#ff0000" opacity={0.5} transparent />
          </mesh>
        </group>
      ))}
    </>
  );
};

const OrbitCrash: React.FC<{
  asteroidElements?: AsteroidElements;
}> = ({
  asteroidElements = {
    a: 1.458,
    e: 0.2228,
    i: 10.83,
    O: 304.27,
    w: 178.93,
    M0: 310.55
  }
}) => {
  const earthPoints = useMemo(() => generateOrbitPoints('earth'), []);
  const asteroidPoints = useMemo(() => generateOrbitPoints('asteroid', asteroidElements), [asteroidElements]);
  const intersections = useMemo(() => detectIntersections(earthPoints, asteroidPoints), [earthPoints, asteroidPoints]);
  
  return (
    <div style={{
    width: '814px',
    height: '450px',
    marginTop: '-10px',
    marginLeft: '10px',
    border: '1px solid white',
    borderRadius: '10px'
  }}>
      <Canvas
        camera={{ position: [0, 15, 20], fov: 50 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#5595D2']} />
        <ambientLight intensity={0.3} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={50}
        />
        
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshBasicMaterial color="#FFD700" />
        </mesh>
        
        <OrbitLine points={earthPoints} color="#CCE7F8" opacity={0.8} />
        <OrbitLine points={asteroidPoints} color="#262E37" opacity={0.8} />
        <IntersectionMarkers intersections={intersections} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
        <gridHelper args={[40, 40, '#8AB7E2', '#3B6C9D']} position={[0, -0.01, 0]} />
      </Canvas>
    </div>
  );
};

export default OrbitCrash;