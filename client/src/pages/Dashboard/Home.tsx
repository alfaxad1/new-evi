import PageMeta from "../../components/common/PageMeta";
import {
  AlertTriangle,
  Calendar,
  Calendar1,
  CheckCircle,
  Clock,
  Clock1,
  DollarSign,
  XCircle,
} from "lucide-react";

import withAuth from "../../utils/withAuth";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router";
import { ClipLoader } from "react-spinners";

interface Count {
  loans_due_today: number;
  loans_due_tomorrow: number;
  loans_due_2_7_days: number;
  defaulted_loans: number;
  pending_disbursement_loans: number;
  active_loans: number;
  pending_loan_applications: number;
  rejected_loan_applications: number;
}

const Home = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const role = JSON.parse(localStorage.getItem("role") || "''");
  const officerId = localStorage.getItem("userId") || "";

  const [counts, setCounts] = useState<Count | null>(null);
  const [disbursed, setDisbursed] = useState(0);
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (role !== "officer") {
      setShow(false);
    }
  }, [role]);

  const fetchLoans = useCallback(
    async (role: string, officerId: string): Promise<void> => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/loans/loan/counts?role=${role}&officerId=${officerId}`
        );
        console.log("Data fetched successfully:", response.data);
        setCounts(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchLoans(role, officerId);
  }, [role, officerId, fetchLoans]);

  const fetchDisbursed = useCallback(
    async (officerId: string): Promise<void> => {
      try {
        const response = await axios.get(
          `${apiUrl}/api/loans/loan-details/disbursed-amount?officerId=${officerId}`
        );
        console.log("Data fetched successfully:", response.data);
        setDisbursed(response.data.total_disbursed_amount);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchDisbursed(officerId);
  }, [officerId, fetchDisbursed]);

  if (!counts) {
    return (
      <div className="fixed inset-0  backdrop-blur-sm flex items-center justify-center z-50">
        <ClipLoader color="#36D7B7" size={50} speedMultiplier={0.8} />
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Evi Ventures Ltd" description="This is Evi" />
      <div className="grid gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 md:gap-6">
            {/* Metric Item: Pending Loans */}
            <Link to="/pending-loans">
              <div className="group relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 transition-all duration-300 hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-100 hover:-translate-y-1 dark:border-amber-800 dark:from-amber-900/20 dark:to-orange-900/20 dark:hover:border-amber-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-amber-700/30"></div>
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-amber-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-amber-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-amber-800/50 dark:to-orange-800/50">
                  <Clock1 className="text-amber-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-amber-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-amber-600 dark:text-amber-400 transition-colors duration-300 group-hover:text-amber-700 dark:group-hover:text-amber-300">
                    Pending Loans
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.pending_loan_applications}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-400/0 via-amber-400/5 to-amber-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Disbursed Amount */}
            {show ? (
              <div className="group relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 transition-all duration-300 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-1 dark:border-emerald-800 dark:from-emerald-900/20 dark:to-teal-900/20 dark:hover:border-emerald-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-emerald-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-emerald-700/30"></div>
                <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-emerald-200 opacity-25 transition-all duration-300 group-hover:scale-125 group-hover:opacity-35 dark:bg-emerald-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-emerald-800/50 dark:to-teal-800/50">
                  <DollarSign className="text-emerald-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-emerald-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400 transition-colors duration-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    Disbursed
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    Ksh. {Math.round(disbursed).toLocaleString()}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-emerald-400/0 via-emerald-400/5 to-emerald-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            ) : (
              ""
            )}

            {/* Metric Item: Active Loans */}
            <Link to="/loans">
              <div className="group relative overflow-hidden rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-lime-50 p-6 transition-all duration-300 hover:border-green-300 hover:shadow-2xl hover:shadow-green-100 hover:-translate-y-1 dark:border-green-800 dark:from-green-900/20 dark:to-lime-900/20 dark:hover:border-green-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -right-10 -bottom-10 h-28 w-28 rounded-full bg-green-100 opacity-15 transition-all duration-300 group-hover:scale-150 group-hover:opacity-25 dark:bg-green-700/30"></div>
                <div className="absolute -left-2 -top-2 h-14 w-14 rounded-full bg-green-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-green-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-green-100 to-lime-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-green-800/50 dark:to-lime-800/50">
                  <CheckCircle className="text-green-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-green-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-green-600 dark:text-green-400 transition-colors duration-300 group-hover:text-green-700 dark:group-hover:text-green-300">
                    Active Loans
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.active_loans}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-green-400/0 via-green-400/5 to-green-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Rejected Loans */}
            <Link to="rejected-loans">
              <div className="group relative overflow-hidden rounded-3xl border border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-6 transition-all duration-300 hover:border-red-300 hover:shadow-2xl hover:shadow-red-100 hover:-translate-y-1 dark:border-red-800 dark:from-red-900/20 dark:to-rose-900/20 dark:hover:border-red-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -left-8 -top-8 h-24 w-24 rounded-full bg-red-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-red-700/30"></div>
                <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-red-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-red-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-red-800/50 dark:to-rose-800/50">
                  <XCircle className="text-red-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-red-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-red-600 dark:text-red-400 transition-colors duration-300 group-hover:text-red-700 dark:group-hover:text-red-300">
                    Rejected Loans
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.rejected_loan_applications}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-red-400/0 via-red-400/5 to-red-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Pending Disbursement */}
            <Link to="pending-disbursement">
              <div className="group relative overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 transition-all duration-300 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-100 hover:-translate-y-1 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 dark:hover:border-blue-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -right-6 -top-6 h-22 w-22 rounded-full bg-blue-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-blue-700/30"></div>
                <div className="absolute -left-3 -bottom-3 h-18 w-18 rounded-full bg-blue-200 opacity-25 transition-all duration-300 group-hover:scale-125 group-hover:opacity-35 dark:bg-blue-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-blue-800/50 dark:to-indigo-800/50">
                  <DollarSign className="text-blue-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-blue-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-blue-600 dark:text-blue-400 transition-colors duration-300 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                    Pending Disbursement
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.pending_disbursement_loans}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/0 via-blue-400/5 to-blue-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Due Today */}
            <Link to="due-today">
              <div className="group relative overflow-hidden rounded-3xl border border-purple-200 bg-gradient-to-br from-purple-50 to-violet-50 p-6 transition-all duration-300 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-100 hover:-translate-y-1 dark:border-purple-800 dark:from-purple-900/20 dark:to-violet-900/20 dark:hover:border-purple-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -left-10 -top-10 h-26 w-26 rounded-full bg-purple-100 opacity-15 transition-all duration-300 group-hover:scale-150 group-hover:opacity-25 dark:bg-purple-700/30"></div>
                <div className="absolute -right-2 -bottom-2 h-12 w-12 rounded-full bg-purple-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-purple-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-purple-100 to-violet-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-purple-800/50 dark:to-violet-800/50">
                  <Calendar className="text-purple-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-purple-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-purple-600 dark:text-purple-400 transition-colors duration-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">
                    Due Today
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.loans_due_today}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/0 via-purple-400/5 to-purple-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Due Tomorrow */}
            <Link to="due-tommorrow">
              <div className="group relative overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-sky-50 p-6 transition-all duration-300 hover:border-cyan-300 hover:shadow-2xl hover:shadow-cyan-100 hover:-translate-y-1 dark:border-cyan-800 dark:from-cyan-900/20 dark:to-sky-900/20 dark:hover:border-cyan-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-cyan-700/30"></div>
                <div className="absolute -left-4 -top-4 h-16 w-16 rounded-full bg-cyan-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-cyan-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-cyan-800/50 dark:to-sky-800/50">
                  <Calendar1 className="text-cyan-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-cyan-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-cyan-600 dark:text-cyan-400 transition-colors duration-300 group-hover:text-cyan-700 dark:group-hover:text-cyan-300">
                    Due Tomorrow
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.loans_due_tomorrow}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/0 via-cyan-400/5 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Due 2-7 Days */}
            <Link to="due-2-7">
              <div className="group relative overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 p-6 transition-all duration-300 hover:border-orange-300 hover:shadow-2xl hover:shadow-orange-100 hover:-translate-y-1 dark:border-orange-800 dark:from-orange-900/20 dark:to-red-900/20 dark:hover:border-orange-700 md:p-7">
                {/* Decorative Pattern */}
                <div className="absolute -left-6 -bottom-6 h-20 w-20 rounded-full bg-orange-100 opacity-20 transition-all duration-300 group-hover:scale-150 group-hover:opacity-30 dark:bg-orange-700/30"></div>
                <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-orange-200 opacity-25 transition-all duration-300 group-hover:scale-125 group-hover:opacity-35 dark:bg-orange-600/40"></div>

                {/* Icon Container */}
                <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-orange-800/50 dark:to-red-800/50">
                  <Clock className="text-orange-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-orange-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 mt-6">
                  <span className="text-lg font-medium text-orange-600 dark:text-orange-400 transition-colors duration-300 group-hover:text-orange-700 dark:group-hover:text-orange-300">
                    Due 2-7 Days
                  </span>
                  <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                    {counts.loans_due_2_7_days}
                  </h4>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-400/0 via-orange-400/5 to-orange-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </div>
            </Link>

            {/* Metric Item: Defaulted Loans */}
            {!show ? (
              <Link to="defaulted">
                <div className="group relative overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 p-6 transition-all duration-300 hover:border-rose-300 hover:shadow-2xl hover:shadow-rose-100 hover:-translate-y-1 dark:border-rose-800 dark:from-rose-900/20 dark:to-pink-900/20 dark:hover:border-rose-700 md:p-7">
                  {/* Decorative Pattern */}
                  <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100 opacity-15 transition-all duration-300 group-hover:scale-150 group-hover:opacity-25 dark:bg-rose-700/30"></div>
                  <div className="absolute -left-2 -bottom-2 h-14 w-14 rounded-full bg-rose-200 opacity-30 transition-all duration-300 group-hover:scale-125 group-hover:opacity-40 dark:bg-rose-600/40"></div>

                  {/* Icon Container */}
                  <div className="relative z-10 flex items-center justify-center w-14 h-14 bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl dark:from-rose-800/50 dark:to-pink-800/50">
                    <AlertTriangle className="text-rose-700 size-7 transition-all duration-300 group-hover:scale-110 dark:text-rose-300" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 mt-6">
                    <span className="text-lg font-medium text-rose-600 dark:text-rose-400 transition-colors duration-300 group-hover:text-rose-700 dark:group-hover:text-rose-300">
                      Defaulted Loans
                    </span>
                    <h4 className="mt-3 font-bold text-gray-800 text-3xl dark:text-white/90 transition-all duration-300 group-hover:text-gray-900 dark:group-hover:text-white">
                      {counts.defaulted_loans}
                    </h4>
                  </div>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-rose-400/0 via-rose-400/5 to-rose-400/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </div>
              </Link>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const AuthenticatedHome = withAuth(Home);
export default AuthenticatedHome;
