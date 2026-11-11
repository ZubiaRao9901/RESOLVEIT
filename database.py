import sqlite3

DATABASE_NAME = "resolveit.db"


def get_connection():
    connection = sqlite3.connect(DATABASE_NAME)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    connection = get_connection()

    connection.execute("""
        CREATE TABLE IF NOT EXISTS tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ticket_id TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            priority TEXT NOT NULL,
            status TEXT DEFAULT 'Open',
            assigned_to TEXT DEFAULT 'Unassigned',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    connection.commit()
    connection.close()


def create_ticket(title, description, category, priority):
    connection = get_connection()

    cursor = connection.execute("""
        INSERT INTO tickets
        (ticket_id, title, description, category, priority)
        VALUES (?, ?, ?, ?, ?)
    """, (
        "TEMP",
        title,
        description,
        category,
        priority
    ))

    ticket_id = f"RIT-{cursor.lastrowid:04d}"

    connection.execute(
        "UPDATE tickets SET ticket_id = ? WHERE id = ?",
        (ticket_id, cursor.lastrowid)
    )

    connection.commit()
    connection.close()

    return ticket_id


def get_all_tickets():
    connection = get_connection()

    tickets = connection.execute(
        "SELECT * FROM tickets ORDER BY id DESC"
    ).fetchall()

    connection.close()
    return tickets


def update_ticket(ticket_id, status, assigned_to):
    connection = get_connection()

    cursor = connection.execute("""
        UPDATE tickets
        SET status = ?, assigned_to = ?
        WHERE ticket_id = ?
    """, (status, assigned_to, ticket_id))

    connection.commit()
    updated = cursor.rowcount > 0
    connection.close()

    return updated