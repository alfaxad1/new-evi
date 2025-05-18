const express = require("express");
const connection = require("../config/dbConnection");
const { updateLoanStatus } = require("./loanService");

const router = express.Router();
router.use(express.json());

router.post("/bank-callback", async (req, res) => {
  try {
    const {
      AcctNo,
      Amount,
      BookedBalance,
      ClearedBalance,
      Currency,
      CustMemoLine1,
      CustMemoLine2,
      CustMemoLine3,
      EventType,
      ExchangeRate,
      Narration,
      PaymentRef,
      PostingDate,
      ValueDate,
      TransactionDate,
      TransactionId,
    } = req.body;

    console.log("Received payment data:", req.body);

    if (!Narration) {
      res
        .status(500)
        .json({ message: "Narration is missing from the payload" });
    }

    const phoneMatch = Narration.match(/2547\d{8}/);
    const phoneNumber = phoneMatch ? phoneMatch[0] : "Not found";

    const mpesaCode = Narration.split("~")[0] || " ";

    req.body.phoneNumber = phoneNumber;
    req.body.mpesaCode = mpesaCode;

    await processPayment(req.body);

    return res.status(200).json({
      MessageCode: "200",
      Message: "Successfully received data",
    });
  } catch (error) {
    console.error("Error handling callback:", error.message);
    return res.status(400).json({
      MessageCode: "400",
      Message: "Failed to process payment",
      Error: error.message,
    });
  }
});

const processPayment = async (paymentData) => {
  console.log("Processing payment data:", paymentData);

  const [loans] = await connection.query(
    `SELECT * FROM loans WHERE status = 'active' OR status = 'partially_paid' AND phone_number = ?`,
    [paymentData.phoneNumber]
  );

  const loanId = loans[0].id;

  if (loans[0]) {
    console.log("Payment processed successfully");

    let newArrears = loans[0].arrears || 0;
    let nextDueDate = new Date(loans[0].due_date);

    // Check if payment is sufficient
    if (paymentData.Amount < loans[0].installment_amount) {
      newArrears += loans[0].installment_amount - paymentData.Amount; // Add shortfall to arrears
    } else if (paymentData.Amount > loans[0].installment_amount) {
      newArrears -= paymentData.Amount - loans[0].installment_amount; // Reduce arrears if overpaid
    }

    // Update due date
    if (loans[0].installment_type === "daily") {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else if (loans[0].installment_type === "weekly") {
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
      [
        loanId,
        paymentData.Amount,
        nextDueDate,
        paymentData.mpesaCode,
        loans[0].officer_id,
      ]
    );

    // Record transaction if applicable
    if (paymentData.TransactionId) {
      const transactionSql = `
          INSERT INTO mpesa_transactions 
            (customer_id, loan_id, amount, type, mpesa_code, status, initiated_by, created_at) 
          VALUES (?, ?, ?, 'repayment', ?, 'completed', ?, NOW())
        `;
      await connection.query(transactionSql, [
        loans[0].customer_id,
        loanId,
        paymentData.Amount,
        paymentData.mpesaCode,
        loans[0].officer_id,
      ]);
    }

    // Update loan status and balance
    await updateLoanStatus(loanId, connection);
  } else {
    console.log("Payment not processed");
  }
};

module.exports = router;
