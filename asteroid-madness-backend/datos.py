import psycopg2
import csv
import io

# -----------------------------
# Configuración de la conexión
# -----------------------------
conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_SpnmefC9Zx0D@ep-misty-sea-ac3xfq7j-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
)
cursor = conn.cursor()

# -----------------------------
# Crear tabla (si no existe)
# -----------------------------
create_table_query = """
CREATE TABLE IF NOT EXISTS asteroids (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100),
    diameter DOUBLE PRECISION,
    GM DOUBLE PRECISION,
    e DOUBLE PRECISION,
    a DOUBLE PRECISION,
    i DOUBLE PRECISION,
    om DOUBLE PRECISION,
    w DOUBLE PRECISION,
    ma DOUBLE PRECISION
);
"""
cursor.execute(create_table_query)
conn.commit()
print("Tabla 'asteroids' creada o ya existía.")

# -----------------------------
# Función para limpiar valores vacíos
# -----------------------------
def clean_csv_value(value):
    """Convierte cadenas vacías a None (NULL en SQL)"""
    return None if value.strip() == '' else value

# -----------------------------
# Leer y procesar CSV
# -----------------------------
csv_file_path = "asteroids_with_id.csv"  # Cambia esto a la ruta real

try:
    # Leer el CSV original y procesarlo
    cleaned_rows = []
    
    with open(csv_file_path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)  # Leer encabezado
        
        for row in reader:
            # Limpiar cada valor de la fila
            cleaned_row = [clean_csv_value(val) for val in row]
            cleaned_rows.append(cleaned_row)
    
    # Crear un buffer en memoria con los datos limpios
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(header)  # Escribir encabezado
    writer.writerows(cleaned_rows)  # Escribir filas limpias
    
    # Volver al inicio del buffer
    output.seek(0)
    
    # Importar usando COPY con NULL como valor por defecto
    cursor.copy_expert("""
        COPY asteroids(id, full_name, diameter, GM, e, a, i, om, w, ma)
        FROM STDIN WITH (FORMAT CSV, HEADER true, NULL '')
    """, output)
    
    conn.commit()
    print(f"Datos importados correctamente: {len(cleaned_rows)} filas.")
    
except FileNotFoundError:
    print(f"Error: No se encontró el archivo {csv_file_path}")
    print("Asegúrate de cambiar la ruta al archivo correcto.")
except Exception as e:
    conn.rollback()
    print("Error al importar CSV:", e)
    import traceback
    traceback.print_exc()

# -----------------------------
# Verificar importación
# -----------------------------
try:
    cursor.execute("SELECT COUNT(*) FROM asteroids;")
    count = cursor.fetchone()[0]
    print(f"Total de registros en la tabla: {count}")
    
    cursor.execute("SELECT * FROM asteroids LIMIT 3;")
    sample = cursor.fetchall()
    print("\nPrimeros 3 registros:")
    for row in sample:
        print(row)
except Exception as e:
    print("Error al verificar datos:", e)

# -----------------------------
# Cerrar conexión
# -----------------------------
cursor.close()
conn.close()