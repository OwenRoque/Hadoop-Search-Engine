HDFS_HOST = "hadoop-master" # cambiar a nombre del namenode host
HDFS_PORT = 9870
HDFS_USER = "hadoop1"  # tu usuario HDFS
HDFS_APP = HDFS_USER + "/search-engine" # nombre app
# direcciones de videos/jsons/index en hdfs dist. (/)!
# "/user/" + HDFS_APP + "/videos"
HDFS_VIDEO_PATH = "/videos"
HDFS_JSON_PATH = "/json"
# "/user/" + HDFS_APP + "/inverted-index"
# HDFS_INDEX_PATH = ""

HIVE_USER = "hiveuser"
HIVE_PASSWORD = "hivepassword"
HIVE_PORT = 10000
