
// ======================================
// FIXED DROPDOWN OPTIONS
// ======================================

// Add your exact repository product names here.
// Example: ["Product A", "Product B"]

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

const RAILWAY_UNITS = [
    "RCF",
    "MCF",
    "ICF"
];

const API = "/api";

// ======================================
// POPULATE DROPDOWNS
// ======================================

function populateDropdown(id, options, placeholder) {
    const select = document.getElementById(id);

    if (!select) {
        console.error(`Dropdown not found: ${id}`);
        return;
    }

    select.innerHTML = "";

    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = placeholder;

    select.appendChild(firstOption);

    options.forEach(item => {
        const option = document.createElement("option");
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });

    select.disabled = false;
}

populateDropdown(
    "product_name",
    PRODUCTS,
    "Select Product"
);

populateDropdown(
    "railway_unit",
    RAILWAY_UNITS,
    "Select Railway Unit"
);

// ======================================
// SHOW MESSAGE
// ======================================

function showMessage(message, type) {
    const box = document.getElementById("message");

    box.textContent = message;
    box.className = "message " + type;

    box.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// ======================================
// REMARKS CHARACTER COUNT
// ======================================

const remarks = document.getElementById("remarks");

remarks.addEventListener("input", () => {
    document.getElementById("remarksCount").textContent =
        `${remarks.value.length} / 255 characters`;
});

// ======================================
// ADD PURCHASE ORDER
// ======================================

const poForm = document.getElementById("poForm");

poForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const saveButton = document.getElementById("saveBtn");

    const data = {
        po_number: document.getElementById("po_number").value.trim(),
        order_date: document.getElementById("order_date").value,
        product_name: document.getElementById("product_name").value,
        quantity: document.getElementById("quantity").value,
        order_start_date:
            document.getElementById("order_start_date").value || null,
        completion_date:
            document.getElementById("completion_date").value || null,
        railway_unit: document.getElementById("railway_unit").value,
        order_status: document.getElementById("order_status").value,
        quantity_supplied:
            document.getElementById("quantity_supplied").value || 0,
        remarks: document.getElementById("remarks").value.trim()
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(`${API}/purchase-orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Unable to save record.");
        }

        showMessage(
            "Purchase Order saved successfully!",
            "success"
        );

        poForm.reset();

        document.getElementById("remarksCount").textContent =
            "0 / 255 characters";

        await loadPurchaseOrders();

    } catch (error) {
        showMessage(error.message, "error");
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Purchase Order";
    }
});

// ======================================
// LOAD RECENT PURCHASE ORDERS
// ======================================

async function loadPurchaseOrders() {
    const tbody = document.getElementById("poTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="6">Loading records...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${API}/purchase-orders`);

        if (!response.ok) {
            throw new Error("Could not load Purchase Orders.");
        }

        const records = await response.json();

        tbody.innerHTML = "";

        if (records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">No Purchase Orders found.</td>
                </tr>
            `;
            return;
        }

        records.slice(0, 10).forEach(record => {
            const row = document.createElement("tr");

            const values = [
                record.po_number,
                record.order_date,
                record.product_name,
                record.quantity,
                record.railway_unit,
                record.order_status
            ];

            values.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "-";
                row.appendChild(cell);
            });

            tbody.appendChild(row);
        });

    } catch (error) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">${error.message}</td>
            </tr>
        `;
    }
}

// ======================================
// REFRESH BUTTON
// ======================================

document.getElementById("refreshBtn").addEventListener(
    "click",
    loadPurchaseOrders
);

// ======================================
// INITIAL LOAD
// ======================================

loadPurchaseOrders();
