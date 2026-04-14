import sqlite3
conn = sqlite3.connect('/app/data/hackathon.db')
cur = conn.cursor()
cur.execute('SELECT t.team_name, COALESCE(SUM(s.points),0) FROM teams t LEFT JOIN scores s ON s.team_id=t.id GROUP BY t.id, t.team_name ORDER BY 2 DESC LIMIT 10')
for i,(n,p) in enumerate(cur.fetchall(),1):
    print(str(i)+'. '+n+': '+str(p)+' pts')
conn.close()
