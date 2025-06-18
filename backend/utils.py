from config import HDFS_HOST, HDFS_PORT, HDFS_USER, HDFS_VIDEO_PATH

def get_webhdfs_url(file_path):
    return f"http://{HDFS_HOST}:{HDFS_PORT}/webhdfs/v1{HDFS_VIDEO_PATH}/{file_path}?op=OPEN&user.name={HDFS_USER}"
