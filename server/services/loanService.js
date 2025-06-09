const calculateRemainingBalance = async (loanId, connection) => {
  const [results] = await connection.query(
    `
      SELECT 
        l.total_amount,
        IFNULL(SUM(r.amount), 0) as total_paid
      FROM loans l
      LEFT JOIN repayments r ON r.loan_id = l.id AND r.status = 'paid'
      WHERE l.id = ?
      GROUP BY l.id
    `,
    [loanId]
  );

  if (results.length === 0) return 0;

  const { total_amount, total_paid } = results[0];
  return total_amount - total_paid;
};

const checkLoanDefaults = async (connection) => {
  try {
    // Find loans past their expected completion date
    const [defaultedLoans] = await connection.query(`
      SELECT 
      l.id, 
      l.total_amount, 
      l.remaining_balance, 
      CONCAT(c.first_name, ' ', c.last_name) AS customer_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id 
      WHERE status IN ('active', 'partially_paid') 
      AND expected_completion_date < CURDATE()
    `);

    // Mark loans as defaulted
    for (const loan of defaultedLoans) {
      await connection.query(
        `UPDATE loans 
        SET status = 'defaulted', 
        default_date = NOW() 
        WHERE id = ?`,
        [loan.id]
      );
    }

    return defaultedLoans;
  } catch (err) {
    console.error("Error checking loan defaults:", err);
    throw err;
  }
};

const updateLoanStatus = async (loanId, connection) => {
  try {
    // Get loan details
    const [loan] = await connection.query("SELECT * FROM loans WHERE id = ?", [
      loanId,
    ]);

    console.log("loan ID", loanId);

    if (loan.length === 0) {
      throw new Error("Loan not found");
    }

    const { total_amount, due_date, arrears } = loan[0];

    // Calculate installments sum
    const [installments] = await connection.query(
      "SELECT IFNULL(SUM(amount), 0) as installments_sum FROM repayments WHERE loan_id = ? AND status = 'paid'",
      [loanId]
    );

    const installmentsSum = installments[0].installments_sum;

    // Calculate remaining balance
    const remainingBalance = total_amount - installmentsSum;

    // Determine new loan status
    let newStatus = loan[0].status;
    let newArrears = arrears;

    console.log("Total amount: ", total_amount);
    console.log("Installments sum: ", installmentsSum);
    console.log("Remaining balance: ", remainingBalance);
    console.log("Arrears: ", arrears);

    if (remainingBalance <= 0) {
      newStatus = "paid";
      newArrears = 0;
    } else if (installmentsSum > 0 && installmentsSum < total_amount) {
      newStatus = "partially_paid";
    } else if (new Date(due_date) < new Date() && arrears > 0) {
      newStatus = "defaulted";
    } else {
      newStatus = "active";
    }
    // Update loan record
    await connection.query(
      `UPDATE loans 
      SET installments_sum = ?, 
          remaining_balance = ?, 
          arrears = ?, 
          status = ? 
      WHERE id = ?`,
      [installmentsSum, remainingBalance, newArrears, newStatus, loanId]
    );
  } catch (err) {
    console.error("Error updating loan status:", err);
    throw err;
  }
};

const checkMissedPayments = async (connection) => {
  try {
    // Find loans with missed payments
    const [missedLoans] = await connection.query(`
      SELECT 
        id, 
        installment_amount, 
        installment_type, 
        due_date, 
        IFNULL(arrears, 0) AS arrears
      FROM loans 
      WHERE status IN ('active', 'partially_paid') 
      AND due_date < CURDATE()
    `);

    for (const loan of missedLoans) {
      const { id, installment_amount, installment_type, due_date, arrears } =
        loan;

      // Ensure arrears and installment_amount are numbers
      const numericArrears = parseFloat(arrears) || 0;
      const numericInstallmentAmount = parseFloat(installment_amount) || 0;

      // Add missed installment to arrears
      const newArrears = numericArrears + numericInstallmentAmount;

      // Calculate the next due date
      let nextDueDate = new Date(due_date);
      if (installment_type === "daily") {
        nextDueDate.setDate(nextDueDate.getDate() + 1);
      } else if (installment_type === "weekly") {
        nextDueDate.setDate(nextDueDate.getDate() + 7);
      }

      // Update loan record
      await connection.query(
        `UPDATE loans 
        SET arrears = ?, 
            due_date = ? 
        WHERE id = ?`,
        [newArrears, nextDueDate, id]
      );
    }
  } catch (err) {
    console.error("Error checking missed payments:", err);
    throw err;
  }
};

module.exports = {
  calculateRemainingBalance,
  checkLoanDefaults,
  updateLoanStatus,
  checkMissedPayments,
};
