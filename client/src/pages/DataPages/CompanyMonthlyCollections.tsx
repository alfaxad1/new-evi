import { DollarSign, Wallet } from "lucide-react";
import withAuth from "../../utils/withAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import Select from "../../components/form/Select";

interface Officer {
  id: number;
  first_name: string;
  last_name: string;
  number: number;
  total_amount_sum: number;
}

interface Summary {
  total_amount_sum: number;
  number: number;
}

const CompanyMonthlyCollections = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [officers, setOfficers] = useState<Officer[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);

  const officerId = localStorage.getItem("userId") || "";
  //const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const handleChange = (value: string) => {
    if (value === "last_month") {
      setMonth(new Date().getMonth());
    } else {
      setMonth(new Date().getMonth() + 1);
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

  const fetchMonthlyCollections = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/repayments/monthly-approved-admin`,
        {
          params: {
            officerId,
            month: month,
            year: currentYear,
          },
        }
      );
      console.log("Data fetched successfully:", response.data);
      setOfficers(response.data.officers);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [officerId, month, currentYear, apiUrl]);

  useEffect(() => {
    fetchMonthlyCollections();
  }, [fetchMonthlyCollections]);

  return (
    <>
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
                <Wallet className="text-gray-800 size-6 dark:text-white/90" />
              </div>
              <div className="flex items-end justify-between mt-5">
                <div>
                  <span className="text-lg text-gray-500 dark:text-gray-400">
                    Number of Loans
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-center text-title-sm dark:text-white/90">
                    {summary.number.toLocaleString()}
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
                    Total Collections
                  </span>
                  <h4 className="mt-2 font-bold text-gray-800 text-center text-title-sm dark:text-white/90">
                    Ksh. {summary.total_amount_sum.toLocaleString()}
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
                    Officer Name
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Loans
                  </TableCell>

                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Total Amount
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {officers.map((officer) => (
                  <TableRow key={officer.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {officer.first_name} {officer.last_name}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {officer.number}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                      Ksh.{" "}
                      {Math.round(officer.total_amount_sum).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </>
  );
};

const AuthenticatedCompanyMonthlyCollections = withAuth(
  CompanyMonthlyCollections
);
export { AuthenticatedCompanyMonthlyCollections as CompanyMonthlyCollections };
