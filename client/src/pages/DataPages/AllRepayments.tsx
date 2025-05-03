import withAuth from "../../utils/withAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../src/components/ui/table";
import axios from "axios";
import { useEffect, useState } from "react";

interface Repayment {
  id: number;
  customer_name: string;
  paid_date: string;
  amount: number;
  mpesa_code: string;
}

const AllRepayments = () => {
  const [repayments, setRepayments] = useState<Repayment[]>([]);

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";
  const fetchApprovedRepayments = async (
    role: string,
    officerId: string
  ): Promise<void> => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/repayments?role=${role}&officerId=${officerId}`
      );
      console.log(
        "Approved repayments fetched successfully:",
        response.data.data
      );
      setRepayments(response.data.data);
    } catch (error) {
      console.error("Error fetching approved repayments:", error);
    }
  };

  useEffect(() => {
    fetchApprovedRepayments(role, officerId);
  }, [role, officerId]);

  return (
    <>
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
                    Amount
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Payment Date
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Mpesa Reference
                  </TableCell>
                </TableRow>
              </TableHeader>

              {/* Table Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {repayments.map((repayment) => (
                  <TableRow key={repayment.id}>
                    <TableCell className="px-5 py-4 sm:px-6 text-start">
                      {repayment.customer_name}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.amount}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.paid_date}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                      {repayment.mpesa_code}
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

const AuthenticatedApprovedRepayments = withAuth(AllRepayments);
export { AuthenticatedApprovedRepayments as AllRepayments };
