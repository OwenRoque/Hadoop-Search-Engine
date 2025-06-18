import os
import subprocess

VIDEO_DIR = "/home/owen/Descargas/VD2"  # Carpeta donde estan los videos raw
FFMPEG = "ffmpeg"
FFPROBE = "ffprobe"

def get_video_codec(filepath):
    try:
        result = subprocess.run([
            FFPROBE, "-v", "error",
            "-select_streams", "v:0",
            "-show_entries", "stream=codec_name",
            "-of", "default=nokey=1:noprint_wrappers=1",
            filepath
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        return result.stdout.strip()
    except Exception as e:
        print(f"❌ Error al obtener codec de {filepath}: {e}")
        return None

def transcode_to_h264(filepath):
    temp_output = filepath + ".h264tmp.mp4"
    print(f"Transcodificando: {os.path.basename(filepath)}")

    cmd = [
        FFMPEG,
        "-i", filepath,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "23",
        "-c:a", "aac",
        "-movflags", "+faststart",
        "-y",  # Sobrescribe si existe
        temp_output
    ]

    process = subprocess.run(cmd)

    if process.returncode == 0:
        os.replace(temp_output, filepath)
        print(f"Reemplazado: {os.path.basename(filepath)}")
    else:
        print(f"Fallo transcodificacion: {os.path.basename(filepath)}")
        if os.path.exists(temp_output):
            os.remove(temp_output)

def process_directory(directory):
    for file in os.listdir(directory):
        if file.lower().endswith(".mp4"):
            full_path = os.path.join(directory, file)
            codec = get_video_codec(full_path)

            if codec != "h264":
                print(f"  - {file} usa codec '{codec}' => sera convertido.")
                transcode_to_h264(full_path)
            else:
                print(f"  + {file} ya esta en H.264")

if __name__ == "__main__":
    process_directory(VIDEO_DIR)
