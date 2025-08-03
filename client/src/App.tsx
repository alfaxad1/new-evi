import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import BasicTables from "./pages/Tables/BasicTables";
import Blank from "./pages/Blank";
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Home from "./pages/Dashboard/Home";
import Customers from "./pages/DataPages/Customers";
import Loans from "./pages/DataPages/Loans";
import PendingLoans from "./pages/DataPages/PendingLoans";
import RejectedLoans from "./pages/DataPages/RejectedLoans";
import LoanApplication from "./pages/DataPages/LoanApplication";
import AuthenticatedPendingRepayments from "./pages/DataPages/PendingRepayments";
import AuthenticatedApprovedRepayments from "./pages/DataPages/ApprovedRepayments";
import { LoanProducts } from "./pages/DataPages/LoanProducts";
import { AddLoanProduct } from "./pages/DataPages/AddLoanProduct";
import CustomerNew from "./pages/DataPages/CustomerNew";
import { PaidLoans } from "./pages/DataPages/PaidLoans";
import { PendingDisbursement } from "./pages/DataPages/PendingDisbursement";
import { Defaulted } from "./pages/DataPages/Defaulted";
import { Due2To7 } from "./pages/DataPages/Due2To7";
import { DueToday } from "./pages/DataPages/DueToday";
import { DueTommorrow } from "./pages/DataPages/DueTommorrow";
import { MonthlyActiveLoans } from "./pages/DataPages/MonthlyActiveLoans";
import AuthenticatedMonthlyApprovedRepayments from "./pages/DataPages/MonthlyApprovedRepayments";
import { AllUsers } from "./pages/DataPages/AllUsers";
import { AllRepayments } from "./pages/DataPages/AllRepayments";
import { CompanyMonthlyDisbursements } from "./pages/DataPages/CompanyMonthlyDisbursements";
import { CompanyMonthlyCollections } from "./pages/DataPages/CompanyMonthlyCollections";
import CustomerDetails from "./pages/DataPages/CustomerDetails";

export default function App() {
  return (
    <>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />

          {/* Dashboard Layout */}
          <Route element={<AppLayout />}>
            <Route path="/signup" element={<SignUp />} />
            <Route index path="/" element={<Home />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />

            <Route path="/blank" element={<Blank />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />

            {/* Ui Elements */}
            {/* <Route path="/alerts" element={<Alerts />} /> */}
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/images" element={<Images />} />
            <Route path="/videos" element={<Videos />} />
            {/* Data pages */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customer-details" element={<CustomerDetails />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/all-users" element={<AllUsers />} />
            <Route path="/pending-loans" element={<PendingLoans />} />
            <Route path="/rejected-loans" element={<RejectedLoans />} />
            <Route path="/loan-application" element={<LoanApplication />} />
            <Route
              path="/pending-repayments"
              element={<AuthenticatedPendingRepayments />}
            />
            <Route
              path="/approved-repayments"
              element={<AuthenticatedApprovedRepayments />}
            />
            <Route path="/repayments" element={<AllRepayments />} />
            <Route path="/add-product" element={<AddLoanProduct />} />
            <Route path="/loan-products" element={<LoanProducts />} />
            <Route path="/register-customer" element={<CustomerNew />} />
            <Route path="/paid-loans" element={<PaidLoans />} />
            <Route
              path="/pending-disbursement"
              element={<PendingDisbursement />}
            />

            <Route path="/defaulted" element={<Defaulted />} />
            <Route path="/due-2-7" element={<Due2To7 />} />
            <Route path="/due-today" element={<DueToday />} />
            <Route path="/due-tommorrow" element={<DueTommorrow />} />
            <Route
              path="/monthly-active-loans"
              element={<MonthlyActiveLoans />}
            />
            <Route
              path="/monthly-approved-repayments"
              element={<AuthenticatedMonthlyApprovedRepayments />}
            />
            <Route
              path="/company-monthly-disbursements"
              element={<CompanyMonthlyDisbursements />}
            />

            <Route
              path="/company-monthly-collections"
              element={<CompanyMonthlyCollections />}
            />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}
