app.post("http://localhost:8000/api/payment/bank-callback", (req, res) => {
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

    if (!Narration) {
      res
        .status(500)
        .json({ message: "Narration is missing from the payload" });
    }

    const phoneMatch = Narration.match(/2547\d{8}/);
    const phoneNumber = phoneMatch ? phoneMatch[0] : "Not found";

    req.body.phoneNumber = phoneNumber;

    // Logging all data for test purpose
    console.log("======= Bank Callback Data Received =======");
    console.log("Account Number:", AcctNo);
    console.log("Amount:", Amount);
    console.log("Booked Balance:", BookedBalance);
    console.log("Cleared Balance:", ClearedBalance);
    console.log("Currency:", Currency);
    console.log("Customer Memo Line 1:", CustMemoLine1);
    console.log("Customer Memo Line 2:", CustMemoLine2);
    console.log("Customer Memo Line 3:", CustMemoLine3);
    console.log("Event Type:", EventType);
    console.log("Exchange Rate:", ExchangeRate);
    console.log("Narration:", Narration);
    console.log("Extracted Phone Number:", phoneNumber);
    console.log("Payment Reference:", PaymentRef);
    console.log("Posting Date:", PostingDate);
    console.log("Value Date:", ValueDate);
    console.log("Transaction Date:", TransactionDate);
    console.log("Transaction ID:", TransactionId);
    console.log("===========================================");

    return res.status(200).json({
      MessageCode: "200",
      Message: "Successfully received data",
    });

    processPayment(req.body);
  } catch (error) {
    console.error("Error handling callback:", error.message);

    return res.status(400).json({
      MessageCode: "400",
      Message: "Failed to process callback",
      Error: error.message,
    });
  }
});

const processPayment = async (paymentData) => {
  console.log("Processing payment data:", paymentData);

  const [loans] = connection.query(
    `SELECT * FROM loans WHERE status = 'active' OR status = 'partially_paid'`
  );

  console.log("Loans:", loans[0]);

  if (paymentData.phoneNumber === loans[0].phone_number) {
    console.log("Payment processed successfully");

    let newArrears = arrears || 0;
    let nextDueDate = new Date(due_date);

    // Check if payment is sufficient
    if (amount < loans[0].installment_amount) {
      newArrears += loans[0].installment_amount - amount; // Add shortfall to arrears
    } else if (amount > loans[0].installment_amount) {
      newArrears -= amount - loans[0].installment_amount; // Reduce arrears if overpaid
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
        amount,
        nextDueDate,
        paymentData.TransactionId,
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
        loans[0].loan_id,
        paymentData.Amount,
        paymentData.TransactionId,
        loans[0].officer_id,
      ]);
    }

    // Update loan status and balance
    await updateLoanStatus(loanId, connection);

    res.status(200).json({ message: "Repayment recorded successfully" });
  } else {
    console.log("Payment not processed");
  }
};
