from flask import Flask, redirect, jsonify, request
from utils import get_webhdfs_url
from flask_cors import CORS
from config import HDFS_HOST, HDFS_PORT, HDFS_USER, HDFS_VIDEO_PATH, HDFS_JSON_PATH
from hdfs import InsecureClient
from db import search_index
import json
import requests
import os

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])  # Permitir peticiones desde el frontend

hdfs_client = InsecureClient(f"http://{HDFS_HOST}:{HDFS_PORT}", user=HDFS_USER)

# Diccionario global con metadata
video_metadata = {}

def load_metadata_from_hdfs():
    global video_metadata
    video_metadata = {}

    try:
        with hdfs_client.read("/input.json", encoding='utf-8') as reader:
            for line in reader:
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    video_file = data.get("video_file")
                    if video_file:
                        video_metadata[video_file] = data
                except json.JSONDecodeError as je:
                    print(f"[WARN] Línea invalida en input.json: {je}")
        print(f"[INFO] Se cargaron {len(video_metadata)} metadatos desde input.json")
    except Exception as e:
        print(f"[ERROR] No se pudo cargar input.json desde HDFS: {e}")

@app.route("/video/<filename>")
def stream_video(filename):
    url = get_webhdfs_url(filename)
    # Redirige directamente al archivo en WebHDFS
    return redirect(url, code=302)

@app.route("/search")
def search():
    query = request.args.get("q", "").lower().strip()
    if not query or len(query) < 2:
        return jsonify([])

    result_files = search_index(query, video_metadata)

    enriched_results = []
    for video_file in result_files:
        data = video_metadata.get(video_file)
        if data:
            enriched_results.append(data)
        else:
            print(f"[WARN] No se encontró metadata para {video_file}")

    return jsonify(enriched_results)

@app.route("/list")
def list_files():
    list_url = f"http://{HDFS_HOST}:{HDFS_PORT}/webhdfs/v1{HDFS_VIDEO_PATH}?op=LISTSTATUS&user.name={HDFS_USER}"
    r = requests.get(list_url)

    if r.status_code == 200:
        result = r.json()["FileStatuses"]["FileStatus"]
        return jsonify([f["pathSuffix"] for f in result])
    else:
        return jsonify({"error": "No se pudo listar archivos"}), r.status_code



if __name__ == "__main__":
    load_metadata_from_hdfs()
    app.run(debug=True, port=5000)
