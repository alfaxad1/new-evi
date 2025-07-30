const cron = require("node-cron");
const { checkMissedPayments, checkLoanDefaults } = require("./loanService");
const connection = require("../config/dbConnection");

function setupCronJobs(connection) {
  // Cron job for checkMissedPayments
  cron.schedule(
    "0 0 0,12 * * *",
    async () => {
      try {
        console.log(
          `Running missed payments check at ${new Date().toLocaleString(
            "en-US",
            { timeZone: "Africa/Nairobi" }
          )}`
        );
        await checkMissedPayments(connection);
        console.log("Missed payments check completed successfully");
      } catch (err) {
        console.error("Error in scheduled missed payments check:", err);
      }
    },
    {
      timezone: "Africa/Nairobi",
    }
  );

  // Cron job for checkLoanDefaults
  cron.schedule(
    "0 0 0,12 * * *",
    async () => {
      try {
        console.log(
          `Running loan defaults check at ${new Date().toLocaleString("en-US", {
            timeZone: "Africa/Nairobi",
          })}`
        );
        const loans = await checkLoanDefaults(connection);
        console.log(
          `Loan defaults check completed successfully and found ${loans.length} default(s)`
        );
      } catch (err) {
        console.error("Error in scheduled loan defaults check:", err);
      }
    },
    {
      timezone: "Africa/Nairobi",
    }
  );
}

module.exports = { setupCronJobs };
