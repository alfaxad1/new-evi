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
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import { toast, ToastContainer } from "react-toastify";
import { ClipLoader } from "react-spinners";

interface pendingDisbursementLoan {
  id: number;
  customer_name: string;
  national_id: string;
  phone: string;
  loan_product: string;
  principal: number;
  total_interest: number;
  total_amount: number;
  due_date: string;
  days_remaining: number;
}

const PendingDisbursement = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const { isOpen, openModal, closeModal } = useModal();
  const [pendingLoans, setPendingLoans] = useState<pendingDisbursementLoan[]>(
    []
  );
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [mpesaCode, setMpesaCode] = useState<string>("");

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingDisbursementLoans = useCallback(
    async (role: string, officerId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${apiUrl}/api/loans/loan-details/pending-disbursement?role=${role}&officerId=${officerId}`
        );
        console.log(
          "Pending disbursement loans fetched successfully:",
          response.data
        );
        setPendingLoans(response.data);
      } catch (error) {
        console.error("Error fetching pending disbursement loans:", error);
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchPendingDisbursementLoans(role, officerId);
  }, [role, officerId, fetchPendingDisbursementLoans]);

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

  const handleDisburseClick = (loanId: number) => {
    setSelectedLoanId(loanId);
    openModal();
  };

  const handleDisburseSave = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
    if (!selectedLoanId || !mpesaCode) {
      alert("Please enter a valid Mpesa code.");

      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You are not authorized ");
        return;
      }
      await axios.put(
        `${apiUrl}/api/loans/disburse/${selectedLoanId}`,
        { mpesaCode },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("Loan disbursed successfully");
      fetchPendingDisbursementLoans(role, officerId); // Refresh the list after disbursement
      closeModal(); // Close the modal
      setMpesaCode(""); // Clear the Mpesa code input
      setSelectedLoanId(null); // Clear the selected loan ID
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        closeModal();
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          toast.error("You are not authorized.");
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
        console.error("Error approving loan:", error);
      } else {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred. Please try again.");
      }
    }
  };

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-screen-lg mx-auto">
          <div className="w-full overflow-x-auto">
            {pendingLoans && pendingLoans.length === 0 ? (
              <div className="text-center py-4 text-blue-500">
                No loans pending disbursement.
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
                      Phone Number
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Loan Product
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
                      Total Interest
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
                      Due Date
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Days Remaining
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
                  {pendingLoans.map((loan) => (
                    <TableRow key={loan.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        {loan.customer_name}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {loan.phone}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {loan.loan_product}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.principal}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.total_interest}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.total_amount}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.due_date.slice(0, 10)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {loan.days_remaining}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        <button
                          onClick={() => handleDisburseClick(loan.id)}
                          className="bg-success-500 text-white text-sm  py-1 rounded-md mb-2 w-16"
                        >
                          Disburse
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Disburse Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[400px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Enter Mpesa Code
            </h4>
          </div>
          <form
            className="flex flex-col"
            onSubmit={(e) => handleDisburseSave(e)}
          >
            <div className="custom-scrollbar h-[200px] overflow-y-auto px-2 pb-3">
              <div className="mt-7">
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-1">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>Mpesa Code</Label>
                    <Input
                      type="text"
                      value={mpesaCode}
                      onChange={(e) => setMpesaCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
};

const AuthenticatedPendingDisbursement = withAuth(PendingDisbursement);
export { AuthenticatedPendingDisbursement as PendingDisbursement };
