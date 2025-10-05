from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import math
from datetime import datetime, timedelta

app = Flask(__name__)

# 🔧 Configuración CORS permisiva (para pruebas/desarrollo)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# 🔗 Configuración de conexión a PostgreSQL (Neon)
db_config = {
    "host": "ep-misty-sea-ac3xfq7j-pooler.sa-east-1.aws.neon.tech",
    "user": "neondb_owner",
    "password": "npg_SpnmefC9Zx0D",
    "dbname": "neondb",
    "port": 5432,
    "sslmode": "require"
}

# 🔢 Constantes
G = 6.67430e-11  # m³/kg/s²
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
    return deg * math.pi / 180

def orbital_position(a, e, i, Ω, ω, M):
    i, Ω, ω, M = map(to_radians, [i, Ω, ω, M])
    E = M
    for _ in range(10):
        E -= (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
    x_orb = a * (math.cos(E) - e)
    y_orb = a * math.sqrt(1 - e**2) * math.sin(E)
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

@app.route('/impact', methods=['POST', 'OPTIONS'])
def predict_impact():
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.get_json()
    try:
        a = float(data.get('a'))
        e = float(data.get('e'))
        i = float(data.get('i'))
        Ω = float(data.get('om'))
        ω = float(data.get('w'))
        M0 = float(data.get('ma'))
        start_date = datetime.now()
        step_days = 10
        min_distance = float('inf')
        impact_date = None
        impact_coords = (None, None)
        for day in range(0, 365*100, step_days):
            years_elapsed = day / 365.25
            earth_angle = to_radians((EARTH_ELEMENTS['L0'] + EARTH_ELEMENTS['LDot'] * years_elapsed) % 360)
            x_earth = EARTH_ELEMENTS['a0'] * math.cos(earth_angle)
            y_earth = EARTH_ELEMENTS['a0'] * math.sin(earth_angle)
            z_earth = 0
            period_years = a ** 1.5
            mean_motion_per_day = 360.0 / (period_years * 365.25)
            M = (M0 + day * mean_motion_per_day) % 360
            x_ast, y_ast, z_ast = orbital_position(a, e, i, Ω, ω, M)
            dist_AU = math.sqrt((x_ast - x_earth)**2 + (y_ast - y_earth)**2 + (z_ast - z_earth)**2)
            dist_km = dist_AU * AU
            if dist_AU < min_distance:
                min_distance = dist_AU
                if dist_km < 150_000:
                    impact_date = start_date + timedelta(days=day)
                    lon = (math.degrees(math.atan2(y_ast, x_ast)) + 180) % 360 - 180
                    lat = math.degrees(math.atan2(z_ast, math.sqrt(x_ast**2 + y_ast**2)))
                    impact_coords = (lat, lon)
                    break
        if impact_date:
            return jsonify({
                "impact": True,
                "date": {"day": impact_date.day, "month": impact_date.month, "year": impact_date.year},
                "latitude": round(impact_coords[0], 3),
                "longitude": round(impact_coords[1], 3),
                "distance_km": round(min_distance * AU, 2)
            })
        else:
            return jsonify({"impact": False, "closest_approach_km": round(min_distance * AU, 2)})
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "details": traceback.format_exc()}), 500

@app.route('/asteroid', methods=['POST', 'OPTIONS'])
def get_asteroid():
    if request.method == 'OPTIONS':
        return '', 204
    
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "Debe enviar un campo 'name' en el body JSON"}), 400
    name_query = data['name'].strip().lower()
    try:
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT full_name, diameter, GM, e, a, i, om AS node, w AS peri, ma AS M
            FROM asteroids
            WHERE LOWER(full_name) LIKE %s
            LIMIT 1;
        """, (f"%{name_query}%",))
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        if not row:
            return jsonify({"error": "Asteroide no encontrado"}), 404
        full_name, diameter, GM, e, a, i, node, peri, M = row
        masa = GM / G if GM else None
        radio = diameter / 2 if diameter else None
        densidad = (masa / ((4/3)*math.pi*(radio*1000)**3)) if masa and radio else None
        result = {
            "full_name": full_name,
            "a": a, "e": e, "i": i,
            "Ω (node)": node, "ω (peri)": peri, "M₀": M,
            "masa (kg)": masa,
            "radio (km)": radio,
            "densidad (kg/m³)": densidad
        }
        return jsonify(result)
    except Exception as e:
        import traceback
        return jsonify({"error": str(e), "details": traceback.format_exc()}), 500

# Ruta de health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200

if __name__ == '__main__':
    app.run(debug=True)