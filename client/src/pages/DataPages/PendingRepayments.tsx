import withAuth from "../../utils/withAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../src/components/ui/table";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import Button from "../../components/ui/button/Button";
import { Search } from "lucide-react";

interface pendingRepayment {
  id: number;
  amount: number;
  due_date: string;
  paid_date: string;
  mpesa_code: string;
  created_at: string;
  total_amount: number;
  loan_status: string;
  customer_name: string;
  loan_id?: number;
  customer_id?: number;
  created_by?: number;
}

const PendingRepayments = () => {
 const apiUrl = import.meta.env.REACT_APP_API_URL;
  
  const [pendingRepayments, setPendingRepayments] = useState<
    pendingRepayment[]
  >([]);

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchString, setSearchString] = useState<string>("");

  const fetchPendingRepayments = useCallback(async (
    role: string,
    officerId: string,
    page: number
  ): Promise<void> => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/repayments/pending?role=${role}&officerId=${officerId}&page=${page}`
      );
      console.log("Pending repayments fetched successfully:", response.data);

      setPendingRepayments(response.data.data);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      console.error("Error fetching pending repayments:", error);
    }
  }, [apiUrl]);
  useEffect(() => {
    fetchPendingRepayments(role, officerId, page);
  }, [role, officerId, page, fetchPendingRepayments]);

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

  console.log("Pending repayments:", pendingRepayments);

  // const approvalData = {
  //   loanId: pendingRepayments.loan_id,
  //   amount: pendingRepayments.amount,
  //   status: "paid",
  //   mpesaCode: pendingRepayments.mpesa_code,
  //   customerId: pendingRepayments.customer_id,
  //   initiatedBy: pendingRepayments.created_by,
  // };

  const handleApprove = async (repayment: pendingRepayment) => {
    const approvalData = {
      loanId: repayment.loan_id,
      amount: repayment.amount,
      status: "paid",
      mpesaCode: repayment.mpesa_code,
      customerId: repayment.customer_id,
      initiatedBy: repayment.created_by,
    };

    try {
      const response = await axios.put(
        `${apiUrl}/api/repayments/${repayment.id}`,
        approvalData
      );
      console.log("Approved successfully:", response.data);
      fetchPendingRepayments(role, officerId, page);
      toast.success("Repayment approved successfully!");
    } catch (error) {
      console.error("Error approving repayment:", error);
    }
  };

  const filteredRepayments = pendingRepayments.filter((repayment) => {
    return repayment.customer_name
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
                    Loan Status
                  </TableCell>
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
                    Mpesa Reference
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Paid Date
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
                    Created At
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
                {filteredRepayments.map((repayment) => (
                  <TableRow key={repayment.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {repayment.customer_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      <span
                        style={{
                          color:
                            repayment.loan_status === "active"
                              ? "green"
                              : "blue",
                        }}
                      >
                        {repayment.loan_status === "partially_paid"
                          ? "partially paid"
                          : repayment.loan_status}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.amount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.mpesa_code}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.paid_date}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.due_date.split(" ")[0]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.created_at.split("T")[0] +
                        " " +
                        repayment.created_at.split("T")[1].split(".")[0]}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      <div className="flex flex-col">
                        <button
                          onClick={() => handleApprove(repayment)}
                          className="bg-success-500 text-white text-sm  py-1 rounded-md mb-2 w-16"
                        >
                          Approve
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </>
  );
};

const AuthenticatedPendingRepayments = withAuth(PendingRepayments);
export default AuthenticatedPendingRepayments;
