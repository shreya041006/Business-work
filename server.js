
require("dotenv").config();

const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MySQL connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true
});

// Test database connection
app.get("/api/health", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.json({
            success: true,
            message: "MySQL connected successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ======================================
// 1. ADD PURCHASE ORDER
// ======================================

app.post("/api/purchase-orders", async (req, res) => {
    try {
        const {
            po_number,
            order_date,
            product_name,
            quantity,
            order_start_date,
            completion_date,
            railway_unit,
            order_status,
            quantity_supplied,
            remarks
        } = req.body;

        if (
            !po_number ||
            !order_date ||
            !product_name ||
            quantity === undefined ||
            quantity === "" ||
            !railway_unit ||
            !order_status
        ) {
            return res.status(400).json({
                success: false,
                message: "Please fill all required fields."
            });
        }

        const sql = `
            INSERT INTO purchase_orders
            (
                po_number,
                order_date,
                product_name,
                quantity,
                order_start_date,
                completion_date,
                railway_unit,
                order_status,
                quantity_supplied,
                remarks
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            String(po_number).trim(),
            order_date,
            product_name,
            quantity,
            order_start_date || null,
            completion_date || null,
            railway_unit,
            order_status,
            quantity_supplied === "" ||
            quantity_supplied === undefined
                ? 0
                : quantity_supplied,
            remarks || null
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            success: true,
            message: "Purchase Order saved successfully.",
            id: result.insertId
        });

    } catch (error) {
        console.error("PO error:", error);

        res.status(500).json({
            success: false,
            message: error.code === "ER_DUP_ENTRY"
                ? "This PO Number already exists."
                : "Unable to save Purchase Order.",
            error: error.message
        });
    }
});

// ======================================
// 2. GET ALL PURCHASE ORDERS
// ======================================

app.get("/api/purchase-orders", async (req, res) => {
    try {
        const {
            search,
            product_name,
            railway_unit,
            order_status,
            from_date,
            to_date
        } = req.query;

        let sql = `
            SELECT *
            FROM purchase_orders
            WHERE 1=1
        `;

        const values = [];

        if (search) {
            sql += " AND po_number LIKE ?";
            values.push(`%${search}%`);
        }

        if (product_name) {
            sql += " AND product_name = ?";
            values.push(product_name);
        }

        if (railway_unit) {
            sql += " AND railway_unit = ?";
            values.push(railway_unit);
        }

        if (order_status) {
            sql += " AND order_status = ?";
            values.push(order_status);
        }

        if (from_date) {
            sql += " AND order_date >= ?";
            values.push(from_date);
        }

        if (to_date) {
            sql += " AND order_date <= ?";
            values.push(to_date);
        }

        sql += " ORDER BY id DESC";

        const [rows] = await db.execute(sql, values);

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ======================================
// 3. GET ONE PO FOR BG/FD FORM
// ======================================

app.get("/api/purchase-orders/:id", async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT id, po_number, product_name,
                    railway_unit, order_status
             FROM purchase_orders
             WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: "Purchase Order not found."
            });
        }

        res.json(rows[0]);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ======================================
// 4. GET PO DROPDOWN OPTIONS
// ======================================

app.get("/api/po-options", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT id, po_number
             FROM purchase_orders
             ORDER BY id DESC`
        );

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ======================================
// 5. ADD BG/FD DETAILS
// ======================================

app.post("/api/bg-fd", async (req, res) => {
    try {
        const {
            po_id,
            bg_fd_number,
            extended_bg_fd_number,
            bg_expiry_date,
            bg_fd_lien_amount,
            bg_claim_date,
            contract_extension_date,
            contract_expiry_date,
            fd_margin_amount,
            fd_margin_number
        } = req.body;

        if (!po_id || !bg_fd_number) {
            return res.status(400).json({
                success: false,
                message: "PO Number and BG/FD Number are required."
            });
        }

        const [po] = await db.execute(
            "SELECT id FROM purchase_orders WHERE id = ?",
            [po_id]
        );

        if (po.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Selected Purchase Order does not exist."
            });
        }

        const sql = `
            INSERT INTO bg_fd_details
            (
                po_id,
                bg_fd_number,
                extended_bg_fd_number,
                bg_expiry_date,
                bg_fd_lien_amount,
                bg_claim_date,
                contract_extension_date,
                contract_expiry_date,
                fd_margin_amount,
                fd_margin_number
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            po_id,
            bg_fd_number,
            extended_bg_fd_number || null,
            bg_expiry_date || null,
            bg_fd_lien_amount || null,
            bg_claim_date || null,
            contract_extension_date || null,
            contract_expiry_date || null,
            fd_margin_amount || null,
            fd_margin_number || null
        ];

        const [result] = await db.execute(sql, values);

        res.status(201).json({
            success: true,
            message: "BG/FD details saved successfully.",
            id: result.insertId
        });

    } catch (error) {
        console.error("BG/FD error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save BG/FD details.",
            error: error.message
        });
    }
});

// ======================================
// 6. VIEW BG/FD RECORDS
// ======================================

app.get("/api/bg-fd", async (req, res) => {
    try {
        const {
            search,
            po_id,
            railway_unit,
            product_name,
            order_status,
            from_date,
            to_date
        } = req.query;

        let sql = `
            SELECT
                b.*,
                p.po_number,
                p.product_name,
                p.railway_unit,
                p.order_status
            FROM bg_fd_details b
            INNER JOIN purchase_orders p
                ON b.po_id = p.id
            WHERE 1=1
        `;

        const values = [];

        if (search) {
            sql += ` AND (
                b.bg_fd_number LIKE ?
                OR b.extended_bg_fd_number LIKE ?
                OR p.po_number LIKE ?
            )`;

            values.push(
                `%${search}%`,
                `%${search}%`,
                `%${search}%`
            );
        }

        if (po_id) {
            sql += " AND p.id = ?";
            values.push(po_id);
        }

        if (product_name) {
            sql += " AND p.product_name = ?";
            values.push(product_name);
        }

        if (railway_unit) {
            sql += " AND p.railway_unit = ?";
            values.push(railway_unit);
        }

        if (order_status) {
            sql += " AND p.order_status = ?";
            values.push(order_status);
        }

        if (from_date) {
            sql += " AND b.bg_expiry_date >= ?";
            values.push(from_date);
        }

        if (to_date) {
            sql += " AND b.bg_expiry_date <= ?";
            values.push(to_date);
        }

        sql += " ORDER BY b.id DESC";

        const [rows] = await db.execute(sql, values);

        res.json(rows);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ======================================
// 7. UPDATE PURCHASE ORDER STATUS
// ======================================

app.put("/api/purchase-orders/:id/status", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { order_status } = req.body;

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Purchase Order ID."
            });
        }

        if (
            typeof order_status !== "string" ||
            !order_status.trim() ||
            order_status.trim().length > 50
        ) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid Order Status."
            });
        }

        const [result] = await db.execute(
            `UPDATE purchase_orders
             SET order_status = ?
             WHERE id = ?`,
            [order_status.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Purchase Order not found."
            });
        }

        res.json({
            success: true,
            message: "Order Status updated successfully."
        });

    } catch (error) {
        console.error("Update PO status error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to update Order Status."
        });
    }
});


// ======================================
// 8. DELETE PURCHASE ORDER
// ======================================

app.delete("/api/purchase-orders/:id", async (req, res) => {
    let connection;

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid Purchase Order ID."
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check whether the PO exists
        const [poRows] = await connection.execute(
            `SELECT id
             FROM purchase_orders
             WHERE id = ?
             FOR UPDATE`,
            [id]
        );

        if (poRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Purchase Order not found."
            });
        }

        // Check linked BG/FD records
        const [bgRows] = await connection.execute(
            `SELECT COUNT(*) AS total
             FROM bg_fd_details
             WHERE po_id = ?`,
            [id]
        );

        if (Number(bgRows[0].total) > 0) {
            await connection.rollback();

            return res.status(409).json({
                success: false,
                message: "This PO has linked BG/FD records and cannot be deleted."
            });
        }

        // Delete only if no BG/FD records are linked
        await connection.execute(
            `DELETE FROM purchase_orders
             WHERE id = ?`,
            [id]
        );

        await connection.commit();

        res.json({
            success: true,
            message: "Purchase Order deleted successfully."
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error("Delete PO error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to delete Purchase Order."
        });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
