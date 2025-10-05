import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapaProps {
  coordenada?: [number, number];
}

const Mapa = ({ coordenada = [-68.1193, -16.5000] }: MapaProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const marker = useRef<maplibregl.Marker | null>(null);
  const [currentCoord, setCurrentCoord] = useState<[number, number]>(coordenada);

  // Generar forma irregular usando ruido pseudoaleatorio
  const generarFormaIrregular = (centerLng: number, centerLat: number) => {
    const baseRadius = 200000; // Radio base en metros (200km - zona grande)
    const points = 40; // Número de puntos para suavidad
    const coordinates: number[][] = [];
    
    // Generar puntos con variación irregular moderada
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      
      // Crear irregularidad más suave
      const noise1 = Math.sin(angle * 2) * 0.15;
      const noise2 = Math.cos(angle * 3) * 0.12;
      const randomNoise = (Math.sin(angle * 7 + centerLng) + 1) / 2 * 0.08;
      
      // Combinar ruidos para forma irregular moderada
      const radiusVariation = 1 + noise1 + noise2 + randomNoise;
      const actualRadius = baseRadius * radiusVariation;
      
      // Convertir de metros a grados (aproximado)
      const latOffset = (actualRadius * Math.sin(angle)) / 111320; // 1 grado lat ≈ 111320 metros
      const lngOffset = (actualRadius * Math.cos(angle)) / (111320 * Math.cos(centerLat * Math.PI / 180));
      
      coordinates.push([centerLng + lngOffset, centerLat + latOffset]);
    }
    
    return coordinates;
  };

  // Función para actualizar la zona de peligro
  const actualizarZonaPeligro = (lng: number, lat: number) => {
    if (!map.current) return;

    const outerCoordinates = generarFormaIrregular(lng, lat);
    
    // Crear zona interna más intensa (60% del tamaño)
    const innerCoordinates = outerCoordinates.map(coord => {
      const dlng = (coord[0] - lng) * 0.6;
      const dlat = (coord[1] - lat) * 0.6;
      return [lng + dlng, lat + dlat];
    });

    // Actualizar la fuente de datos
    const source = map.current.getSource('danger-zone') as maplibregl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [outerCoordinates]
            },
            properties: { intensity: 'low' }
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [innerCoordinates]
            },
            properties: { intensity: 'medium' }
          }
        ]
      });
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Inicializar mapa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: {
              'background-color': '#5595D2'
            }
          },
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      } as any,
      center: coordenada,
      zoom: 6
    });

    // Agregar controles de navegación
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    // Cuando el mapa cargue, agregar la zona de peligro
    map.current.on('load', () => {
      if (!map.current) return;

      const [lng, lat] = coordenada;
      const outerCoordinates = generarFormaIrregular(lng, lat);
      
      // Crear zona interna más intensa (60% del tamaño)
      const innerCoordinates = outerCoordinates.map(coord => {
        const dlng = (coord[0] - lng) * 0.6;
        const dlat = (coord[1] - lat) * 0.6;
        return [lng + dlng, lat + dlat];
      });

      // Agregar fuente de datos con polígonos
      map.current.addSource('danger-zone', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [outerCoordinates]
              },
              properties: { intensity: 'low' }
            },
            {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [innerCoordinates]
              },
              properties: { intensity: 'medium' }
            }
          ]
        }
      });

      // Capa externa (menor intensidad)
      map.current.addLayer({
        id: 'danger-zone-outer',
        type: 'fill',
        source: 'danger-zone',
        filter: ['==', ['get', 'intensity'], 'low'],
        paint: {
          'fill-color': '#ff6b00',
          'fill-opacity': 0.25
        }
      });

      // Capa interna (mayor intensidad)
      map.current.addLayer({
        id: 'danger-zone-inner',
        type: 'fill',
        source: 'danger-zone',
        filter: ['==', ['get', 'intensity'], 'medium'],
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.45
        }
      });

      // Borde de la zona
      map.current.addLayer({
        id: 'danger-zone-outline',
        type: 'line',
        source: 'danger-zone',
        filter: ['==', ['get', 'intensity'], 'low'],
        paint: {
          'line-color': '#cc0000',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Agregar marcador en el centro (draggable)
      marker.current = new maplibregl.Marker({ 
        color: '#cc0000',
        draggable: true 
      })
        .setLngLat(currentCoord)
        .addTo(map.current);

      // Evento cuando se arrastra el marcador
      marker.current.on('dragend', () => {
        if (!marker.current) return;
        const lngLat = marker.current.getLngLat();
        const newCoord: [number, number] = [lngLat.lng, lngLat.lat];
        setCurrentCoord(newCoord);
        actualizarZonaPeligro(lngLat.lng, lngLat.lat);
      });

      // Agregar popup informativo
      const popup = new maplibregl.Popup({ offset: 25 })
        .setHTML(`
          <div style="padding: 8px;">
            <strong style="color: #cc0000;">⚠️ Zona de Peligro</strong>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Coordenadas: ${currentCoord[1].toFixed(4)}, ${currentCoord[0].toFixed(4)}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">
              💡 Arrastra el marcador para mover la zona
            </p>
          </div>
        `);
      
      // Actualizar popup cuando cambia la coordenada
      const updatePopup = () => {
        popup.setHTML(`
          <div style="padding: 8px;">
            <strong style="color: #cc0000;">⚠️ Zona de Peligro</strong>
            <p style="margin: 5px 0 0 0; font-size: 12px;">
              Coordenadas: ${currentCoord[1].toFixed(4)}, ${currentCoord[0].toFixed(4)}
            </p>
            <p style="margin: 5px 0 0 0; font-size: 11px; color: #666;">
              💡 Arrastra el marcador para mover la zona
            </p>
          </div>
        `);
      };
      
      map.current.on('click', 'danger-zone-outer', (e) => {
        updatePopup();
        popup.setLngLat(e.lngLat).addTo(map.current!);
      });

      map.current.on('click', 'danger-zone-inner', (e) => {
        updatePopup();
        popup.setLngLat(e.lngLat).addTo(map.current!);
      });

      // Cambiar cursor al pasar sobre la zona
      map.current.on('mouseenter', 'danger-zone-outer', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'danger-zone-outer', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
    });

    // Cleanup
    return () => {
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
  <div style={{ 
    width: '100%', 
    height: '100%', 
    position: 'relative',
    minHeight: '200px' // Altura mínima
  }}>
    <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
    <div style={{
      position: 'absolute',
      top: '5px',
      left: '5px',
      background: 'white',
      padding: '8px',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      fontSize: '12px',
      maxWidth: '150px', // Limita el ancho del overlay
      zIndex: 1
    }}>
      <strong>🗺️ Zona de Peligro</strong>
      <div style={{ 
        marginTop: '6px', 
        fontSize: '10px', 
        color: '#666', 
        borderTop: '1px solid #eee', 
        paddingTop: '6px' 
      }}>
        <strong>📍 Coordenadas:</strong>
        <div style={{ 
          fontFamily: 'monospace', 
          marginTop: '2px',
          fontSize: '9px'
        }}>
          Lat: {currentCoord[1].toFixed(4)}°<br/>
          Lng: {currentCoord[0].toFixed(4)}°
        </div>
      </div>
      <div style={{ marginTop: '6px', fontSize: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: 'rgba(255,0,0,0.45)', 
            marginRight: '4px', 
            border: '1px solid #cc0000' 
          }}></div>
          Alta intensidad
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '2px' }}>
          <div style={{ 
            width: '12px', 
            height: '12px', 
            background: 'rgba(255,107,0,0.25)', 
            marginRight: '4px', 
            border: '1px solid #cc0000' 
          }}></div>
          Baja intensidad
        </div>
      </div>
    </div>
  </div>
);
};

export default Mapa;