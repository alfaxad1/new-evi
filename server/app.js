const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

const corsOptions = {
  origin: "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type, Authorization",
  preflightContinue: false,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
const users = require("./routes/users");
const customers = require("./routes/customers");
const loanProducts = require("./routes/loanProducts");
const loansApplication = require("./routes/loansApplication");
const loans = require("./routes/loans");
const repayments = require("./routes/repayments");
const transactions = require("./routes/mpesaTransactions");
const customerRoutes = require("./routes/customerRoutes");
const repaymentService = require("./services/repaymentService");
const { setupCronJobs } = require("./services/scheduler");
const connection = require("./config/dbConnection");

setupCronJobs(connection);

app.use("/api/users", users);
app.use("/api/customers", customers);
app.use("/api/loanProducts", loanProducts);
app.use("/api/loansApplication", loansApplication);
app.use("/api/loans", loans);
app.use("/api/repayments", repayments);
app.use("/api/transactions", transactions);
app.use("/api/customerNew", customerRoutes);
app.use("/api/payment", repaymentService);

app.get("/", (req, res) => {
  res.send(
    "Welcome to Eviltd System API. Visit /api/... for specific endpoints."
  );
});

const PORT = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "My App";

app.listen(PORT, () => {
  console.log(`${appName} is running on port ${PORT}`);
});
