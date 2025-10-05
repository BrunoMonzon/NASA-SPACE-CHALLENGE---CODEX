import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Constantes
const J2000 = 2451545.0;
const AU_SCALE = 5;
const KM_TO_AU = 6.68459e-9; // Conversion factor from km to AU

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

interface SpacecraftData {
  launchTime: number; // Days since J2000
  velocity: number; // km/s
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
): { points: THREE.Vector3[]; jds: number[] } {
  const points: THREE.Vector3[] = [];
  const jds: number[] = [];
  const msPerDay = 86400000;
  const currentJD = (Date.now() / msPerDay) + 2440587.5;

  if (type === 'earth') {
    for (let i = 0; i <= numPoints; i++) {
      const dayOffset = (i / numPoints) * 365.25;
      const julianDate = currentJD + dayOffset;
      const T = (julianDate - J2000) / 36525;
      const pos = calculateEarthPosition(T);
      points.push(pos.multiplyScalar(AU_SCALE));
      jds.push(julianDate);
    }
  } else if (type === 'asteroid' && elements) {
    const period = 365.25 * Math.pow(elements.a, 1.5);
    for (let i = 0; i <= numPoints; i++) {
      const dayOffset = (i / numPoints) * period;
      const julianDate = currentJD + dayOffset;
      const pos = calculateAsteroidPosition(elements, julianDate);
      points.push(pos.multiplyScalar(AU_SCALE));
      jds.push(julianDate);
    }
  }

  return { points, jds };
}

function generateSpacecraftTrajectory(
  spacecraftData: SpacecraftData,
  asteroidElements: AsteroidElements,
  numPoints = 100
): { points: THREE.Vector3[]; impactJD: number } {
  const points: THREE.Vector3[] = [];
  const launchJD = J2000 + spacecraftData.launchTime;

  // Calculate Earth position at launch time
  const T = (launchJD - J2000) / 36525;
  const earthPos = calculateEarthPosition(T);

  // Estimate travel time from Earth to asteroid using straight-line distance and spacecraft speed
  // Compute an initial guess of asteroid position at launch+1yr to get distance scale; we'll iterate minimally
  // Use asteroid position at launchJD as an approximate intercept target
  const approxAstPosAtLaunch = calculateAsteroidPosition(asteroidElements, launchJD);
  const distMeters = earthPos.clone().sub(approxAstPosAtLaunch).length() * 1.496e11; // AU -> meters
  const speed_m_s = spacecraftData.velocity * 1000; // km/s -> m/s
  const travelTimeDays = Math.max(1, distMeters / speed_m_s / 86400); // seconds -> days
  const impactJD = launchJD + travelTimeDays;
  const asteroidPos = calculateAsteroidPosition(asteroidElements, impactJD);

  // Generate straight-line trajectory
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const pos = earthPos.clone().lerp(asteroidPos, t);
    points.push(pos.multiplyScalar(AU_SCALE));
  }

  return { points, impactJD };
}

function calculateDeflectedAsteroidElements(
  originalElements: AsteroidElements,
  spacecraftData: SpacecraftData,
  asteroidMass: number
): AsteroidElements {
  // Simplified deflection model: adjust semi-major axis based on momentum transfer
  const spacecraftMass = 1000; // kg, typical for a kinetic impactor
  const deltaV = spacecraftData.velocity * 1e3; // Convert km/s to m/s
  const momentum = spacecraftMass * deltaV;
  const asteroidVelocity = Math.sqrt(3.986e14 / (originalElements.a * 1.496e11)); // Approx velocity at semi-major axis (m/s)
  const deltaVAsteroid = momentum / asteroidMass; // Change in asteroid velocity (m/s)

  // Convert to AU/day for orbital calculation
  const deltaV_AUperDay = deltaVAsteroid * 8.64e4 * KM_TO_AU;
  const originalV = asteroidVelocity * 8.64e4 * KM_TO_AU; // Convert to AU/day
  
  // Adjust semi-major axis (simplified: assumes velocity change affects orbit size)
  const newV = originalV + deltaV_AUperDay;
  const newA = 3.986e14 / (newV * newV) / 1.496e11; // New semi-major axis in AU
  
  return {
    ...originalElements,
    a: Math.max(0.5, newA) // Ensure reasonable bounds
  };
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

  return <primitive object={new THREE.Line(geometry, material)} />;
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

const OrbitKineticImpactadorCrash: React.FC<{
  asteroidElements: AsteroidElements;
  spacecraftData: SpacecraftData;
  asteroidMass: number;
  impactIndex?: number;
  reloadKey?: number;
}> = ({ asteroidElements, spacecraftData, asteroidMass, impactIndex = 180, reloadKey = 0 }) => {
  const { points: earthPoints } = useMemo(() => generateOrbitPoints('earth'), []);
  const { points: asteroidPoints, jds: asteroidJds } = useMemo(() => generateOrbitPoints('asteroid', asteroidElements), [asteroidElements]);
  const { launchTime: scLaunchTime, velocity: scVelocity } = spacecraftData;
  const { points: spacecraftPoints, impactJD } = useMemo(() => 
    generateSpacecraftTrajectory(spacecraftData, asteroidElements), 
    [scLaunchTime, scVelocity, asteroidElements]
  );
  const deflectedAsteroidElements = useMemo(() => 
    calculateDeflectedAsteroidElements(asteroidElements, spacecraftData, asteroidMass), 
    [asteroidElements, scLaunchTime, scVelocity, asteroidMass]
  );
  useMemo(() => generateOrbitPoints('asteroid', deflectedAsteroidElements), [deflectedAsteroidElements]);

  // Find index where impactJD occurs (closest JD in asteroidJds)
  // Create deflected points by applying deltaV at a given index and integrating under Sun gravity
  const deflectedAsteroidPoints = useMemo(() => {
    const pts = asteroidPoints.slice();
    if (!pts || pts.length === 0) return pts;

    // determine index of impact: prefer impactJD (from spacecraft trajectory) if available
    // Use the asteroid position at impactJD and pick the closest precomputed point (more robust)
    let idx = Math.max(0, Math.min(pts.length - 1, impactIndex));
    if (typeof impactJD === 'number') {
      try {
        const impactPos = calculateAsteroidPosition(asteroidElements, impactJD).multiplyScalar(AU_SCALE);
        let best = 0;
        let bestDist = pts[0].distanceTo(impactPos);
        for (let k = 1; k < pts.length; k++) {
          const d = pts[k].distanceTo(impactPos);
          if (d < bestDist) { bestDist = d; best = k; }
        }
        idx = Math.max(0, Math.min(pts.length - 1, best));
      } catch (e) {
        // fallback to provided impactIndex
      }
    }
    // position at impact in AU-scaled coords
    // We'll perform integration in physical units: AU for distance and days for time.
    // The stored points are scaled by AU_SCALE for rendering, so convert to AU first.
    const ptsAU = pts.map(p => p.clone().divideScalar(AU_SCALE));

    // Estimate delta time (days) between successive points along the asteroid orbit
    const a = asteroidElements.a;
    const periodDays = 365.25 * Math.pow(a, 1.5);
    const deltaDays = periodDays / Math.max(1, ptsAU.length - 1);

    const impactPosAU = ptsAU[idx].clone();

    // central difference to estimate velocity (AU/day)
    const beforeAU = ptsAU[Math.max(0, idx - 1)];
    const afterAU = ptsAU[Math.min(ptsAU.length - 1, idx + 1)];
    const velAUperDay = afterAU.clone().sub(beforeAU).multiplyScalar(1 / (2 * deltaDays));

    // momentum transfer: deltaV on asteroid (m/s)
    const spacecraftMass = 1000; // kg (assumed)
  const deltaV_m_s = (spacecraftMass * (scVelocity * 1e3)) / Math.max(1, asteroidMass);
    // convert m/s to AU/day: (m/s) * (secPerDay) * (1/1000 km/m) * (KM_TO_AU AU/km)
    const deltaV_AU_per_day = deltaV_m_s * 86400 / 1000 * KM_TO_AU; // = deltaV_m_s * 86.4 * KM_TO_AU

  const dvAU = velAUperDay.clone().normalize().multiplyScalar(deltaV_AU_per_day);
  // DEBUG: log when recomputing deflected trajectory
  // eslint-disable-next-line no-console
  console.log('[OrbitKineticImpactadorCrash] recompute deflection', { scVelocity, scLaunchTime, impactIndex, impactJD, deltaV_m_s });
    const velAfter = velAUperDay.clone().add(dvAU);

    // Gravitational parameter of Sun in AU^3 / day^2
    const G = 6.67430e-11; // m^3 kg^-1 s^-2
    const M_SUN = 1.98847e30; // kg
    const AU_M = 1.495978707e11; // meters
    const secPerDay = 86400;
    const mu = (G * M_SUN) * (secPerDay * secPerDay) / (AU_M * AU_M * AU_M);

    // Integrate using velocity Verlet from impact index onward
    const newPtsAU: THREE.Vector3[] = ptsAU.slice(0, idx + 1);
    let pos = impactPosAU.clone();
    let vel = velAfter.clone();

    const accel = (p: THREE.Vector3): THREE.Vector3 => {
      const r = p.length();
      if (r === 0) return new THREE.Vector3(0, 0, 0);
      return p.clone().multiplyScalar(-mu / (r * r * r));
    };

    let a0 = accel(pos);
    for (let i = idx + 1; i < ptsAU.length; i++) {
      // position update
      const posNew = pos.clone().add(vel.clone().multiplyScalar(deltaDays)).add(a0.clone().multiplyScalar(0.5 * deltaDays * deltaDays));
      const a1 = accel(posNew);
      // velocity update
      const velNew = vel.clone().add(a0.clone().add(a1).multiplyScalar(0.5 * deltaDays));

      newPtsAU.push(posNew.clone());
      pos = posNew;
      vel = velNew;
      a0 = a1;
    }

    // convert back to render scale (AU_SCALE)
    const finalPts = newPtsAU.map(p => p.clone().multiplyScalar(AU_SCALE));

    // DEBUG: compute maximum displacement from original asteroid points
    try {
      let maxDisp = 0;
      for (let i = 0; i < finalPts.length && i < pts.length; i++) {
        maxDisp = Math.max(maxDisp, finalPts[i].distanceTo(pts[i]));
      }
      // eslint-disable-next-line no-console
      console.log('[OrbitKineticImpactadorCrash] deflection stats', { idx, impactJD, maxDisp });
    } catch (e) {
      // ignore
    }

    return finalPts;
  }, [asteroidPoints, asteroidJds?.length, impactJD, scLaunchTime, scVelocity, asteroidMass, impactIndex, asteroidElements.a, reloadKey]);
  const intersections = useMemo(() => 
    detectIntersections(earthPoints, asteroidPoints), 
    [earthPoints, asteroidPoints]
  );
  const deflectedIntersections = useMemo(() => 
    detectIntersections(earthPoints, deflectedAsteroidPoints), 
    [earthPoints, deflectedAsteroidPoints]
  );

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
        <OrbitLine points={spacecraftPoints} color="#00FF00" opacity={0.9} />
        <OrbitLine points={deflectedAsteroidPoints} color="#FF00FF" opacity={0.7} />
        <IntersectionMarkers intersections={intersections} />
        <IntersectionMarkers intersections={deflectedIntersections} />
        
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />
        <gridHelper args={[40, 40, '#8AB7E2', '#3B6C9D']} position={[0, -0.01, 0]} />
      </Canvas>
    </div>
  );
};

export default OrbitKineticImpactadorCrash;