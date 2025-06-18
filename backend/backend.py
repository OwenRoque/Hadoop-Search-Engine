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
        files = hdfs_client.list(HDFS_JSON_PATH)
        for file in files:
            if file.endswith(".json"):
                with hdfs_client.read(f"{HDFS_JSON_PATH}/{file}") as reader:
                    data = json.load(reader)
                    video_file = data.get("video_file")
                    if video_file:
                        video_metadata[video_file] = data
        print(f"[INFO] Se cargaron {len(video_metadata)} metadatos de HDFS")
    except Exception as e:
        print(f"[ERROR] No se pudo cargar metadata de HDFS: {e}")

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
        json_file = video_file.replace(".mp4", ".json")
        hdfs_path = f"{HDFS_JSON_PATH}/{json_file}"
        try:
            with hdfs_client.read(hdfs_path) as reader:
                data = json.load(reader)
                enriched_results.append(data)
        except Exception as e:
            print(f"[WARN] No se pudo cargar metadata de {json_file}: {e}")

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
    # load_metadata_from_hdfs()
    app.run(debug=True, port=5000)
