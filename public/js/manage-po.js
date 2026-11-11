
const API = "/api";

let allPOs = [];

// ======================================
// PRODUCT OPTIONS
// ======================================

const PRODUCTS = [
    "ADJUSTING SHIM",
    "ANTI ROLL BAR BKT",
    "ANTI ROLL BAR SUPPORT",
    "BKT LATERAL DAMPER",
    "BRAKE HEAD",
    "CP PIN COMPLETE",
    "CROSS SECTION",
    "CROSS SECTION BRACKET",
    "EYE",
    "FIXATION BALL JOINT",
    "LIFTING PLATFORM",
    "LONGITUDINAL STOP",
    "LOWER SPRING BEAM",
    "METAL STOP (LH)",
    "METAL STOP (RH)",
    "PLATE SPRING DIA",
    "RUBBING PAD",
    "SAFETY STOP PLATE",
    "SECURITY DISC",
    "SET OF DOME",
    "SET OF LEVER FOR MEMU",
    "SET OF METAL STOP (LH & RH)",
    "TRACTION LEVER",
    "TRACTION LEVER BKT",
    "TRANSOM COMPLETE",
    "UPPER STOP PLATE",
    "WEAR PLATE"
];

// ======================================
// ELEMENTS
// ======================================

const tbody = document.getElementById("poTableBody");
const message = document.getElementById("manageMessage");
const poCount = document.getElementById("poCount");

const searchInput = document.getElementById("searchPO");
const productFilter = document.getElementById("filterProduct");
const railwayFilter = document.getElementById("filterRailway");
const statusFilter = document.getElementById("filterStatus");

// ======================================
// POPULATE PRODUCT DROPDOWN
// ======================================

PRODUCTS.forEach(product => {
    const option = document.createElement("option");
    option.value = product;
    option.textContent = product;
    productFilter.appendChild(option);
});

// ======================================
// SHOW MESSAGE
// ======================================

function showMessage(text, type = "success") {
    message.textContent = text;
    message.className = `message ${type}`;
}

// ======================================
// LOAD PURCHASE ORDERS
// ======================================

async function loadPurchaseOrders() {
    tbody.innerHTML = `
        <tr>
            <td colspan="8">Loading Purchase Orders...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${API}/purchase-orders`);

        if (!response.ok) {
            throw new Error("Unable to load Purchase Orders.");
        }

        allPOs = await response.json();

        populateStatusDropdown();
        applyPOFilters();

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">Unable to load Purchase Orders.</td>
            </tr>
        `;

        showMessage(error.message, "error");
    }
}

// ======================================
// POPULATE STATUS FILTER
// ======================================

function populateStatusDropdown() {
    const previousValue = statusFilter.value;

    const statuses = [
        ...new Set(
            allPOs
                .map(po => po.order_status)
                .filter(Boolean)
        )
    ].sort();

    statusFilter.innerHTML =
        '<option value="">All Order Statuses</option>';

    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        statusFilter.appendChild(option);
    });

    statusFilter.value = statuses.includes(previousValue)
        ? previousValue
        : "";
}

// ======================================
// STATUS OPTIONS FOR EACH ROW
// ======================================

function createStatusSelect(currentStatus) {
    const select = document.createElement("select");
    select.className = "po-status-select";

    const statuses = [
        ...new Set([
            currentStatus,
            "Active",
            "Completed"
        ].filter(Boolean))
    ];

    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        select.appendChild(option);
    });

    select.value = currentStatus || "";
    return select;
}

// ======================================
// DISPLAY PURCHASE ORDERS
// ======================================

function displayPurchaseOrders(records) {
    tbody.innerHTML = "";

    if (!records.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8">No Purchase Orders found.</td>
            </tr>
        `;

        poCount.textContent = "Total Purchase Orders: 0";
        return;
    }

    records.forEach(po => {
        const row = document.createElement("tr");

        // PO Number and internal ID help distinguish duplicates
        const poCell = document.createElement("td");
        poCell.textContent = `${po.po_number} (ID: ${po.id})`;
        row.appendChild(poCell);

        const dateCell = document.createElement("td");
        dateCell.textContent = po.order_date || "-";
        row.appendChild(dateCell);

        const productCell = document.createElement("td");
        productCell.textContent = po.product_name || "-";
        row.appendChild(productCell);

        const quantityCell = document.createElement("td");
        quantityCell.textContent = po.quantity ?? "-";
        row.appendChild(quantityCell);

        const railwayCell = document.createElement("td");
        railwayCell.textContent = po.railway_unit || "-";
        row.appendChild(railwayCell);

        const statusCell = document.createElement("td");
        statusCell.appendChild(
            createStatusSelect(po.order_status)
        );
        row.appendChild(statusCell);

        const suppliedCell = document.createElement("td");
        suppliedCell.textContent = po.quantity_supplied ?? "0";
        row.appendChild(suppliedCell);

        // Actions
        const actionCell = document.createElement("td");
        actionCell.className = "po-action-cell";

        const updateButton = document.createElement("button");
        updateButton.textContent = "Update";
        updateButton.className = "po-update-button";
        updateButton.dataset.action = "update";
        updateButton.dataset.id = po.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.className = "po-delete-button";
        deleteButton.dataset.action = "delete";
        deleteButton.dataset.id = po.id;

        actionCell.append(updateButton, deleteButton);
        row.appendChild(actionCell);

        tbody.appendChild(row);
    });

    poCount.textContent =
        `Showing ${records.length} of ${allPOs.length} Purchase Orders`;
}

// ======================================
// FILTER PURCHASE ORDERS
// ======================================

function applyPOFilters() {
    const search = searchInput.value.toLowerCase().trim();
    const product = productFilter.value;
    const railway = railwayFilter.value;
    const status = statusFilter.value;

    const filtered = allPOs.filter(po => {
        const matchesSearch =
            !search ||
            String(po.po_number ?? "")
                .toLowerCase()
                .includes(search);

        const matchesProduct =
            !product || po.product_name === product;

        const matchesRailway =
            !railway || po.railway_unit === railway;

        const matchesStatus =
            !status || po.order_status === status;

        return (
            matchesSearch &&
            matchesProduct &&
            matchesRailway &&
            matchesStatus
        );
    });

    displayPurchaseOrders(filtered);
}

// ======================================
// UPDATE PO STATUS
// ======================================

async function updatePOStatus(id, button) {
    const row = button.closest("tr");
    const select = row.querySelector(".po-status-select");
    const newStatus = select.value;

    if (!newStatus) {
        showMessage("Please select an Order Status.", "error");
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${API}/purchase-orders/${id}/status`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    order_status: newStatus
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to update status."
            );
        }

        showMessage(result.message || "Status updated successfully.");
        await loadPurchaseOrders();

    } catch (error) {
        showMessage(error.message, "error");
        button.disabled = false;
    }
}

// ======================================
// DELETE PURCHASE ORDER
// ======================================

async function deletePurchaseOrder(id, button) {
    const po = allPOs.find(item => String(item.id) === String(id));

    if (!po) {
        showMessage("Purchase Order not found.", "error");
        return;
    }

    const confirmed = confirm(
        `Are you sure you want to delete PO ${po.po_number} (ID: ${po.id})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    button.disabled = true;

    try {
        const response = await fetch(
            `${API}/purchase-orders/${id}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to delete Purchase Order."
            );
        }

        showMessage(result.message || "Purchase Order deleted successfully.");
        await loadPurchaseOrders();

    } catch (error) {
        showMessage(error.message, "error");
        button.disabled = false;
    }
}

// ======================================
// TABLE ACTIONS
// ======================================

tbody.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;

    if (button.dataset.action === "update") {
        updatePOStatus(id, button);
    }

    if (button.dataset.action === "delete") {
        deletePurchaseOrder(id, button);
    }
});

// ======================================
// FILTER EVENTS
// ======================================

searchInput.addEventListener("input", applyPOFilters);
productFilter.addEventListener("change", applyPOFilters);
railwayFilter.addEventListener("change", applyPOFilters);
statusFilter.addEventListener("change", applyPOFilters);

// ======================================
// RESET FILTERS
// ======================================

document.getElementById("resetManageFilters")
    .addEventListener("click", () => {
        searchInput.value = "";
        productFilter.value = "";
        railwayFilter.value = "";
        statusFilter.value = "";

        applyPOFilters();
    });

// ======================================
// REFRESH
// ======================================

document.getElementById("refreshPOs")
    .addEventListener("click", loadPurchaseOrders);

// ======================================
// INITIAL LOAD
// ======================================

loadPurchaseOrders();
