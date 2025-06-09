const express = require("express");
const connection = require("../config/dbConnection");
const { updateLoanStatus } = require("./loanService");
const basicAuth = require("../middleware/auth");

const router = express.Router();
router.use(express.json());

router.post("/account-credit-notification", basicAuth, async (req, res) => {
  let Amt;

  if (req.body.Amount <= 200) {
    Amt = parseInt(req.body.Amount);
  } else {
    const reqAmt = (parseInt(req.body.Amount) * 100.55) / 100;
    Amt = Math.round(reqAmt);
  }

  const time = req.body.Narration.split("~")[4];
  const paymentName = req.body.Narration.split("~")[3];

  console.log("Amt", Amt);
  console.log("time", time);

  await connection.query(
    `INSERT INTO repayment_requests (time, data, customer_name, amount) VALUES (?, ?, ?, ?)`,
    [time, JSON.stringify(req.body), paymentName, Amt]
  );

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

    req.body.phoneNumber = phoneNumber;
    req.body.mpesaCode = mpesaCode;

    await processPayment(req.body);

    return res.status(200).json({
      MessageCode: "200",
      Message: "Successfully received data",
    });
  } catch (error) {
    console.error("Error handling callback:", error);
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

  if (loans[0]) {
    const loanId = loans[0].id;

    console.log("Payment processed successfully");

    let newArrears = loans[0].arrears || 0;
    let nextDueDate = new Date(loans[0].due_date);

    let actualAmount = parseFloat(paymentData.Amount);
    const amount = parseFloat(paymentData.Amount);

    if (actualAmount <= 200) {
      actualAmount = amount;
    } else {
      actualAmount = Math.round(amount + (amount * 0.55) / 100);
    }
    console.log("Amount(payment data)", amount);
    console.log("actualAmount", actualAmount);

    if (actualAmount < loans[0].installment_amount) {
      newArrears += loans[0].installment_amount - actualAmount;
    } else if (actualAmount > loans[0].installment_amount) {
      newArrears -= actualAmount - loans[0].installment_amount;
    }

    if (loans[0].installment_type === "daily") {
      nextDueDate.setDate(nextDueDate.getDate() + 1);
    } else if (loans[0].installment_type === "weekly") {
      nextDueDate.setDate(nextDueDate.getDate() + 7);
    }

    const paymentDate = paymentData.Narration.split("~")[4];

    await connection.query(
      `UPDATE loans 
       SET arrears = ?, due_date = ? 
       WHERE id = ? AND phone_number = ? AND status IN ('active', 'partially_paid', 'defaulted')`,
      [newArrears, nextDueDate, loanId, paymentData.phoneNumber]
    );

    await connection.query(
      `INSERT INTO repayments (loan_id, amount, due_date, paid_date, status, mpesa_code, phone_number, payment_name, created_by, created_at) 
       VALUES (?, ?, ?, ?, 'paid', ?, ?, ?, ?, NOW())`,
      [
        loanId,
        actualAmount,
        nextDueDate,
        paymentDate,
        paymentData.mpesaCode,
        paymentData.Narration.split("~")[2],
        paymentData.Narration.split("~")[3],
        loans[0].officer_id,
      ]
    );

    if (paymentData.mpesaCode) {
      const transactionSql = `
        INSERT INTO mpesa_transactions 
          (customer_id, loan_id, amount, type, mpesa_code, status, initiated_by, created_at) 
        VALUES (?, ?, ?, 'repayment', ?, 'completed', ?, ?)
      `;
      await connection.query(transactionSql, [
        loans[0].customer_id,
        loanId,
        actualAmount,
        paymentData.mpesaCode,
        loans[0].officer_id,
        paymentDate,
      ]);
    }

    await updateLoanStatus(loanId, connection);
  } else {
    console.log(
      "No matching loan found for phone number:",
      paymentData.phoneNumber
    );

    await connection.query(
      `INSERT INTO repayments (loan_id, amount, due_date, paid_date, status, mpesa_code, phone_number, payment_name, created_by, created_at) 
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?, NOW())`,
      [
        null,
        paymentData.Amount,
        null,
        paymentData.Narration.split("~")[4],
        paymentData.mpesaCode,
        paymentData.Narration.split("~")[2],
        paymentData.Narration.split("~")[3],
        null,
      ]
    );
  }
};

module.exports = router;
