from flask import Flask, request, jsonify
import requests
import numpy as np
from scipy.integrate import odeint
from datetime import datetime, timedelta

app = Flask(__name__)

# NASA API Key
API_KEY = 'eH13yd2sijPWcdfRxxcZTNY1ureIwsOoY2pyGCOa'

# Constants
G = 4 * np.pi**2  # Gravitational constant in AU^3 / (solar_mass * year^2)
AU = 1.0  # 1 AU in AU
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


def tierra_pos(t):
    """Calculate Earth's position at time t (in years)."""
    w = 2 * np.pi / T_ANO
    r = EARTH_A * (1 - EARTH_E * np.cos(w * t))
    return np.array([r * np.cos(w * t), r * np.sin(w * t), 0])


def elementos_a_estado(a, e, i, omega, Omega, M, mu=G):
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


def ecuaciones_movimiento(y, t, tierra_pos_func, mu=G):
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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'timestamp': datetime.now().isoformat()})


if __name__ == '__main__':
    app.run(debug=True, port=5000)
