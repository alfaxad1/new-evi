const express = require("express");
const connection = require("../config/dbConnection");
const { updateLoanStatus } = require("./loanService");
const basicAuth = require("../middleware/auth");

const repaymentService = (io) => {
  const router = express.Router();
  router.use(express.json());

  router.post("/account-credit-notification", basicAuth, async (req, res) => {
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
        return res
          .status(400)
          .json({ message: "Narration is missing from the payload" });
      }

      const phoneMatch = Narration.match(/2547\d{8}/);
      const phoneNumber = phoneMatch ? phoneMatch[0] : "Not found";
      const mpesaCode = Narration.split("~")[0] || " ";

      const payment = {
        amount: req.body.Amount,
        paidDate: req.body.PostingDate,
        phoneNumber: phoneNumber,
        mpesaCode: mpesaCode,
      };

      io.emit("paymentReceived", payment);

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
      `SELECT * FROM loans WHERE status IN ('active', 'partially_paid', 'defaulted') AND phone_number = ? ORDER BY id DESC LIMIT 1`,
      [paymentData.phoneNumber]
    );

    if (!loans || loans.length === 0) {
      console.log(
        "No matching loan found for phone number:",
        paymentData.phoneNumber
      );
      return;
    }

    const loanId = loans[0].id;

    console.log("Payment processed successfully");

    let newArrears = loans[0].arrears || 0;
    let nextDueDate = new Date(loans[0].due_date);

    if (paymentData.Amount < loans[0].installment_amount) {
      newArrears += loans[0].installment_amount - paymentData.Amount;
    } else if (paymentData.Amount > loans[0].installment_amount) {
      newArrears -= paymentData.Amount - loans[0].installment_amount;
    }

    if (loans[0].installment_type === "daily") {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else if (loans[0].installment_type === "weekly") {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }

    await connection.query(
      `UPDATE loans 
       SET arrears = ?, due_date = ? 
       WHERE id = ? AND phone_number = ? AND status IN ('active', 'partially_paid', 'defaulted')`,
      [newArrears, nextDueDate, loanId, paymentData.phoneNumber]
    );

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

    if (paymentData.mpesaCode) {
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

    await updateLoanStatus(loanId, connection);
  };

  return router;
};

module.exports = repaymentService;
