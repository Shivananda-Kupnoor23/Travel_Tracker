import sqlite3
import os

class TravelDB:
    def __init__(self, db_path):
        self.db_path = db_path

    def execute_query(self, sql):
        """Execute a read-only SQL query and return results as list of dicts."""
        sql_upper = sql.strip().upper()
        if not sql_upper.startswith('SELECT'):
            raise ValueError("Only SELECT queries are allowed")

        forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE']
        for word in forbidden:
            if word in sql_upper:
                raise ValueError(f"Forbidden SQL operation: {word}")

        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            cursor = conn.execute(sql)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            raise ValueError(f"SQL Error: {str(e)}")
        finally:
            conn.close()

    def get_schema_info(self):
        """Return table info for debugging."""
        conn = sqlite3.connect(self.db_path)
        try:
            cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [row[0] for row in cursor.fetchall()]
            schema = {}
            for table in tables:
                cursor = conn.execute(f"PRAGMA table_info({table})")
                schema[table] = [{'name': row[1], 'type': row[2]} for row in cursor.fetchall()]
            return schema
        finally:
            conn.close()

    def is_available(self):
        """Check if database file exists and is accessible."""
        return os.path.exists(self.db_path)
