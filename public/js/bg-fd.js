
const API = "/api";

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
// LOAD PURCHASE ORDER DROPDOWN
// ======================================

async function loadPurchaseOrders() {
    const poDropdown = document.getElementById("po_id");

    poDropdown.innerHTML =
        '<option value="">Loading Purchase Orders...</option>';

    try {
        const response = await fetch(`${API}/po-options`);

        if (!response.ok) {
            throw new Error("Unable to load Purchase Orders.");
        }

        const records = await response.json();

        poDropdown.innerHTML =
            '<option value="">Select PO Number</option>';

        if (records.length === 0) {
            poDropdown.innerHTML =
                '<option value="">No Purchase Orders available</option>';
            return;
        }

        records.forEach(po => {
            const option = document.createElement("option");

            option.value = po.id;
            option.textContent = po.po_number;

            poDropdown.appendChild(option);
        });

    } catch (error) {
        poDropdown.innerHTML =
            '<option value="">Error loading Purchase Orders</option>';

        showMessage(error.message, "error");
    }
}

// ======================================
// FETCH DETAILS WHEN PO IS SELECTED
// ======================================

document.getElementById("po_id").addEventListener(
    "change",
    async function () {

        const poId = this.value;

        document.getElementById("product_name").value = "";
        document.getElementById("railway_unit").value = "";
        document.getElementById("order_status").value = "";

        if (!poId) return;

        try {
            const response = await fetch(
                `${API}/purchase-orders/${poId}`
            );

            if (!response.ok) {
                throw new Error("Unable to fetch PO details.");
            }

            const po = await response.json();

            document.getElementById("product_name").value =
                po.product_name || "";

            document.getElementById("railway_unit").value =
                po.railway_unit || "";

            document.getElementById("order_status").value =
                po.order_status || "";

        } catch (error) {
            showMessage(error.message, "error");
        }
    }
);

// ======================================
// SAVE BG/FD DETAILS
// ======================================

const bgFdForm = document.getElementById("bgFdForm");

bgFdForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const saveButton =
        document.getElementById("saveBgFdBtn");

    const data = {
        po_id: document.getElementById("po_id").value,

        bg_fd_number:
            document.getElementById("bg_fd_number").value.trim(),

        extended_bg_fd_number:
            document.getElementById("extended_bg_fd_number").value.trim() || null,

        bg_expiry_date:
            document.getElementById("bg_expiry_date").value || null,

        bg_fd_lien_amount:
            document.getElementById("bg_fd_lien_amount").value || null,

        bg_claim_date:
            document.getElementById("bg_claim_date").value || null,

        contract_extension_date:
            document.getElementById("contract_extension_date").value || null,

        contract_expiry_date:
            document.getElementById("contract_expiry_date").value || null,

        fd_margin_amount:
            document.getElementById("fd_margin_amount").value || null,

        fd_margin_number:
            document.getElementById("fd_margin_number").value || null
    };

    if (!data.po_id) {
        showMessage("Please select a PO Number.", "error");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(`${API}/bg-fd`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Unable to save BG/FD details."
            );
        }

        showMessage(
            "BG/FD details saved successfully!",
            "success"
        );

        bgFdForm.reset();

        document.getElementById("product_name").value = "";
        document.getElementById("railway_unit").value = "";
        document.getElementById("order_status").value = "";

    } catch (error) {
        showMessage(error.message, "error");

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save BG/FD Details";
    }
});

// ======================================
// INITIAL LOAD
// ======================================

loadPurchaseOrders();
