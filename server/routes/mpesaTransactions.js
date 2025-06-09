const express = require("express");
const connection = require("../config/dbConnection");

const router = express.Router();
router.use(express.json());

// Get all transactions
router.get("/", (req, res) => {
  const sql = "SELECT * FROM mpesa_transactions";
  connection.query(sql, (err, result) => {
    if (err)
      return res.status(500).json({ error: "error getting transactions" });
    res.status(200).json(result);
  });
});

// Get a transaction by ID
router.get("/:id", (req, res) => {
  const sql = "SELECT * FROM mpesa_transactions WHERE id = ?";
  connection.query(sql, [req.params.id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "error getting transaction" });
    res.status(200).json(result);
  });
});

// Create a new transaction
router.post("/", (req, res) => {
  const { customerId, loanId, amount, type, mpesaCode, status, initiatedBy } =
    req.body;
  const sql =
    "INSERT INTO mpesa_transactions (customer_id, loan_id, amount, type, mpesa_code, status, initiated_by) VALUES (?, ?, ?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [customerId, loanId, amount, type, mpesaCode, status, initiatedBy],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ error: "error creating transaction", err });
      res.status(200).json({ message: "transaction created successfully" });
    }
  );
});

// Update a transaction
router.put("/:id", (req, res) => {
  const { customerId, loanId, amount, type, mpesaCode, status, initiatedBy } =
    req.body;
  const sql =
    "UPDATE mpesa_transactions SET customer_id = ?, loan_id = ?, amount = ?, type = ?, mpesa_code = ?, status = ?, initiated_by = ? WHERE id = ?";
  connection.query(
    sql,
    [
      customerId,
      loanId,
      amount,
      type,
      mpesaCode,
      status,
      initiatedBy,
      req.params.id,
    ],
    (err, result) => {
      if (err)
        return res
          .status(500)
          .json({ error: "error updating transaction", err });
      res.status(200).json({ message: "transaction updated successfully" });
    }
  );
});

// Delete a transaction by ID
router.delete("/:id", (req, res) => {
  const sql = "DELETE FROM mpesa_transactions WHERE id = ?";
  connection.query(sql, [req.params.id], (err, result) => {
    if (err)
      return res.status(500).json({ error: "error deleting transaction" });
    res.status(200).json({ message: "transaction deleted successfully" });
  });
});

module.exports = router;
