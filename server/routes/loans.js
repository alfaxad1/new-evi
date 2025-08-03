const express = require("express");
const connection = require("../config/dbConnection");
const { body, validationResult } = require("express-validator");
const { authorizeRoles } = require("../middleware/roleMiddleware.js");

const router = express.Router();
router.use(express.json());

// Validation middleware
const validateLoanData = [
  body("applicationId").isInt().withMessage("Valid application ID required"),
  body("customerId").isInt().withMessage("Valid customer ID required"),
  body("officerId").isInt().withMessage("Valid officer ID required"),
  body("principal")
    .isFloat({ min: 1000 })
    .withMessage("Principal must be at least 1000"),
  body("totalInterest")
    .isFloat({ min: 0 })
    .withMessage("Interest must be positive"),
  body("totalAmount")
    .isFloat({ min: 0 })
    .withMessage("Total amount must be positive"),
  body("disbursementDate").isISO8601().withMessage("Invalid disbursement date"),
  body("dueDate").isISO8601().withMessage("Invalid due date"),
  body("status")
    .isIn(["active", "paid", "defaulted", "partially_paid"])
    .withMessage("Invalid status"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

// Get detailed loan information
router.get("/loan-details", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.purpose, 
        l.disbursement_date,
        l.due_date,
        l.expected_completion_date,
        l.installment_amount,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.arrears,
        l.installments_sum,
        l.status,
        l.processing_fee,
        (SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid') as paid_amount,
        IFNULL(
          l.remaining_balance, 
          (l.total_amount - IFNULL((SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid'), 0))
        ) as remaining_balance,
        DATEDIFF(l.expected_completion_date, CURDATE()) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id 
    `;

    const whereClauses = [];
    const queryParams = [];

    // Filter by officer_id if the user is an officer
    if (role === "officer") {
      whereClauses.push("l.officer_id = ?");
      queryParams.push(officerId);
    }

    // Add status filter for active and partially paid loans
    whereClauses.push("l.status IN ('active', 'partially_paid')");

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countResult[0].total;

    // Add pagination and sorting
    const finalQuery = `${baseQuery} ORDER BY l.disbursement_date DESC LIMIT ? OFFSET ?`;
    const [loans] = await connection.query(finalQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching loan details:", err);
    res.status(500).json({ error: "Failed to retrieve loan details" });
  }
});

//with status paid
router.get("/loan-details/paid", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query; // Get officerId, role, page, and limit from query parameters
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        l.id,
        c.id AS customer_id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.disbursement_date,
        l.due_date,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.status,
        (SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid') as paid_amount
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
    `;

    const whereClauses = [];
    const queryParams = [];

    // Filter by officer_id if the user is an officer
    if (role === "officer") {
      whereClauses.push("l.officer_id = ?");
      queryParams.push(officerId);
    }

    // Add status filter for paid loans
    whereClauses.push("l.status = 'paid'");

    if (whereClauses.length > 0) {
      baseQuery += ` WHERE ${whereClauses.join(" AND ")}`;
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countResult[0].total;

    // Add pagination and sorting
    const finalQuery = `${baseQuery} ORDER BY l.disbursement_date DESC LIMIT ? OFFSET ?`;
    const [loans] = await connection.query(finalQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching paid loan details:", err);
    res.status(500).json({ error: "Failed to retrieve paid loan details" });
  }
});

//pending disbursement
router.get("/loan-details/pending-disbursement", async (req, res) => {
  try {
    const { officerId, role } = req.query; // Get officerId and role from query parameters

    let sql = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.purpose, -- Purpose is now stored in the loans table
        l.principal,
        l.total_interest,
        l.total_amount,
        l.status,
        l.due_date,
        DATEDIFF(l.due_date, CURDATE()) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id -- Use product_id directly from loans table
      WHERE l.status = 'pending_disbursement'
    `;

    const queryParams = [];

    // Add filtering for officer role
    if (role === "officer") {
      sql += " AND l.officer_id = ?";
      queryParams.push(officerId);
    }

    sql += " ORDER BY l.id DESC";

    const [loans] = await connection.query(sql, queryParams);

    res.status(200).json(loans);
  } catch (err) {
    console.error(
      "Error fetching loans with pending disbursement status:",
      err
    );
    res.status(500).json({
      error: "Failed to retrieve loans with pending disbursement status",
    });
  }
});

// Get monthly active loans for a specific officer with deficit and percentage
router.get("/monthly-active-loans", async (req, res) => {
  try {
    const { officerId, month, year, page = 1, limit = 5 } = req.query;

    if (!officerId || !month || !year) {
      return res.status(400).json({
        error: "Officer ID, month, and year are required",
      });
    }

    const targetAmount = 700000;

    // Query to get loans for the specified officer, month, and year
    const [loans] = await connection.query(
      `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.status,
        l.disbursement_date
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.officer_id = ? 
        AND l.status IN ('active', 'partially_paid')
        AND MONTH(l.disbursement_date) = ?
        AND YEAR(l.disbursement_date) = ?
      ORDER BY l.disbursement_date DESC
      LIMIT ?
      OFFSET ?
      `,
      [officerId, month, year, limit, (page - 1) * limit]
    );

    // Query to calculate the sum of total_amount and count of loans
    const [summary] = await connection.query(
      `
      SELECT 
        COUNT(*) as loan_count,
        SUM(l.principal) as total_amount_sum
      FROM loans l
      WHERE l.officer_id = ? 
        AND l.status IN ('active', 'partially_paid')
        AND MONTH(l.disbursement_date) = ?
        AND YEAR(l.disbursement_date) = ?
      `,
      [officerId, month, year]
    );

    const totalAmountSum = summary[0].total_amount_sum || 0; // Ensure no null values
    const loanCount = summary[0].loan_count || 0;

    // Calculate deficit and percentage
    const deficit = targetAmount - totalAmountSum;
    const percentage = ((totalAmountSum / targetAmount) * 100).toFixed(2); // Rounded to 2 decimal places

    // Calculate pagination metadata
    const totalPages = Math.ceil(loanCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.status(200).json({
      loans,
      summary: {
        loan_count: loanCount,
        total_amount_sum: totalAmountSum,
        deficit: deficit,
        percentage: `${percentage}%`,
        target_amount: targetAmount,
      },
      pagination: {
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    });
  } catch (err) {
    console.error("Error fetching monthly active loans:", err);
    res.status(500).json({ error: "Failed to retrieve monthly active loans" });
  }
});

//admin
router.get("/monthly-active-loans-admin", async (req, res) => {
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

    // Query to get all officers with their total active loans
    const [officers] = await connection.query(
      `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        COUNT(l.id) as loan_count,
        COALESCE(SUM(l.principal), 0) as total_amount_sum
      FROM users u
      LEFT JOIN loans l ON u.id = l.officer_id
      WHERE u.role = 'officer'
        AND l.status IN ('active', 'partially_paid', 'paid')
        AND MONTH(l.disbursement_date) = ?
        AND YEAR(l.disbursement_date) = ?
      GROUP BY u.id, u.first_name, u.last_name
      `,
      [month, year]
    );

    // Calculate summary
    const summary = officers.reduce(
      (acc, officer) => {
        acc.loan_count += officer.loan_count;
        acc.total_amount_sum += parseFloat(officer.total_amount_sum);
        return acc;
      },
      { loan_count: 0, total_amount_sum: 0 }
    );

    res.status(200).json({
      officers,
      summary: {
        loan_count: summary.loan_count,
        total_amount_sum: summary.total_amount_sum,
      },
    });
  } catch (err) {
    console.error("Error fetching monthly active loans for admins:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve monthly active loans for admins" });
  }
});

//disburse a loan
router.put("/disburse/:loanId", authorizeRoles(["admin"]), async (req, res) => {
  const { mpesaCode } = req.body;

  if (!mpesaCode) {
    return res.status(400).json({ error: "Mpesa code is required" });
  }

  try {
    //await connection.beginTransaction();

    // 1. Fetch the customer_id and total_amount associated with the loan
    const [loan] = await connection.query(
      "SELECT customer_id, total_amount, officer_id FROM loans WHERE id = ? AND status = 'pending_disbursement'",
      [req.params.loanId]
    );

    if (loan.length === 0) {
      //await connection.rollback();
      return res.status(400).json({
        error: "Loan not found or not in pending disbursement status",
      });
    }

    const {
      customer_id: customerId,
      total_amount: amount,
      officer_id: initiatedBy,
    } = loan[0];

    const expectedCompletionDate = new Date(applicationDate);
    expectedCompletionDate.setDate(expectedCompletionDate.getDate() + 30);
    console.log("Expected completion date:", expectedCompletionDate);

    /**
     * update the loan status to 'active' and set disbursement date to now
     * set the expected completion date to 30 days from now
     * set remaining balance to total amount
     */
    const [updateResult] = await connection.query(
      "UPDATE loans SET status = 'active', disbursement_date = NOW(),expected_completion_date = ?,  mpesa_code = ?, remaining_balance = ? WHERE id = ? AND status = 'pending_disbursement'",
      [expectedCompletionDate, mpesaCode, amount, req.params.loanId]
    );

    if (updateResult.affectedRows === 0) {
      //await connection.rollback();
      return res.status(400).json({
        error: "Failed to update loan status",
      });
    }

    // 3. Save transaction in mpesa_transactions table
    await connection.query(
      `INSERT INTO mpesa_transactions (loan_id, customer_id, amount, type, mpesa_code, status, initiated_by, created_at) 
       VALUES (?, ?, ?, 'disbursement', ?, 'completed', ?, NOW())`,
      [req.params.loanId, customerId, amount, mpesaCode, initiatedBy]
    );

    //await connection.commit();
    res.status(200).json({ message: "Loan disbursed successfully" });
  } catch (err) {
    //await connection.rollback();
    console.error("Error disbursing loan:", err);
    res.status(500).json({ error: "Failed to disburse loan" });
  }
});

// Get loan by ID with full details
router.get("/:id", async (req, res) => {
  try {
    const [loan] = await connection.query(
      `
      SELECT 
        l.*,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.phone as customer_phone,
        c.national_id,
        CONCAT(u.first_name, ' ', u.last_name) AS officer_name,
        lp.name as product_name,
        lp.interest_rate,
        la.purpose,
        (SELECT COUNT(*) FROM repayments WHERE loan_id = l.id) as repayment_count,
        (SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid') as total_paid,
        (l.total_amount - IFNULL((SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid'), 0)) as remaining_balance
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN users u ON l.officer_id = u.id
      JOIN loan_applications la ON l.application_id = la.id
      JOIN loan_products lp ON la.product_id = lp.id
      WHERE l.id = ?
    `,
      [req.params.id]
    );

    if (loan.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    // Get repayment history
    const [repayments] = await connection.query(
      `
      SELECT * FROM repayments 
      WHERE loan_id = ?
      ORDER BY due_date ASC
    `,
      [req.params.id]
    );

    res.status(200).json({
      ...loan[0],
      repayments,
    });
  } catch (err) {
    console.error("Error getting loan:", err);
    res.status(500).json({ error: "Failed to retrieve loan" });
  }
});

// Create a new loan
router.post("/", validateLoanData, async (req, res) => {
  try {
    const {
      applicationId,
      customerId,
      officerId,
      principal,
      totalInterest,
      totalAmount,
      disbursementDate,
      dueDate,
      status,
      mpesaCode,
    } = req.body;

    // Verify application exists
    const [application] = await connection.query(
      "SELECT id FROM loan_applications WHERE id = ?",
      [applicationId]
    );
    if (application.length === 0) {
      return res.status(404).json({ error: "Loan application not found" });
    }

    // Verify customer exists
    const [customer] = await connection.query(
      "SELECT id FROM customers WHERE id = ?",
      [customerId]
    );
    if (customer.length === 0) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Verify officer exists
    const [officer] = await connection.query(
      "SELECT id FROM users WHERE id = ? AND role = 'officer'",
      [officerId]
    );
    if (officer.length === 0) {
      return res.status(404).json({ error: "Loan officer not found" });
    }
    console.log("Loan officer:", officerId);

    // Create loan record
    const [result] = await connection.query(
      `INSERT INTO loans 
      (application_id, customer_id, officer_id, principal, total_interest, total_amount, disbursement_date, due_date, status, mpesa_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationId,
        customerId,
        officerId,
        principal,
        totalInterest,
        totalAmount,
        disbursementDate,
        dueDate,
        status,
        mpesaCode,
      ]
    );

    // Record M-Pesa transaction if applicable
    if (mpesaCode) {
      await connection.query(
        `INSERT INTO mpesa_transactions 
        (loan_id, amount, type, mpesa_code, status, timestamp)
        VALUES (?, ?, 'disbursement', ?, 'completed', NOW())`,
        [result.insertId, principal, mpesaCode]
      );
    }

    res.status(201).json({
      message: "Loan created successfully",
      loanId: result.insertId,
    });
  } catch (err) {
    console.error("Error creating loan:", err);
    res.status(500).json({ error: "Failed to create loan" });
  }
});

//roll-over loan
router.post("/roll-over/:loanId", async (req, res) => {
  const { loanId } = req.params;

  try {
    //1.fetch the loan details
    const [loan] = await connection.query(
      `SELECT * FROM loans WHERE id = ? AND 
          status IN('active', 'partially_paid', 'defaulted') AND 
          (total_amount - remaining_balance) > total_interest AND
          rolled_over = 0 AND 
          DATE(expected_completion_date) = CURRENT_DATE() OR
          expected_completion_date < CURDATE()`,
      [loanId]
    );

    if (loan.length === 0) {
      return res
        .status(404)
        .json({ error: "Loan not found or not eligible for roll-over" });
    }
    //2.change the loan status to 'active'
    await connection.query(
      `UPDATE loans SET 
          status = 'active', 
          arrears = 0.00,
          rolled_over = 1,
          expected_completion_date = DATE_ADD(CURRENT_DATE(), INTERVAL 30 DAY),
          due_date = DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY)  
        WHERE id = ?`,
      [loanId]
    );
    //3.create a rolled_over record in the rolled_over_loans table
    await connection.query(
      `INSERT INTO ROLLED_OVER_LOANS 
          (PREV_LOAN_ID, PREV_PRINCIPAL, BAL_AT_ROLLOVER, PREV_TOTAL_AMOUNT, PREV_APPL_DATE, PREV_EXP_COMPL_DATE, ROLLOVER_DATE) 
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_DATE())`,
      [
        loan[0].id,
        loan[0].principal,
        loan[0].remaining_balance,
        loan[0].total_amount,
        loan[0].application_date,
        loan[0].expected_completion_date,
      ]
    );
    res.status(200).json({ message: "Loan rolled over successfully" });
  } catch (err) {
    console.error("Error rolling over:", err);
    res.status(500).json({ error: "Failed to roll over" });
  }
});

// Update loan information
router.put("/:id", validateLoanData, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      applicationId,
      customerId,
      officerId,
      principal,
      totalInterest,
      totalAmount,
      disbursementDate,
      dueDate,
      status,
      mpesaCode,
    } = req.body;

    // Verify loan exists
    const [existing] = await connection.query(
      "SELECT id FROM loans WHERE id = ?",
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: "Loan not found" });
    }

    await connection.query(
      `UPDATE loans SET 
        application_id = ?,
        customer_id = ?,
        officer_id = ?,
        principal = ?,
        total_interest = ?,
        total_amount = ?,
        disbursement_date = ?,
        due_date = ?,
        status = ?,
        mpesa_code = ?
      WHERE id = ?`,
      [
        applicationId,
        customerId,
        officerId,
        principal,
        totalInterest,
        totalAmount,
        disbursementDate,
        dueDate,
        status,
        mpesaCode,
        id,
      ]
    );

    res.status(200).json({
      message: "Loan updated successfully",
    });
  } catch (err) {
    console.error("Error updating loan:", err);
    res.status(500).json({ error: "Failed to update loan" });
  }
});

//loans due today
router.get("/loan-details/due-today", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.principal,
        l.total_interest,
        l.remaining_balance,
        l.total_amount,
        l.due_date,
        l.expected_completion_date,
        DATEDIFF(l.expected_completion_date, ?) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE DATE(l.expected_completion_date) = CURRENT_DATE() AND l.status IN ('active', 'partially_paid')
    `;

    const params = [new Date()];

    console.log("date: ", new Date());

    if (role === "officer") {
      sql += ` AND l.officer_id = ?`;
      params.push(officerId);
    }

    sql += ` ORDER BY l.due_date ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const [loans] = await connection.query(sql, params);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    console.error("Error fetching loans due today:", err);
    res.status(500).json({ error: "Failed to retrieve loans due today" });
  }
});

//loans due tommorrow
router.get("/loan-details/due-tomorrow", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.remaining_balance,
        l.due_date,
        l.expected_completion_date,
        DATEDIFF(l.expected_completion_date, CURRENT_DATE()) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE DATE(l.expected_completion_date) = DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY) AND l.status IN ('active', 'partially_paid')
    `;

    const whereClauses = [];
    const queryParams = [];

    // Role-based filtering
    if (role === "officer") {
      whereClauses.push("l.officer_id = ?");
      queryParams.push(officerId);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` AND ${whereClauses.join(" AND ")}`;
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countResult[0].total;

    // Add pagination
    const finalQuery = `${baseQuery} ORDER BY l.due_date ASC LIMIT ? OFFSET ?`;
    const [loans] = await connection.query(finalQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching loans due tomorrow:", err);
    res.status(500).json({ error: "Failed to retrieve loans due tomorrow" });
  }
});

//loans due 2-7 days
router.get("/loan-details/due-2-7-days", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.remaining_balance,
        l.due_date,
        l.expected_completion_date,
        DATEDIFF(l.expected_completion_date, CURRENT_DATE()) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE DATE(l.expected_completion_date) BETWEEN DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY) AND DATE_ADD(CURRENT_DATE(), INTERVAL 7 DAY)
        AND l.status IN ('active', 'partially_paid')
    `;

    const whereClauses = [];
    const queryParams = [];

    // Role-based filtering
    if (role === "officer") {
      whereClauses.push("l.officer_id = ?");
      queryParams.push(officerId);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` AND ${whereClauses.join(" AND ")}`;
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countResult[0].total;

    // Add pagination
    const finalQuery = `${baseQuery} ORDER BY l.due_date ASC LIMIT ? OFFSET ?`;
    const [loans] = await connection.query(finalQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching loans due in 2-7 days:", err);
    res.status(500).json({ error: "Failed to retrieve loans due in 2-7 days" });
  }
});

//get total disbusrsed loans for an officer on the current day
router.get("/loan-details/disbursed-amount", async (req, res) => {
  try {
    const { officerId } = req.query;

    const [officer] = await connection.query(
      "SELECT id FROM users WHERE id = ? AND role = 'officer'",
      [officerId]
    );
    if (officer.length === 0) {
      return res.status(404).json({ error: "Loan officer not found" });
    }

    const sql = `
      SELECT 
        SUM(l.principal) as total_disbursed_amount
      FROM loans l
      WHERE l.officer_id = ?
        AND (l.status = 'active' OR l.status = 'partially_paid')
        AND DATE(l.created_at) = CURDATE()
    `;

    const [result] = await connection.query(sql, [officerId]);

    res.status(200).json({
      total_disbursed_amount: result[0].total_disbursed_amount,
    });
  } catch (err) {
    console.error("Error fetching officer disbursed amount:", err);
    res
      .status(500)
      .json({ error: "Failed to retrieve officer disbursed amount" });
  }
});

//defaulted loans
router.get("/loan-details/defaulted", async (req, res) => {
  try {
    const { officerId, role, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let baseQuery = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.due_date,
        l.status,
        l.default_date,
        l.remaining_balance,
        l.expected_completion_date,
        DATEDIFF(CURDATE(), l.expected_completion_date) as days_overdue
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id
      WHERE l.status = 'defaulted'
    `;

    const whereClauses = [];
    const queryParams = [];

    // Add officer-based filtering
    if (role === "officer") {
      whereClauses.push("l.officer_id = ?");
      queryParams.push(officerId);
    }

    if (whereClauses.length > 0) {
      baseQuery += ` AND ${whereClauses.join(" AND ")}`;
    }

    // Get total count
    const [countResult] = await connection.query(
      `SELECT COUNT(*) as total FROM (${baseQuery}) as count_query`,
      queryParams
    );
    const total = countResult[0].total;

    // Add pagination
    const finalQuery = `${baseQuery} ORDER BY l.default_date ASC LIMIT ? OFFSET ?`;
    const [loans] = await connection.query(finalQuery, [
      ...queryParams,
      parseInt(limit),
      offset,
    ]);

    res.status(200).json({
      data: loans,
      meta: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching defaulted loans:", err);
    res.status(500).json({ error: "Failed to retrieve defaulted loans" });
  }
});

//get counts
router.get("/loan/counts", async (req, res) => {
  try {
    const { officerId, role } = req.query;

    // Dynamically construct the officer filter
    const officerFilter =
      role === "officer" ? `AND l.officer_id = '${officerId}'` : "";

    // Query to get counts for each category
    const [counts] = await connection.query(
      `
      SELECT 
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE DATE(l.expected_completion_date) = CURRENT_DATE() 
           AND l.status IN ('active', 'partially_paid') 
           ${officerFilter}) AS loans_due_today,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE DATE(l.expected_completion_date) = DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY) 
           AND l.status IN ('active', 'partially_paid') 
           ${officerFilter}) AS loans_due_tomorrow,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE DATE(l.expected_completion_date) BETWEEN DATE_ADD(CURRENT_DATE(), INTERVAL 2 DAY) AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
           AND l.status IN ('active', 'partially_paid') 
           ${officerFilter}) AS loans_due_2_7_days,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE l.status = 'defaulted' 
           ${officerFilter}) AS defaulted_loans,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE l.status = 'pending_disbursement' 
           ${officerFilter}) AS pending_disbursement_loans,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE l.status IN ('active', 'partially_paid') 
           ${officerFilter}) AS active_loans,
        (SELECT COUNT(*) 
         FROM loans l 
         WHERE l.approval_status = 'pending' 
           ${officerFilter}) AS pending_loan_applications,
        (SELECT COUNT(*) 
         FROM loan_applications la 
         WHERE la.status = 'rejected' 
           ${
             role === "officer" ? `AND la.officer_id = '${officerId}'` : ""
           }) AS rejected_loan_applications
      `
    );

    res.status(200).json(counts[0]); // Return the counts as a single object
  } catch (err) {
    console.error("Error fetching loan counts:", err);
    res.status(500).json({ error: "Failed to retrieve loan counts" });
  }
});

// Get detailed loan information by id
router.get("/loan-details/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const baseQuery = `
      SELECT 
        l.id,
        CONCAT(c.first_name, ' ', c.last_name) AS customer_name,
        c.national_id,
        c.phone,
        lp.name AS loan_product,
        l.purpose, 
        l.disbursement_date,
        l.due_date,
        l.expected_completion_date,
        l.installment_amount,
        l.principal,
        l.total_interest,
        l.total_amount,
        l.arrears,
        l.installments_sum,
        l.status,
        l.processing_fee,
        (SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid') as paid_amount,
        IFNULL(
          l.remaining_balance, 
          (l.total_amount - IFNULL((SELECT SUM(amount) FROM repayments WHERE loan_id = l.id AND status = 'paid'), 0))
        ) as remaining_balance,
        DATEDIFF(l.expected_completion_date, CURDATE()) as days_remaining
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_products lp ON l.product_id = lp.id 
      WHERE l.id = ?
    `;

    const [loan] = await connection.query(baseQuery, [id]);

    if (!loan.length) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    res.status(200).json(loan[0]);
  } catch (err) {
    console.error("Error fetching loan details:", err);
    res.status(500).json({ error: "Failed to retrieve loan details" });
  }
});

module.exports = router;
