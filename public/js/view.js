
const API = "/api";

let allRecords = [];

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
// POPULATE DROPDOWNS
// ======================================

function populateProductDropdown() {
    const dropdown = document.getElementById("filterProduct");

    PRODUCTS.forEach(product => {
        const option = document.createElement("option");
        option.value = product;
        option.textContent = product;
        dropdown.appendChild(option);
    });
}

function populateStatusDropdown() {
    const dropdown = document.getElementById("filterStatus");

    // Get distinct statuses from saved purchase orders
    const statuses = [
        ...new Set(
            allRecords
                .map(record => record.order_status)
                .filter(Boolean)
        )
    ];

    dropdown.innerHTML =
        '<option value="">All Order Statuses</option>';

    statuses.sort().forEach(status => {
        const option = document.createElement("option");
        option.value = status;
        option.textContent = status;
        dropdown.appendChild(option);
    });
}

// ======================================
// LOAD RECORDS
// ======================================

async function loadRecords() {
    const tbody = document.getElementById("recordsTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="13">Loading records...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${API}/bg-fd`);

        if (!response.ok) {
            throw new Error("Unable to load records.");
        }

        allRecords = await response.json();

        populateStatusDropdown();
        applyFilters();

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13">Unable to load records.</td>
            </tr>
        `;

        showMessage(error.message);
    }
}

// ======================================
// DISPLAY RECORDS
// ======================================

function displayRecords(records) {
    const tbody = document.getElementById("recordsTableBody");
    const count = document.getElementById("recordCount");

    tbody.innerHTML = "";

    if (!Array.isArray(records) || records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="13">No BG/FD records found.</td>
            </tr>
        `;

        count.textContent = "Total records: 0";
        return;
    }

    records.forEach(record => {
        const row = document.createElement("tr");

        const values = [
            record.po_number,
            record.product_name,
            record.railway_unit,
            record.order_status,
            record.bg_fd_number,
            record.extended_bg_fd_number,
            record.bg_expiry_date,
            record.bg_fd_lien_amount,
            record.bg_claim_date,
            record.contract_extension_date,
            record.contract_expiry_date,
            record.fd_margin_amount,
            record.fd_margin_number
        ];

        values.forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "-";
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    count.textContent = `Total records: ${records.length}`;
}

// ======================================
// APPLY ALL FILTERS TOGETHER
// ======================================

function applyFilters() {
    const searchText = document
        .getElementById("searchRecords")
        .value.toLowerCase()
        .trim();

    const selectedStatus =
        document.getElementById("filterStatus").value;

    const selectedProduct =
        document.getElementById("filterProduct").value;

    const selectedRailway =
        document.getElementById("filterRailway").value;

    const fromDate =
        document.getElementById("fromDate").value;

    const toDate =
        document.getElementById("toDate").value;

    const filteredRecords = allRecords.filter(record => {

        // Search PO number and BG/FD numbers
        const matchesSearch =
            !searchText ||
            [
                record.po_number,
                record.bg_fd_number,
                record.extended_bg_fd_number
            ].some(value =>
                String(value ?? "")
                    .toLowerCase()
                    .includes(searchText)
            );

        const matchesStatus =
            !selectedStatus ||
            record.order_status === selectedStatus;

        const matchesProduct =
            !selectedProduct ||
            record.product_name === selectedProduct;

        const matchesRailway =
            !selectedRailway ||
            record.railway_unit === selectedRailway;

        // Compare YYYY-MM-DD date strings
        const expiryDate = record.bg_expiry_date
            ? String(record.bg_expiry_date).slice(0, 10)
            : "";

        const matchesFromDate =
            !fromDate ||
            (expiryDate && expiryDate >= fromDate);

        const matchesToDate =
            !toDate ||
            (expiryDate && expiryDate <= toDate);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesProduct &&
            matchesRailway &&
            matchesFromDate &&
            matchesToDate
        );
    });

    displayRecords(filteredRecords);
}

// ======================================
// MESSAGE
// ======================================

function showMessage(text) {
    const message = document.getElementById("recordMessage");

    if (message) {
        message.textContent = text;
        message.className = "message error";
    }
}

// ======================================
// BUTTONS AND FILTER EVENTS
// ======================================

// Apply filters button
document.getElementById("applyFilters")
    .addEventListener("click", applyFilters);

// Search while typing
document.getElementById("searchRecords")
    .addEventListener("input", applyFilters);

// Refresh records
document.getElementById("refreshRecords")
    .addEventListener("click", loadRecords);

// Reset filters
document.getElementById("resetFilters")
    .addEventListener("click", () => {

        document.getElementById("searchRecords").value = "";
        document.getElementById("filterStatus").value = "";
        document.getElementById("filterProduct").value = "";
        document.getElementById("filterRailway").value = "";
        document.getElementById("fromDate").value = "";
        document.getElementById("toDate").value = "";

        applyFilters();
    });

// ======================================
// INITIALIZE PAGE
// ======================================

populateProductDropdown();
loadRecords();

