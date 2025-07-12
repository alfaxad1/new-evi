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
import { ArrowBigDown, DollarSign, Percent, Wallet2 } from "lucide-react";
import Button from "../../components/ui/button/Button";
import Select from "../../components/form/Select";

interface Loan {
  id: number;
  customer_name: string;
  national_id: string;
  phone: string;
  loan_product: string;
  principal: number;
  total_interest: number;
  total_amount: number;
  disbursement_date: string;
}

interface Summary {
  loan_count: number;
  total_amount_sum: number;
  deficit: number;
  percentage: string;
  target_amount: number;
}

const MonthlyActiveLoans = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const officerId = localStorage.getItem("userId") || "";
  const currentYear = new Date().getFullYear();

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const handleChange = (value: string) => {
    if (value === "last_month") {
      setMonth(new Date().getMonth());
      setPage(1);
      fetchMonthlyActiveLoans(1);
    } else {
      setMonth(new Date().getMonth() + 1);
      setPage(1);
      fetchMonthlyActiveLoans(1);
    }
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[month - 1];

  console.log(monthName);

  const fetchMonthlyActiveLoans = useCallback(
    async (page: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `${apiUrl}/api/loans/monthly-active-loans`,
          {
            params: {
              officerId,
              month: month,
              year: currentYear,
              page,
            },
          }
        );

        setLoans(response.data.loans);
        setTotalPages(response.data.pagination.totalPages);
        setSummary(response.data.summary);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setError(error.response?.data?.error || "Failed to fetch loans.");
        } else {
          setError("An unexpected error occurred.");
        }
      } finally {
        setLoading(false);
      }
    },
    [officerId, month, currentYear, apiUrl]
  );

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

  useEffect(() => {
    fetchMonthlyActiveLoans(page);
  }, [page, fetchMonthlyActiveLoans]);

  if (loading) {
    return (
      <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50">
        <ClipLoader color="#36D7B7" size={50} speedMultiplier={0.8} />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">
        Monthly Disbursements - {monthName} {currentYear}
      </h1>
      {summary && (
        <div>
          <div className="flex justify-end mb-4 w-1/2">
            <Select
              options={[
                { value: "this_month", label: "This Month" },
                { value: "last_month", label: "Last Month" },
              ]}
              onChange={(value) => {
                handleChange(value);
              }}
              placeholder="Select month"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6 mb-5">
            <div className="rounded-2xl border border-gray-300 bg-green-200 p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <Wallet2 className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    Total Disbursements
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800  text-title-sm dark:text-white/90">
                    {summary.loan_count}
                  </h4>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-green-200 p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <DollarSign className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    Total Amount
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800  text-title-sm dark:text-white/90">
                    Ksh. {Math.round(summary.total_amount_sum).toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-green-200 p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <ArrowBigDown className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    Deficit
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800  text-title-sm dark:text-white/90">
                    Ksh. {summary.deficit.toLocaleString()}
                  </h4>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-300 bg-green-200 p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
                <Percent className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    Percentage
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800  text-title-sm dark:text-white/90">
                    {summary.percentage}
                  </h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    National ID
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
                    Disbursement Date
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {loan.customer_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.national_id}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.phone}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.loan_product}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.principal.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.total_interest.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {loan.disbursement_date.split("T")[0]}
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
    </div>
  );
};

const AuthenticatedMonthlyActiveLoans = withAuth(MonthlyActiveLoans);
export { AuthenticatedMonthlyActiveLoans as MonthlyActiveLoans };
