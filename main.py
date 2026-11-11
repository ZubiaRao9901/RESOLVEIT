from pathlib import Path
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from database import (
    initialize_database,
    create_ticket,
    get_all_tickets,
    update_ticket
)

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(
    title="ResolveIT",
    description="IT Service and Incident Management System",
    version="1.0.0"
)

# Connect static files
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)

# Initialize database
initialize_database()


# Ticket creation data
class TicketCreate(BaseModel):
    title: str = Field(min_length=3, max_length=100)
    description: str = Field(min_length=5)
    category: str
    priority: Literal["Low", "Medium", "High", "Critical"]


# Ticket update data
class TicketUpdate(BaseModel):
    status: Literal["Open", "In Progress", "Resolved"]
    assigned_to: str = Field(min_length=1)


# Homepage
@app.get("/")
def home():
    return FileResponse(BASE_DIR / "templates" / "index.html")


# Create a new ticket
@app.post("/api/tickets")
def add_ticket(ticket: TicketCreate):
    ticket_id = create_ticket(
        ticket.title,
        ticket.description,
        ticket.category,
        ticket.priority
    )

    return {
        "message": "Ticket created successfully",
        "ticket_id": ticket_id
    }


# Display all tickets
@app.get("/api/tickets")
def show_tickets():
    tickets = get_all_tickets()
    return [dict(ticket) for ticket in tickets]


# Update ticket status and assignment
@app.patch("/api/tickets/{ticket_id}")
def edit_ticket(ticket_id: str, update: TicketUpdate):
    success = update_ticket(
        ticket_id,
        update.status,
        update.assigned_to
    )

    if not success:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found"
        )

    return {"message": "Ticket updated successfully"}


# Dashboard statistics
@app.get("/api/dashboard")
def dashboard():
    tickets = get_all_tickets()

    return {
        "total": len(tickets),
        "open": sum(t["status"] == "Open" for t in tickets),
        "in_progress": sum(
            t["status"] == "In Progress" for t in tickets
        ),
        "resolved": sum(
            t["status"] == "Resolved" for t in tickets
        )
    }