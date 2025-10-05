from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import math
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# 🔗 Configuración de conexión a MySQL
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "asteroid_db"
}

# 🔢 Constantes
G = 6.67430e-11  # Constante gravitacional (en m³/kg/s²)
AU = 1.496e+8  # km

# Elementos orbitales de la Tierra
EARTH_ELEMENTS = {
    "a0": 1.00000261,
    "aDot": 0.00000562,
    "e0": 0.01671123,
    "eDot": -0.00004392,
    "I0": -0.00001531,
    "IDot": -0.01294668,
    "L0": 100.46457166,
    "LDot": 35999.37244981,
    "w0": 102.93768193,
    "wDot": 0.32327364,
    "O0": 0.0,
    "ODot": 0.0
}

def to_radians(deg):
    """Convierte grados a radianes"""
    return deg * math.pi / 180

def orbital_position(a, e, i, Ω, ω, M):
    """
    Calcula la posición heliocéntrica (x,y,z) en UA a partir de los elementos orbitales.
    
    Parámetros:
    - a: semieje mayor (UA)
    - e: excentricidad
    - i: inclinación (grados)
    - Ω: longitud del nodo ascendente (grados)
    - ω: argumento del perihelio (grados)
    - M: anomalía media (grados)
    """
    i, Ω, ω, M = map(to_radians, [i, Ω, ω, M])
    
    # Aproximar la anomalía excéntrica E con Newton-Raphson
    E = M
    for _ in range(10):
        E -= (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
    
    # Coordenadas en el plano orbital
    x_orb = a * (math.cos(E) - e)
    y_orb = a * math.sqrt(1 - e**2) * math.sin(E)
    
    # Rotar a coordenadas eclípticas
    cos_Ω = math.cos(Ω)
    sin_Ω = math.sin(Ω)
    cos_ω = math.cos(ω)
    sin_ω = math.sin(ω)
    cos_i = math.cos(i)
    sin_i = math.sin(i)
    
    x = (cos_Ω * cos_ω - sin_Ω * sin_ω * cos_i) * x_orb + \
        (-cos_Ω * sin_ω - sin_Ω * cos_ω * cos_i) * y_orb
    y = (sin_Ω * cos_ω + cos_Ω * sin_ω * cos_i) * x_orb + \
        (-sin_Ω * sin_ω + cos_Ω * cos_ω * cos_i) * y_orb
    z = (sin_ω * sin_i) * x_orb + (cos_ω * sin_i) * y_orb
    
    return x, y, z

@app.route('/impact', methods=['POST'])
def predict_impact():
    """Predice si un asteroide impactará la Tierra en los próximos 100 años"""
    data = request.get_json()
    
    try:
        # Parámetros orbitales del asteroide
        a = float(data.get('a'))  # UA
        e = float(data.get('e'))
        i = float(data.get('i'))  # grados
        Ω = float(data.get('om'))  # grados
        ω = float(data.get('w'))  # grados
        M0 = float(data.get('ma'))  # grados
        
        # Simulación de movimiento
        start_date = datetime.now()
        step_days = 10  # Paso de simulación
        min_distance = float('inf')
        impact_date = None
        impact_coords = (None, None)
        
        for day in range(0, 365 * 100, step_days):  # 100 años
            # Posición de la Tierra (simplificada como órbita circular)
            years_elapsed = day / 365.25
            earth_angle = to_radians((EARTH_ELEMENTS['L0'] + EARTH_ELEMENTS['LDot'] * years_elapsed) % 360)
            x_earth = EARTH_ELEMENTS['a0'] * math.cos(earth_angle)
            y_earth = EARTH_ELEMENTS['a0'] * math.sin(earth_angle)
            z_earth = 0
            
            # Posición del asteroide
            # Movimiento medio aproximado: n = 360 / P, donde P ≈ a^1.5 (3ra ley de Kepler)
            period_years = a ** 1.5
            mean_motion_per_day = 360.0 / (period_years * 365.25)
            M = (M0 + day * mean_motion_per_day) % 360
            
            x_ast, y_ast, z_ast = orbital_position(a, e, i, Ω, ω, M)
            
            # Distancia entre ambos en UA
            dist_AU = math.sqrt((x_ast - x_earth)**2 + (y_ast - y_earth)**2 + (z_ast - z_earth)**2)
            dist_km = dist_AU * AU
            
            if dist_AU < min_distance:
                min_distance = dist_AU
                
                # Umbral de colisión: ~150,000 km
                if dist_km < 150_000:
                    impact_date = start_date + timedelta(days=day)
                    
                    # Convertir a coordenadas terrestres (simplificadas)
                    lon = (math.degrees(math.atan2(y_ast, x_ast)) + 180) % 360 - 180
                    lat = math.degrees(math.atan2(z_ast, math.sqrt(x_ast**2 + y_ast**2)))
                    impact_coords = (lat, lon)
                    break
        
        if impact_date:
            return jsonify({
                "impact": True,
                "date": {
                    "day": impact_date.day,
                    "month": impact_date.month,
                    "year": impact_date.year
                },
                "latitude": round(impact_coords[0], 3),
                "longitude": round(impact_coords[1], 3),
                "distance_km": round(min_distance * AU, 2)
            })
        else:
            return jsonify({
                "impact": False,
                "closest_approach_km": round(min_distance * AU, 2)
            })
    
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print("Error completo:", error_details)
        return jsonify({"error": str(e), "details": error_details}), 500

@app.route('/asteroid', methods=['POST'])
def get_asteroid():
    """Busca un asteroide en la base de datos por nombre"""
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Debe enviar un campo 'name' en el body JSON"}), 400
    
    name_query = data['name'].strip().lower()
    
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        query = """
        SELECT full_name, diameter, GM, e, a, i, om AS node, w AS peri, ma AS M
        FROM asteroids
        WHERE LOWER(full_name) LIKE %s
        LIMIT 1;
        """
        cursor.execute(query, (f"%{name_query}%",))
        asteroid = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not asteroid:
            return jsonify({"error": "Asteroide no encontrado"}), 404
        
        # ---- Calcular los parámetros faltantes ----
        GM = asteroid['GM']
        masa = GM / G if GM and GM > 0 else None
        
        diameter = asteroid['diameter']
        radio = diameter / 2 if diameter and diameter > 0 else None
        
        densidad = None
        if masa and radio:
            radio_m = radio * 1000
            volumen = (4/3) * math.pi * (radio_m ** 3)
            densidad = masa / volumen
        
        result = {
            "full_name": asteroid['full_name'],
            "a": asteroid['a'],
            "e": asteroid['e'],
            "i": asteroid['i'],
            "Ω (node)": asteroid['node'],
            "ω (peri)": asteroid['peri'],
            "M₀": asteroid['M'],
            "masa (kg)": masa,
            "radio (km)": radio,
            "densidad (kg/m³)": densidad
        }
        
        return jsonify(result)
    
    except mysql.connector.Error as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    app.run(debug=True)