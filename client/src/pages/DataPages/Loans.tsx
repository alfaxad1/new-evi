import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../src/components/ui/table";

import withAuth from "../../utils/withAuth";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import { toast, ToastContainer } from "react-toastify";
import { ArrowLeftRight, Eye, List, Search } from "lucide-react";
import Badge from "../../components/ui/badge/Badge";
import { ClipLoader } from "react-spinners";

interface Loan {
  id: number;
  customer_name: string;
  national_id: string;
  loan_product: string;
  purpose: string;
  principal: number;
  total_amount: number;
  remaining_balance: number;
  status: string;
  due_date: string;
  expected_completion_date: string;
  days_remaining: number;
  total_interest: number;
  installment_amount: number;
  arrears: number;
  installment_sum: number;
  paid_amount: number;
  processing_fee: number;
}

interface Repayment {
  id: number;
  amount: number;
  paid_date: string;
  mpesa_code: string;
}

const Loans = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const {
    isOpen: isRepayModalOpen,
    openModal: openRepayModal,
    closeModal: closeRepayModal,
  } = useModal();
  const {
    isOpen: isViewModalOpen,
    openModal: openViewModal,
    closeModal: closeViewModal,
  } = useModal();
  const {
    isOpen: isDetailsModalOpen,
    openModal: openDetailsModal,
    closeModal: closeDetailsModal,
  } = useModal();

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [repaymentsData, setRepaymentsData] = useState<Repayment[]>([]);
  const [loansData, setLoansData] = useState<Loan[]>([]);
  const [details, setDetails] = useState<Loan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [mpesaCode, setMpesaCode] = useState<string>("");
  const [searchString, setSearchString] = useState<string>("");

  const fetchLoans = useCallback(
    async (role: string, officerId: string, page: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${apiUrl}/api/loans/loan-details?role=${role}&officerId=${officerId}&page=${page}`
        );
        console.log("Data fetched successfully:", response.data);
        setLoansData(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchLoans(role, officerId, page);
  }, [fetchLoans, role, officerId, page]);

  if (loading) {
    return (
      <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50">
        <ClipLoader color="#36D7B7" size={50} speedMultiplier={0.8} />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleRepay = (loanId: number) => {
    setSelectedLoanId(loanId);
    openRepayModal();
  };

  const repaymentData = {
    loanId: selectedLoanId,
    amount,
    mpesaCode,
    initiatedBy: officerId,
  };

  const handleSaveClick = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${apiUrl}/api/repayments/create`,
        repaymentData
      );
      console.log("Data posted successfully:", response.data);
      toast.success("Repayment saved successfully!");
      fetchLoans(role, officerId, page);
      setAmount("");
      setMpesaCode("");
    } catch (error) {
      console.error("Error posting data:", error);
    }
    closeRepayModal();
  };

  const viewRepayments = async (loanId: number) => {
    setSelectedLoanId(loanId);
    try {
      const response = await axios.get(
        `${apiUrl}/api/repayments/loan/${loanId}`
      );
      console.log("Data fetched successfully:", response.data);
      setRepaymentsData(response.data);
      openViewModal();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const viewLoanDetails = async (loanId: number) => {
    //setSelectedLoanId(loanId);
    try {
      const response = await axios.get(
        `${apiUrl}/api/loans/loan-details/${loanId}`
      );
      console.log("Data fetched successfully:", response.data);
      setDetails(response.data);
      openDetailsModal();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filteredLoans = loansData.filter((loan) => {
    return loan.customer_name
      .toLowerCase()
      .includes(searchString.toLowerCase());
  });

  return (
    <>
      <ToastContainer position="bottom-right" />

      <div className="relative mb-4">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search />
        </span>
        <input
          type="text"
          value={searchString}
          onChange={(e) => setSearchString(e.target.value)}
          placeholder="Search ..."
          className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900  dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-screen-lg mx-auto">
          <div className="w-full overflow-x-auto">
            {filteredLoans && filteredLoans.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No pending loans found.
              </div>
            ) : (
              <Table>
                {/* Table Header */}
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Customer Name
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Loan Amount
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Balance
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Due Date
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>

                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        {loan.customer_name}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.total_amount}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.remaining_balance < 0
                          ? loan.total_amount
                          : loan.remaining_balance}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <Badge
                          color={
                            loan.status === "active" ? "success" : "warning"
                          }
                        >
                          {loan.status === "partially_paid"
                            ? "partially paid"
                            : loan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.expected_completion_date
                          ? loan.expected_completion_date.split("T")[0]
                          : "N/A"}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleRepay(loan.id)}
                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="Repay"
                          >
                            <ArrowLeftRight size={16} />
                          </button>
                          <button
                            onClick={() => viewRepayments(loan.id)}
                            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                            title="Repayments"
                          >
                            <List size={16} />
                          </button>
                          <button
                            onClick={() => viewLoanDetails(loan.id)}
                            className="p-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          {/* Pagination Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              size="sm"
              className="hover:bg-gray-200 m-4"
              variant="outline"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              className="hover:bg-gray-200 m-4"
              variant="outline"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* View Repayments Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={closeViewModal}
        className="max-w-[700px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Repayments for Loan
            </h4>
          </div>
          {repaymentsData ? (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Mpesa Code
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Time
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repaymentsData.map((repayment) => (
                    <TableRow key={repayment.id}>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {repayment.amount}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {repayment.mpesa_code}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {repayment.paid_date.split(" ")[0]}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {repayment.paid_date.split(" ")[1]}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="mt-4">No repayments found for this loan.</p>
          )}
          <div className="flex justify-end mt-4">
            <Button size="sm" variant="outline" onClick={closeViewModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Repayment Modal */}
      <Modal
        isOpen={isRepayModalOpen}
        onClose={closeRepayModal}
        className="max-w-[400px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Loan Repayment
            </h4>
          </div>
          <form className="flex flex-col" onSubmit={(e) => handleSaveClick(e)}>
            <div className="custom-scrollbar h-[200px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Amount</Label>
                    <Input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Mpesa Code</Label>
                    <Input
                      type="text"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeRepayModal}>
                Close
              </Button>
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        className="max-w-[400px] m-4"
      >
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Loan Details
            </h4>
          </div>
          {details ? (
            <div className="mt-4">
              <p>
                <strong>Customer Name:</strong> {details.customer_name}
              </p>
              <p>
                <strong>National ID:</strong> {details.national_id}
              </p>
              <p>
                <strong>Loan Product:</strong> {details.loan_product}
              </p>
              <p>
                <strong>Purpose:</strong> {details.purpose}
              </p>
              <p>
                <strong>Principal:</strong> {details.principal}
              </p>
              <p>
                <strong>Total Amount:</strong> {details.total_amount}
              </p>
              <p>
                <strong>Remaining Balance:</strong> {details.remaining_balance}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {details.status === "partially_paid"
                  ? "partially paid"
                  : details.status}
              </p>
              <p>
                <strong>Due Date:</strong> {details.due_date.split("T")[0]}
              </p>
              <p>
                <strong>Expected Completion:</strong>{" "}
                {details.expected_completion_date.split("T")[0]}
              </p>
              <p>
                <strong>Days Remaining:</strong> {details.days_remaining}
              </p>
              <p>
                <strong>Total Interest:</strong> {details.total_interest}
              </p>
              <p>
                <strong>Installment Amount:</strong>{" "}
                {details.installment_amount}
              </p>
              <p>
                <strong>Arrears:</strong> {details.arrears}
              </p>
              <p>
                <strong>Installment Sum:</strong> {details.installment_sum}
              </p>
              <p>
                <strong>Paid Amount:</strong> {details.paid_amount}
              </p>
              <p>
                <strong>Processing Fee:</strong> {details.processing_fee}
              </p>
            </div>
          ) : (
            <p>No loan details available.</p>
          )}
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <Button size="sm" variant="outline" onClick={closeDetailsModal}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

const AuthenticatedLoans = withAuth(Loans);

export default AuthenticatedLoans;
