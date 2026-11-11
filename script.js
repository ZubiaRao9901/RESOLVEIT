const API = "/api";

const ticketList = document.getElementById("ticket-list");
const refreshButton = document.querySelector(".refresh-btn");
const ticketForm = document.getElementById("ticket-form");

// Safely read server responses
async function readResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        const detail = Array.isArray(data.detail)
            ? data.detail.map(item => item.msg).join(", ")
            : data.detail;

        throw new Error(detail || "Something went wrong.");
    }

    return data;
}

// Load dashboard and tickets
async function loadDashboard() {
    if (refreshButton) {
        refreshButton.disabled = true;
        refreshButton.textContent = "Loading...";
    }

    ticketList.innerHTML = `
        <tr><td colspan="7">Loading tickets...</td></tr>
    `;

    try {
        const [statsResponse, ticketsResponse] = await Promise.all([
            fetch(`${API}/dashboard`),
            fetch(`${API}/tickets`)
        ]);

        const stats = await readResponse(statsResponse);
        const tickets = await readResponse(ticketsResponse);

        document.getElementById("total").textContent = stats.total;
        document.getElementById("open").textContent = stats.open;
        document.getElementById("in-progress").textContent = stats.in_progress;
        document.getElementById("resolved").textContent = stats.resolved;

        if (tickets.length === 0) {
            ticketList.innerHTML = `
                <tr>
                    <td colspan="7">No tickets yet. Create your first ticket!</td>
                </tr>
            `;
            return;
        }

        ticketList.innerHTML = tickets.map(ticket => `
            <tr>
                <td><strong>${escapeHTML(ticket.ticket_id)}</strong></td>
                <td>${escapeHTML(ticket.title)}</td>
                <td>${escapeHTML(ticket.category)}</td>
                <td>${escapeHTML(ticket.priority)}</td>

                <td>
                    <select class="status-select" id="status-${ticket.id}">
                        ${["Open", "In Progress", "Resolved"].map(status => `
                            <option value="${status}"
                                ${ticket.status === status ? "selected" : ""}>
                                ${status}
                            </option>
                        `).join("")}
                    </select>
                </td>

                <td>
                    <input class="assignee-input"
                        id="assignee-${ticket.id}"
                        value="${escapeHTML(ticket.assigned_to)}"
                        placeholder="Engineer name">
                </td>

                <td>
                    <button onclick="updateTicket('${ticket.ticket_id}', ${ticket.id})">
                        Save
                    </button>
                </td>
            </tr>
        `).join("");

    } catch (error) {
        console.error("Dashboard error:", error);

        ticketList.innerHTML = `
            <tr>
                <td colspan="7">Unable to load tickets: ${escapeHTML(error.message)}</td>
            </tr>
        `;
    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
            refreshButton.textContent = "↻ Refresh";
        }
    }
}

// Protect dashboard from unsafe HTML
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Submit a new ticket
ticketForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const button = document.getElementById("submit-btn");
    const message = document.getElementById("form-message");

    const ticket = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        category: document.getElementById("category").value,
        priority: document.getElementById("priority").value
    };

    button.disabled = true;
    button.textContent = "Submitting...";
    message.textContent = "Please wait...";

    try {
        const response = await fetch(`${API}/tickets`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(ticket)
        });

        const result = await readResponse(response);

        message.textContent =
            `Ticket created successfully! Your ID: ${result.ticket_id}`;

        ticketForm.reset();

        await loadDashboard();

    } catch (error) {
        message.textContent = `Error: ${error.message}`;
        console.error(error);
    } finally {
        button.disabled = false;
        button.textContent = "Submit Ticket →";
    }
});

// Update ticket status and engineer
async function updateTicket(ticketId, rowId) {
    const status = document.getElementById(`status-${rowId}`).value;

    const assignedTo = document
        .getElementById(`assignee-${rowId}`)
        .value.trim();

    if (!assignedTo) {
        alert("Please enter an engineer name.");
        return;
    }

    try {
        const response = await fetch(`${API}/tickets/${ticketId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                status: status,
                assigned_to: assignedTo
            })
        });

        await readResponse(response);

        alert("Ticket updated successfully!");

        await loadDashboard();

    } catch (error) {
        alert(`Update failed: ${error.message}`);
        console.error(error);
    }
}

// Refresh button
refreshButton.addEventListener("click", loadDashboard);

// Automatically load dashboard when website opens
loadDashboard();ss