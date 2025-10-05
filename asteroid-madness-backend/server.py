from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import numpy as np
from scipy.integrate import odeint
from datetime import datetime, timedelta
import subprocess
import json
import os
import psycopg2
import math

app = Flask(__name__)

# 🔧 Configuración CORS permisiva (para pruebas/desarrollo)
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# NASA API Key
API_KEY = 'eH13yd2sijPWcdfRxxcZTNY1ureIwsOoY2pyGCOa'

# Path to C++ executable
CPP_EXECUTABLE = os.path.join(os.getcwd(), 'NASAHackathon.exe')

# Constants for astronomical units
G_AU = 4 * np.pi**2  # Gravitational constant in AU^3 / (solar_mass * year^2)
AU_UNIT = 1.0  # 1 AU in AU
R_TIERRA = 6371 / 149597870.7  # Earth's radius in AU
T_ANO = 365.25  # Days per year
FPS = 60  # Frames per second for simulation speed

# Earth's orbit parameters
EARTH_A = 1.0
EARTH_E = 0.0167
EARTH_I = 0.0
EARTH_OMEGA = 0.0
EARTH_OMEGA_NODE = 0.0
EARTH_M = 0.0

# Constants for SI units
G_SI = 6.67430e-11  # m³/kg/s²
AU_KM = 1.496e+8  # km

# 🔗 Configuración de conexión a PostgreSQL (Neon)
db_config = {
    "host": "ep-misty-sea-ac3xfq7j-pooler.sa-east-1.aws.neon.tech",
    "user": "neondb_owner",
    "password": "npg_SpnmefC9Zx0D",
    "dbname": "neondb",
    "port": 5432,
    "sslmode": "require"
}

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

def ejecutar_cpp(args):
    """Execute C++ executable and return JSON output."""
    try:
        # Construct command
        cmd = [CPP_EXECUTABLE] + args

        # Execute command
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding='utf-8',
            timeout=60
        )

        if result.returncode != 0:
            return {
                'error': 'C++ executable returned error',
                'stderr': result.stderr,
                'stdout': result.stdout
            }, 500

        # Parse JSON output
        try:
            return json.loads(result.stdout), 200
        except json.JSONDecodeError as e:
            return {
                'error': 'Failed to parse C++ output as JSON',
                'output': result.stdout,
                'parse_error': str(e)
            }, 500

    except subprocess.TimeoutExpired:
        return {'error': 'C++ executable timed out'}, 504
    except FileNotFoundError:
        return {
            'error': f'C++ executable not found at {CPP_EXECUTABLE}',
            'hint': 'Check CPP_EXECUTABLE path in code'
        }, 500
    except Exception as e:
        return {'error': f'Failed to execute C++: {str(e)}'}, 500


@app.route('/impacto', methods=['GET'])
def impacto_asteroide():
    asteroide_id = request.args.get('id')
    if not asteroide_id:
        return jsonify({'error': 'Parameter "id" is required'}), 400

    args = ['--asteroide-id', asteroide_id, '--calculos-extendidos']

    result, status = ejecutar_cpp(args)
    if status != 200:
        return jsonify(result), status

    impacto = result.get('calculo_orbital', {})
    consecuencias = result.get('consecuencias_impacto', {})
    zona = impacto.get('zona_aproximacion', {})

    return jsonify({
        'impacto_detectado': impacto.get('hay_impacto', False),
        'distancia_minima_km': impacto.get('distancia_minima_km'),
        'fecha_aproximacion': impacto.get('fecha_aproximacion'),
        'zona_aproximacion': zona,
        'energia_megatones': consecuencias.get('energia_cinetica_megatones'),
        'crater': consecuencias.get('crater'),
        'magnitud_sismica': consecuencias.get('magnitud_sismica_richter')
    }), 200


@app.route('/asteroide-cpp', methods=['GET'])
def asteroide_cpp():
    """Simulate asteroid using C++ executable with asteroid ID."""
    asteroide_id = request.args.get('id')
    if not asteroide_id:
        return jsonify({'error': 'Parameter "id" is required'}), 400

    args = ['--asteroide-id', asteroide_id]

    # Optional parameters
    if request.args.get('diametro'):
        args.extend(['--diametro', request.args.get('diametro')])
    if request.args.get('densidad'):
        args.extend(['--densidad', request.args.get('densidad')])
    if request.args.get('generar_resumen') == 'true':
        args.append('--generar-resumen')
    if request.args.get('calculos_extendidos') == 'true':
        args.append('--calculos-extendidos')

    result, status = ejecutar_cpp(args)
    return jsonify(result), status


@app.route('/simular-cpp', methods=['POST'])
def simular_cpp():
    """Simulate asteroid orbit using C++ executable with orbital parameters."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    # Validate required orbital parameters
    required_params = ['a', 'e', 'i', 'omega', 'Omega', 'M']
    if not all(param in data for param in required_params):
        return jsonify({'error': 'Missing required orbital elements: a, e, i, omega, Omega, M'}), 400

    # Build arguments for C++ executable
    args = [
        '--semieje-mayor', str(data['a']),
        '--excentricidad', str(data['e']),
        '--inclinacion', str(data['i']),
        '--nodo-ascendente', str(data['Omega']),
        '--arg-perihelio', str(data['omega']),
        '--anomalia-media', str(data['M'])
    ]

    # Optional parameters
    if 'diametro' in data:
        args.extend(['--diametro', str(data['diametro'])])
    if 'densidad' in data:
        args.extend(['--densidad', str(data['densidad'])])
    if data.get('generar_resumen'):
        args.append('--generar-resumen')
    if data.get('calculos_extendidos'):
        args.append('--calculos-extendidos')

    result, status = ejecutar_cpp(args)
    return jsonify(result), status


@app.route('/gemini', methods=['POST'])
def gemini_query():
    """Query Gemini AI using C++ executable."""
    data = request.get_json()
    if not data or 'consulta' not in data:
        return jsonify({'error': 'Request body must contain "consulta" field'}), 400

    args = ['--consulta-gemini', data['consulta']]

    result, status = ejecutar_cpp(args)
    return jsonify(result), status


@app.route('/cpp-config', methods=['GET'])
def cpp_config():
    """Get C++ executable configuration and check if it exists."""
    exists = os.path.isfile(CPP_EXECUTABLE)
    return jsonify({
        'executable_path': CPP_EXECUTABLE,
        'exists': exists,
        'absolute_path': os.path.abspath(CPP_EXECUTABLE)
    })


@app.route('/cpp-config', methods=['PUT'])
def update_cpp_config():
    """Update C++ executable path."""
    global CPP_EXECUTABLE
    data = request.get_json()
    if not data or 'path' not in data:
        return jsonify({'error': 'Request body must contain "path" field'}), 400

    new_path = data['path']
    if not os.path.isfile(new_path):
        return jsonify({
            'error': 'File not found',
            'path': new_path
        }), 404

    CPP_EXECUTABLE = new_path
    return jsonify({
        'message': 'C++ executable path updated',
        'new_path': CPP_EXECUTABLE
    })


# ==================== ORIGINAL PYTHON ENDPOINTS ====================

def tierra_pos(t):
    """Calculate Earth's position at time t (in years)."""
    w = 2 * np.pi / T_ANO
    r = EARTH_A * (1 - EARTH_E * np.cos(w * t))
    return np.array([r * np.cos(w * t), r * np.sin(w * t), 0])


def elementos_a_estado(a, e, i, omega, Omega, M, mu=G_AU):
    """Convert orbital elements to position and velocity vectors."""
    if e >= 1 or a <= 0:
        raise ValueError(
            "Eccentricity must be < 1 and semi-major axis must be positive")
    E = M
    for _ in range(10):
        E = M + e * np.sin(E)
    nu = 2 * np.arctan2(np.sqrt(1 + e) * np.sin(E/2),
                        np.sqrt(1 - e) * np.cos(E/2))
    r = a * (1 - e * np.cos(E))
    pos_plano = np.array([r * np.cos(nu), r * np.sin(nu), 0])
    h = np.sqrt(mu * a * (1 - e**2))
    vel_plano = np.array([-np.sqrt(mu/(a*(1-e**2))) * np.sin(nu),
                         np.sqrt(mu/(a*(1-e**2))) * (e + np.cos(nu)), 0])
    R1 = np.array([[np.cos(omega), -np.sin(omega), 0],
                   [np.sin(omega), np.cos(omega), 0], [0, 0, 1]])
    R2 = np.array([[1, 0, 0], [0, np.cos(i), -np.sin(i)],
                   [0, np.sin(i), np.cos(i)]])
    R3 = np.array([[np.cos(Omega), -np.sin(Omega), 0],
                   [np.sin(Omega), np.cos(Omega), 0], [0, 0, 1]])
    R = R3 @ R2 @ R1
    pos = R @ pos_plano
    vel = R @ vel_plano * (T_ANO / (2 * np.pi))
    return pos.tolist(), vel.tolist()


def ecuaciones_movimiento(y, t, tierra_pos_func, mu=G_AU):
    """Equations of motion for the asteroid."""
    r_ast = y[:3]
    v_ast = y[3:]
    r = np.linalg.norm(r_ast)
    accel_sol = -mu * r_ast / (r**3 + 1e-10)
    r_tierra = tierra_pos_func(t)
    r_rel = r_ast - r_tierra
    r_tierra_norm = np.linalg.norm(r_rel) + 1e-10
    accel_tierra = -mu * 3e-6 * r_rel / (r_tierra_norm**3)
    return np.concatenate([v_ast, accel_sol + accel_tierra])


def simular_orbita(pos0, vel0, t_max=T_ANO*4, steps=2000):
    """Simulate asteroid orbit and calculate closest approach to Earth."""
    t = np.linspace(0, t_max, steps)
    y0 = np.concatenate([np.array(pos0), np.array(vel0)])
    sol = odeint(ecuaciones_movimiento, y0, t,
                 args=(tierra_pos,), mxstep=5000).T
    posiciones_ast = sol[:3].T.tolist()
    posiciones_tierra = [tierra_pos(ti).tolist() for ti in t]

    # Calculate closest approach
    min_dist = float('inf')
    min_time = 0
    collision = False
    for i, pos in enumerate(posiciones_ast):
        r_tierra = tierra_pos(t[i])
        dist = np.linalg.norm(np.array(pos) - r_tierra)
        if dist < min_dist:
            min_dist = dist
            min_time = t[i]
        if dist < R_TIERRA:
            collision = True
            min_time = t[i]
            break

    return {
        'asteroid_positions': posiciones_ast,  # [x, y, z] in AU
        'earth_positions': posiciones_tierra,  # [x, y, z] in AU
        'time': t.tolist(),  # Time in years
        'closest_approach': {
            'distance_au': min_dist,
            'distance_km': min_dist * 149597870.7,
            'time_years': min_time,
            'time_days': min_time * T_ANO,
            'collision': collision
        }
    }


def obtener_asteroides(start_date, end_date):
    """Fetch asteroid data from NASA's API."""
    url = f'https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={API_KEY}'
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        asteroides = []
        for date in data['near_earth_objects']:
            for neo in data['near_earth_objects'][date]:
                neo_id = neo.get('id')
                if not neo_id:
                    continue
                detalle_url = f'https://api.nasa.gov/neo/rest/v1/neo/{neo_id}?api_key={API_KEY}'
                detalle_resp = requests.get(detalle_url)
                if detalle_resp.status_code != 200:
                    continue
                detalle_data = detalle_resp.json()
                orb = detalle_data.get('orbital_data', {})
                required_keys = ['semi_major_axis', 'eccentricity', 'inclination',
                                 'perihelion_argument', 'ascending_node_longitude', 'mean_anomaly']
                if all(k in orb for k in required_keys):
                    try:
                        ast = {
                            'name': neo['name'],
                            'id': neo_id,
                            # Semi-major axis in AU
                            'a': float(orb['semi_major_axis']),
                            'e': float(orb['eccentricity']),     # Eccentricity
                            # Inclination in radians
                            'i': float(orb['inclination']) * np.pi / 180,
                            # Argument of perihelion
                            'omega': float(orb['perihelion_argument']) * np.pi / 180,
                            # Longitude of ascending node
                            'Omega': float(orb['ascending_node_longitude']) * np.pi / 180,
                            # Mean anomaly
                            'M': float(orb['mean_anomaly']) * np.pi / 180
                        }
                        if 0 <= ast['e'] < 1 and ast['a'] > 0:
                            asteroides.append(ast)
                        if len(asteroides) >= 10:
                            break
                    except (ValueError, KeyError):
                        continue
            if len(asteroides) >= 10:
                break
        return asteroides
    except Exception as e:
        return {'error': str(e), 'status_code': response.status_code if 'response' in locals() else None}


@app.route('/asteroides', methods=['GET'])
def get_asteroides():
    """Fetch asteroids for a given date range."""
    start_date = request.args.get(
        'start_date', (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'))
    end_date = request.args.get('end_date', start_date)
    try:
        datetime.strptime(start_date, '%Y-%m-%d')
        datetime.strptime(end_date, '%Y-%m-%d')
        if (datetime.strptime(end_date, '%Y-%m-%d') - datetime.strptime(start_date, '%Y-%m-%d')).days > 7:
            return jsonify({'error': 'Date range cannot exceed 7 days'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid date format (use YYYY-MM-DD)'}), 400

    asteroides = obtener_asteroides(start_date, end_date)
    if 'error' in asteroides:
        return jsonify({'error': asteroides['error'], 'status_code': asteroides.get('status_code', 500)}), 500

    return jsonify({
        'asteroids': asteroides,
        'count': len(asteroides),
        'start_date': start_date,
        'end_date': end_date
    })


@app.route('/simular', methods=['POST'])
def simular():
    """Simulate asteroid orbit based on orbital elements."""
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request body required'}), 400

    try:
        # Validate input parameters
        required_params = ['a', 'e', 'i', 'omega', 'Omega', 'M']
        if not all(param in data for param in required_params):
            return jsonify({'error': 'Missing required orbital elements'}), 400

        a = float(data['a'])
        e = float(data['e'])
        if not (0 <= e < 1):
            return jsonify({'error': 'Eccentricity must be between 0 and 1'}), 400
        if a <= 0:
            return jsonify({'error': 'Semi-major axis must be positive'}), 400
        i = float(data['i']) * np.pi / 180  # Convert degrees to radians
        omega = float(data['omega']) * np.pi / 180
        Omega = float(data['Omega']) * np.pi / 180
        M = float(data['M']) * np.pi / 180

        pos0, vel0 = elementos_a_estado(a, e, i, omega, Omega, M)
        result = simular_orbita(np.array(pos0), np.array(vel0))

        return jsonify({
            'status': 'success',
            'simulation': result,
            'parameters': {
                'a': a,
                'e': e,
                'i': data['i'],  # Return in degrees
                'omega': data['omega'],
                'Omega': data['Omega'],
                'M': data['M']
            }
        })
    except (KeyError, ValueError) as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400


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
            dist_km = dist_AU * AU_KM
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
                "distance_km": round(min_distance * AU_KM, 2)
            })
        else:
            return jsonify({"impact": False, "closest_approach_km": round(min_distance * AU_KM, 2)})
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
        masa = GM / G_SI if GM else None
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
    cpp_exists = os.path.isfile(CPP_EXECUTABLE)
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'cpp_executable': {
            'path': CPP_EXECUTABLE,
            'exists': cpp_exists
        }
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)