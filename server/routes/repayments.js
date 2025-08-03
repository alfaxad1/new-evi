const express = require("express");
const connection = require("../config/dbConnection");
const {
  
  checkMissedPayments,
  updateLoanStatus,
} = require("../services/loanService.js");
const { checkLoanDefaults } = require("../services/loanService.js");

const router = express.Router();
router.use(express.json());

// Middleware to validate repayment data
const validateRepaymentData = (req, res, next) => {
  const requiredFields = ["loanId", "amount"];
  const optionalFields = ["dueDate", "paidDate", "mpesaCode", "status"];

  // Check for empty body
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: "Request body cannot be empty" });
  }

  // Check required fields
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({ error: `${field} is required` });
    }
  }

  // Validate status
  const validStatuses = ["pending", "paid", "late", "missed"];
  if (!validStatuses.includes(req.body.status)) {
    return res.status(400).json({
      error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    });
  }

  // Set default paidDate if status is paid
  if (req.body.status === "paid" && !req.body.paidDate) {
    req.body.paidDate = new Date().toISOString().slice(0, 19).replace("T", " ");
  }

  next();
};

// Get all repayments
router.get("/", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    let sql = `
      SELECT r.*, l.total_amount, l.status as loan_status,
         c.id as customer_id,  
         CONCAT(c.first_name, ' ', c.last_name) as customer_name
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      ORDER BY r.id DESC
    `;

    const queryParams = [];

    // Add filtering for officer role
    if (role === "officer") {
      sql += " WHERE l.officer_id = ?";
      queryParams.push(officerId);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await connection.query(sql, queryParams);

    // Count the total number of repayments
    let countSql = `
      SELECT COUNT(*) as count
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
    `;
    const countQueryParams = [];
    if (role === "officer") {
      countSql += " WHERE l.officer_id = ?";
      countQueryParams.push(officerId);
    }

    const [countResult] = await connection.query(countSql, countQueryParams);
    const totalCount = countResult[0].count;

    res.status(200).json({
      count: totalCount,
      data: results,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error getting repayments:", err);
    res.status(500).json({ error: "Error getting repayments" });
  }
});

//get all repayments for a certain loan
router.get("/loan/:loanId", async (req, res) => {
  try {
    const loanId = req.params.loanId;
    const [results] = await connection.query(
      "SELECT * FROM repayments WHERE loan_id = ?",
      [loanId]
    );
    res.status(200).json(results);
  } catch (err) {
    console.error("Error getting repayments:", err);
    res.status(500).json({ error: "Error getting repayments" });
  }
});

// Get all pending repayments
router.get("/pending", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    let sql = `
      SELECT * FROM repayments WHERE status = 'pending'
    `;

    const queryParams = [];

    // Add filtering for officer role
    if (role === "officer") {
      sql += " AND l.officer_id = ?";
      queryParams.push(officerId);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await connection.query(sql, queryParams);

    // Count the total number of pending repayments
    const countSql = `
      SELECT COUNT(*) as count
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE r.status = 'pending'
    `;
    if (role === "officer") {
      countSql += " AND l.officer_id = ?";
    }
    const [countResult] = await connection.query(
      countSql,
      role === "officer" ? [officerId] : []
    );
    const totalCount = countResult[0].count;

    res.status(200).json({
      count: totalCount,
      data: results,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error getting pending repayments:", err);
    res.status(500).json({ error: "Error getting pending repayments" });
  }
});

// Get all approved repayments
router.get("/approved", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    let sql = `
      SELECT r.*, l.total_amount, l.status as loan_status,
             c.id as customer_id,  
             CONCAT(c.first_name, ' ', c.last_name) as customer_name
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE r.status = 'paid'
      ORDER BY r.id DESC
    `;

    const queryParams = [];

    // Add filtering for officer role
    if (role === "officer") {
      sql += " AND l.officer_id = ?";
      queryParams.push(officerId);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const [results] = await connection.query(sql, queryParams);

    // Count the total number of approved repayments
    const countSql = `
      SELECT COUNT(*) as count
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE r.status = 'paid'
    `;
    if (role === "officer") {
      countSql += " AND l.officer_id = ?";
    }
    const [countResult] = await connection.query(
      countSql,
      role === "officer" ? [officerId] : []
    );
    const totalCount = countResult[0].count;

    res.status(200).json({
      count: totalCount,
      data: results,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (err) {
    console.error("Error getting approved repayments:", err);
    res.status(500).json({ error: "Error getting approved repayments" });
  }
});

// Get monthly approved repayments for a specific officer with summary
router.get("/monthly-approved", async (req, res) => {
  try {
    const { officerId, month, year, page = 1, limit = 5 } = req.query;

    if (!officerId || !month || !year) {
      return res.status(400).json({
        error: "Officer ID, month, and year are required",
      });
    }

    // Check if officer exists and has role "officer"
    const [user] = await connection.query(
      "SELECT * FROM users WHERE id = ? AND role = 'officer'",
      [officerId]
    );

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized access",
      });
    }

    const targetAmount = 700000; // Target total amount

    // Query to get approved repayments for the specified officer, month, and year
    const offset = (page - 1) * limit;
    const [repayments] = await connection.query(
      `
      SELECT 
        r.id,
        r.amount,
        r.paid_date,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        l.total_amount AS loan_total,
        lp.name AS loan_product
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE r.status = 'paid'
        AND l.officer_id = ?
        AND MONTH(r.paid_date) = ?
        AND YEAR(r.paid_date) = ?
      ORDER BY r.paid_date DESC
      LIMIT ?
      OFFSET ?
      `,
      [officerId, month, year, limit, offset]
    );

    // Query to calculate the sum of approved repayments and count
    const [summary] = await connection.query(
      `
      SELECT 
        COUNT(*) as repayment_count,
        SUM(r.amount) as total_amount_sum
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      WHERE r.status = 'paid'
        AND l.officer_id = ?
        AND MONTH(r.paid_date) = ?
        AND YEAR(r.paid_date) = ?
      `,
      [officerId, month, year]
    );

    const totalAmountSum = summary[0].total_amount_sum || 0;
    const repaymentCount = summary[0].repayment_count || 0;

    // Calculate deficit and percentage
    const deficit = targetAmount - totalAmountSum;
    const percentage = ((totalAmountSum / targetAmount) * 100).toFixed(2);

    // Calculate total pages
    const totalPages = Math.ceil(repaymentCount / limit);

    res.status(200).json({
      repayments,
      summary: {
        repayment_count: repaymentCount,
        total_amount_sum: totalAmountSum,
        deficit: deficit,
        percentage: `${percentage}%`,
        target_amount: targetAmount,
      },
      meta: {
        page,
        limit,
        totalPages,
      },
    });
  } catch (err) {
    console.error("Error fetching monthly approved repayments:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve monthly approved repayments" });
  }
});

//admin
router.get("/monthly-approved-admin", async (req, res) => {
  try {
    const { officerId, month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        error: "Month and year are required",
      });
    }

    // Check if user is admin
    const [user] = await connection.query(
      "SELECT * FROM users WHERE id = ? AND role = 'admin'",
      [officerId]
    );

    if (!user) {
      return res.status(401).json({
        error: "Unauthorized access",
      });
    }

    // Query to get all officers with their total approved loan amounts
    const [officers] = await connection.query(
      `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COUNT(r.id) as number,
        COALESCE(SUM(r.amount), 0) as total_amount_sum
      FROM users u
      LEFT JOIN loans l ON u.id = l.officer_id
      LEFT JOIN repayments r ON l.id = r.loan_id
      WHERE u.role = 'officer'
        AND r.status = 'paid'
        AND MONTH(r.paid_date) = ?
        AND YEAR(r.paid_date) = ?
      GROUP BY u.id, u.first_name, u.last_name
      `,
      [month, year]
    );

    // Calculate summary
    const summary = officers.reduce(
      (acc, officer) => {
        acc.total_amount_sum += parseFloat(officer.total_amount_sum);
        acc.number += officer.number;
        return acc;
      },
      { total_amount_sum: 0, number: 0 }
    );

    res.status(200).json({ officers, summary });
  } catch (err) {
    console.error(
      "Error fetching monthly approved repayments for admins:",
      err
    );
    res.status(500).json({
      error: "Failed to retrieve monthly approved repayments for admins",
    });
  }
});

// Get repayment by ID with full details
router.get("/:id", async (req, res) => {
  try {
    const sql = `
      SELECT r.*, l.total_amount, l.status as loan_status, 
             c.phone as customer_phone, lp.name as product_name
      FROM repayments r
      JOIN loans l ON r.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE r.id = ?
    `;
    const [results] = await connection.query(sql, [req.params.id]);

    if (results.length === 0) {
      return res.status(404).json({ error: "Repayment not found" });
    }

    res.status(200).json(results[0]);
  } catch (err) {
    console.error("Error getting repayment:", err);
    res.status(500).json({ error: "Error getting repayment" });
  }
});

// Create repayment
router.post("/create", async (req, res) => {
  const { loanId, amount, mpesaCode, initiatedBy } = req.body;

  try {
    const customerIdResult = await connection.query(
      "SELECT customer_id FROM loans WHERE id = ?",
      [loanId]
    );
    // If using mysql2, the first element is the rows array:
    const customerId = customerIdResult[0][0].customer_id;

    // Get loan details
    const [loan] = await connection.query("SELECT * FROM loans WHERE id = ?", [
      loanId,
    ]);

    if (loan.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    const {
      installment_amount,
      installment_type,
      due_date,
      arrears,
      officer_id,
    } = loan[0];

    let newArrears = arrears || 0;
    let nextDueDate = new Date(due_date);

    // Check if payment is sufficient
    if (amount < installment_amount) {
      newArrears += installment_amount - amount; // Add shortfall to arrears
    } else if (amount > installment_amount) {
      newArrears -= amount - installment_amount; // Reduce arrears if overpaid
    }

    // Update due date
    if (installment_type === "daily") {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else if (installment_type === "weekly") {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }

    // Update loan record
    await connection.query(
      `UPDATE loans 
      SET arrears = ?, due_date = ? 
      WHERE id = ?`,
      [newArrears, nextDueDate, loanId]
    );

    // Record repayment
    await connection.query(
      `INSERT INTO repayments (loan_id, amount, due_date, paid_date, status, mpesa_code, created_by, created_at) 
      VALUES (?, ?, ?, NOW(), 'paid', ?, ?, NOW())`,
      [loanId, amount, nextDueDate, mpesaCode, officer_id]
    );

    // Record MPESA transaction
    const mpesaSql = `
          INSERT INTO mpesa_transactions 
            (customer_id, loan_id, amount, type, mpesa_code, status, initiated_by, created_at) 
          VALUES (?, ?, ?, 'repayment', ?, 'completed', ?, NOW())
        `;
    await connection.query(mpesaSql, [
      customerId,
      loanId,
      amount,
      mpesaCode,
      initiatedBy,
    ]);

    // Update loan status and balance
    await updateLoanStatus(loanId, connection);

    res.status(200).json({
      message: "Repayment created successfully",
    });
  } catch (err) {
    console.error("Error updating repayment:", err);
    res.status(500).json({ error: "Error updating repayment" });
  }
});

// Resolve repayment
router.delete("/:id", async (req, res) => {
  try {
    await connection.query("DELETE FROM repayments WHERE id = ?", [
      req.params.id,
    ]);

    res.status(200).json({
      message: "Repayment deleted successfully",
    });
  } catch (err) {
    //await connection.rollback();
    console.error("Error deleting repayment:", err);
    res.status(500).json({ error: "Error deleting repayment" });
  }
});

// Run default checks daily (call this from a cron job)
router.post("/check-defaults", async (req, res) => {
  try {
    const loans = await checkLoanDefaults(connection);

    res.status(200).json({
      message: `Default check completed successfully and found ${loans.length} default(s)`,
      defaults: loans,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error checking loan defaults", error: err.message });
  }
});

// Run missed payments checks daily
router.post("/check-missed-payments", async (req, res) => {
  try {
    await checkMissedPayments(connection); // Call the function from loanService
    res
      .status(200)
      .json({ message: "Missed payments check completed successfully" });
  } catch (err) {
    console.error("Error checking missed payments:", err);
    res
      .status(500)
      .json({ error: "Error checking missed payments", details: err.message });
  }
});


module.exports = router;
