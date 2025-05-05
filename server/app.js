const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
//const __dirname = path.resolve();

const corsOptions = {
  origin: "https://app.eviltd.co.ke", // Replace with the URL you want to whitelist
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  credentials: true, // Allow credentials (e.g., cookies, auth headers)
};

// Middlewares
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

app.use("/api/users", users);
app.use("/api/customers", customers);
app.use("/api/loanProducts", loanProducts);
app.use("/api/loansApplication", loansApplication);
app.use("/api/loans", loans);
app.use("/api/repayments", repayments);
app.use("/api/transactions", transactions);
app.use("/api/customerNew", customerRoutes);

app.get("/", (req, res) => {
  res.send(
    "Welcome to Eviltd System API. Visit /api/... for specific endpoints."
  );
});

// Server
const PORT = process.env.PORT || 3000;
const appName = process.env.APP_NAME || "My App";

app.listen(PORT, () => {
  console.log(`${appName} is running on port ${PORT}`);
});
