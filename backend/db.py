from pyhive import hive
import json
from difflib import get_close_matches
from config import HDFS_HOST, HIVE_PORT, HIVE_USER  # Asegúrate de definir HIVE_HOST y HIVE_PORT en config.py

def get_connection():
    return hive.Connection(
        host=HDFS_HOST,
        port=HIVE_PORT,
        username=HIVE_USER,
        database="default",
        auth="NOSASL"
    )

def get_objeto_videos(objeto):
    conn = get_connection()
    cursor = conn.cursor()
    query = f"SELECT videos FROM indice_invertido WHERE objeto = '{objeto}'"
    cursor.execute(query)
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return json.loads(row[0]) if row else None

def get_all_objetos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT objeto FROM indice_invertido")
    objetos = [row[0] for row in cursor.fetchall()]
    cursor.close()
    conn.close()
    return objetos

def get_pagerank():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT evento, score FROM pagerank_eventos")
    pr = {row[0]: row[1] for row in cursor.fetchall()}
    cursor.close()
    conn.close()
    return pr

def search_index(query, video_metadata):
    query = query.strip().lower()

    # 1. Intentar coincidencia exacta
    videos = get_objeto_videos(query)

    # 2. Si no hay, buscar similar
    if videos is None:
        objetos = get_all_objetos()
        similares = get_close_matches(query, objetos, n=1, cutoff=0.5)
        if not similares:
            return []  # Nada encontrado
        videos = get_objeto_videos(similares[0])

    if not videos:
        return []

    # 3. Obtener PageRank para tipos de evento
    pagerank_scores = get_pagerank()

    def video_score(video_file):
        data = video_metadata.get(video_file, {})
        alerts = data.get("alerts", [])
        score = 0.0
        for alert in alerts:
            tipo = alert.get("event_type")
            score += pagerank_scores.get(tipo, 0.0)
        return score

    # 4. Ordenar los videos por relevancia
    sorted_videos = sorted(videos, key=video_score, reverse=True)
    return sorted_videos[:20]