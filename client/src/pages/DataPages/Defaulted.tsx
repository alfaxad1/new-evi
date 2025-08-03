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
import { ClipLoader } from "react-spinners";
import Button from "../../components/ui/button/Button";
import { Repeat } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";

interface DefaultedLoan {
  id: number;
  customer_name: string;
  national_id: string;
  phone: string;
  loan_product: string;
  principal: number;
  total_interest: number;
  total_amount: number;
  remaining_balance: number;
  due_date: string;
  expected_completion_date: string;
  default_date: string;
  days_overdue: number;
}

interface ConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  title?: string;
}

const ConfirmDialog: React.FC<ConfirmProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  message = "Are you sure you want to roll over this loan?",
  title = "Confirmation",
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backdropFilter: "blur(5px)" }}
    >
      <div className="bg-[#E6F0FA] p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100 focus:outline-none border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD] focus:outline-none"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Defaulted = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [defaultedLoans, setDefaultedLoans] = useState<DefaultedLoan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchDefaultedLoans = useCallback(
    async (role: string, officerId: string, page: number): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${apiUrl}/api/loans/loan-details/defaulted?role=${role}&officerId=${officerId}&page=${page}`
        );
        setDefaultedLoans(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      } catch (error) {
        console.error("Error fetching defaulted loans:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchDefaultedLoans(role, officerId, page);
  }, [role, officerId, page, fetchDefaultedLoans]);

  const handleRolloverClick = (loanId: number) => {
    setSelectedLoanId(loanId);
    setShowConfirm(true);
  };

  const handleConfirmRollover = async () => {
    if (selectedLoanId === null) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("You are not authorized");
        return;
      }

      const response = await axios.post(
        `${apiUrl}/api/loans/roll-over/${selectedLoanId}`,
        {}
        // {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //   },
        // }
      );
      fetchDefaultedLoans(role, officerId, page);
      console.log("Roll Over Response:", response.data.message);
      toast.success("Loan rolled over successfully");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.error || "Failed to roll over loan.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setShowConfirm(false);
      setSelectedLoanId(null);
    }
  };

  const handleCancelRollover = () => {
    setShowConfirm(false);
    setSelectedLoanId(null);
  };

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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleConfirmRollover}
        onCancel={handleCancelRollover}
        message={`Are you sure you want to roll over this loan?`}
        title="Roll Over Loan"
      />
      <ToastContainer position="bottom-right" />
      <div className="max-w-screen-lg mx-auto">
        <div className="w-full overflow-x-auto">
          {defaultedLoans && defaultedLoans.length === 0 ? (
            <div className="text-center py-4 text-blue-500">
              No defaulted loans.
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
                    Phone
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Principal
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Total Amount
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
                    Due Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Default Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Days Overdue
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
                {defaultedLoans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {loan.customer_name}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.phone}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {loan.principal}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {loan.total_amount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {loan.remaining_balance || loan.total_amount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {loan.expected_completion_date.slice(0, 10)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      {loan.default_date.slice(0, 10)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-center text-theme-sm dark:text-gray-400">
                      {loan.days_overdue}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRolloverClick(loan.id)}
                          className="bg-blue-500 text-white p-2 rounded-md w-10 flex items-center justify-center hover:bg-blue-600 transition-colors"
                          title="Roll Over"
                        >
                          <Repeat size={18} />
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
  );
};

const AuthenticatedDefaulted = withAuth(Defaulted);
export { AuthenticatedDefaulted as Defaulted };
