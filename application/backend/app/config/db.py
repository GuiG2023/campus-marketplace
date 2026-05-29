import pymysql

def get_connection():
    return pymysql.connect(
        host="127.0.0.1",
        user="team03",
        password="team03pass",  
        database="team03db",
        cursorclass=pymysql.cursors.DictCursor
    )