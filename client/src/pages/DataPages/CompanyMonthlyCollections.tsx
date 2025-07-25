import { Banknote, PercentIcon, Wallet2 } from "lucide-react";
import withAuth from "../../utils/withAuth";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import Select from "../../components/form/Select";
import { ClipLoader } from "react-spinners";
import { Line } from "react-chartjs-2";

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
  const [monthlyData, setMonthlyData] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const officerId = localStorage.getItem("userId") || "";
  const currentYear = new Date().getFullYear();

  const monthNames = useMemo(
    () => [
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
    ],
    []
  );

  const monthOptions = monthNames.map((name, idx) => ({
    value: (idx + 1).toString(),
    label: name,
  }));

  const handleChange = (value: string) => {
    setMonth(Number(value));
  };

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

  const fetchAllMonths = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const responses = await Promise.all(
        monthNames.map((_, idx) =>
          axios.get(`${apiUrl}/api/repayments/monthly-approved-admin`, {
            params: { officerId, month: idx + 1, year: currentYear },
          })
        )
      );
      const totals = responses.map((res) => res.data.summary.total_amount_sum);
      setMonthlyData(totals);
    } catch (error) {
      console.error("Error fetching monthly data:", error);
    }
    {
      setLoading(false);
    }
  }, [officerId, currentYear, apiUrl, monthNames]);

  useEffect(() => {
    fetchMonthlyCollections();
    fetchAllMonths();
  }, [fetchMonthlyCollections, fetchAllMonths]);

  const chartData = {
    labels: monthNames,
    datasets: [
      {
        label: "Total Disbursements (Ksh)",
        data: monthlyData,
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        pointBackgroundColor: "#3B82F6",
        pointBorderColor: "#ffffff",
        pointRadius: 6,
        pointHoverRadius: 10,
        fill: true,
        tension: 0.4,
        borderWidth: 3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#1F2937",
          font: {
            size: 16,
            weight: "bold" as const,
          },
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: "rgba(31, 41, 55, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: function (context: import("chart.js").TooltipItem<"line">) {
            return `Ksh ${context.parsed.y.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Month",
          color: "#1F2937",
          font: {
            size: 16,
            weight: "bold" as const,
          },
          padding: 20,
        },
        ticks: {
          color: "#1F2937",
          font: {
            size: 14,
          },
        },
        grid: {
          display: false,
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: "Total Disbursements (Ksh)",
          color: "#1F2937",
          font: {
            size: 16,
            weight: "bold" as const,
          },
          padding: 20,
        },
        ticks: {
          color: "#1F2937",
          font: {
            size: 14,
          },
          callback: function (value: string | number) {
            if (typeof value === "number") {
              return `Ksh ${value.toLocaleString()}`;
            }
            if (!isNaN(Number(value))) {
              return `Ksh ${Number(value).toLocaleString()}`;
            }
            return `Ksh ${value}`;
          },
          padding: 10,
        },
        grid: {
          color: "rgba(229, 231, 235, 0.3)",
          drawBorder: false,
        },
      },
    },
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
    <>
      <h1 className="text-2xl font-bold mb-4">
        Monthly Collections - {monthNames[month - 1]} {currentYear}
      </h1>
      {summary && (
        <div>
          <div className="flex justify-end mb-4 w-1/2">
            <Select
              options={monthOptions}
              onChange={handleChange}
              defaultValue={month.toString()}
              placeholder="Select month"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100 hover:-translate-y-1 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-sky-900/20 dark:hover:border-cyan-700 md:p-7">
              {/* Decorative Pattern */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-cyan-700/30"></div>
              <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-cyan-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-cyan-600/40"></div>

              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-cyan-800/50 dark:to-sky-800/50">
                <Wallet2 className="text-cyan-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-cyan-300" />
              </div>

              {/* Content */}
              <div className="relative z-10 mt-6">
                <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400 transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                  Number of Repayments
                </span>
                <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {summary.number.toLocaleString()}
                </h4>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </div>
            <div className="group relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100 hover:-translate-y-1 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-sky-900/20 dark:hover:border-cyan-700 md:p-7">
              {/* Decorative Pattern */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-cyan-700/30"></div>
              <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-cyan-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-cyan-600/40"></div>

              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-cyan-800/50 dark:to-sky-800/50">
                <Banknote className="text-cyan-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-cyan-300" />
              </div>
              {/* Content */}
              <div className="relative z-10 mt-6">
                <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400 transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                  Total Collections
                </span>
                <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Ksh. {summary.total_amount_sum.toLocaleString()}
                </h4>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </div>
            <div className="group relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100 hover:-translate-y-1 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-sky-900/20 dark:hover:border-cyan-700 md:p-7">
              {/* Decorative Pattern */}
              <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-cyan-700/30"></div>
              <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-cyan-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-cyan-600/40"></div>

              {/* Icon Container */}
              <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-cyan-800/50 dark:to-sky-800/50">
                <PercentIcon className="text-cyan-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-cyan-300" />
              </div>

              {/* Content */}
              <div className="relative z-10 mt-6">
                <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400 transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                  Collection Percentage
                </span>
                <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  {officers.length > 0
                    ? (
                        (summary.total_amount_sum /
                          (700000 * officers.length)) *
                        100
                      ).toFixed(2)
                    : "0.00"}
                  %
                </h4>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Collections Trend {currentYear}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-screen-lg mx-auto">
          <div className="w-full overflow-x-auto">
            {officers && officers.length === 0 ? (
              <div className="text-center py-4 text-blue-500">
                No loans found for the selected month.
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

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Deficit
                    </TableCell>

                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Percentage
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

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        Ksh. {700000 - Math.round(officer.total_amount_sum)}
                      </TableCell>

                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {((officer.total_amount_sum / 700000) * 100).toFixed(2)}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
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
