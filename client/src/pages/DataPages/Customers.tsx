import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../src/components/ui/table";
import { useNavigate } from "react-router";
import withAuth from "../../utils/withAuth";

import Button from "../../components/ui/button/Button";
import { toast, ToastContainer } from "react-toastify";
import { Search } from "lucide-react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ClipLoader } from "react-spinners";

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  national_id: string;
  address: string;
  occupation: string;
  passport_photo: string;
  national_id_photo: string;
  created_by_name: string;
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
  message = "Are you sure you want to delete this customer?",
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

const Customers = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );

  const role: string = JSON.parse(localStorage.getItem("role") || "''");
  const userId: string = localStorage.getItem("userId") || "";

  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchString, setSearchString] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchData = useCallback(
    async (role: string, userId: string, page: number): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `${apiUrl}/api/customers?role=${role}&userId=${userId}&page=${page}`
        );
        console.log("Data fetched successfully:", response.data);
        setCustomerData(response.data.data);
        setTotalPages(response.data.meta.totalPages);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch customer data");
      } finally {
        setLoading(false);
      }
    },
    [apiUrl]
  );

  useEffect(() => {
    fetchData(role, userId, page);
  }, [role, userId, page, fetchData]);

  if (loading) {
    return (
      <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
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

  const handleDeleteClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedCustomerId === null) return;

    try {
      const response = await axios.delete(
        `${apiUrl}/api/customers/${selectedCustomerId}`
      );
      console.log("Customer deleted successfully:", response.data);
      toast.success(response.data.message);
      fetchData(role, userId, page); // Refresh the data
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response) {
        console.error("Error deleting:", err.response.data);
        toast.error(
          err.response.data.error || err.response.data.errors?.[0]?.msg
        );
      } else {
        console.error("An unexpected error occurred", err);
        toast.error("An unexpected error occurred");
      }
    } finally {
      setShowConfirm(false);
      setSelectedCustomerId(null);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    setSelectedCustomerId(null);
  };

  const filteredCustomers = customerData.filter((customer) => {
    return (
      customer.first_name.toLowerCase().includes(searchString.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchString.toLowerCase())
    );
  });

  return (
    <div>
      <ConfirmDialog
        isOpen={showConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        message={`Are you sure you want to delete this customer ?`}
      />
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
            {filteredCustomers && filteredCustomers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No customers found.
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
                      Name
                    </TableCell>
                    <TableCell
                      isHeader
                      className="hidden sm:table-cell px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      ID Number
                    </TableCell>
                    <TableCell
                      isHeader
                      className="hidden sm:table-cell px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Address
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Phone Number
                    </TableCell>
                    <TableCell
                      isHeader
                      className="hidden lg:table-cell px-5 py-3 font-medium text-blue-500 text-start text-theme-xs dark:text-gray-400"
                    >
                      Created By
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-5 py-3 font-medium text-blue-500 text-theme-xs dark:text-gray-400 text-center"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                {/* Table Body */}
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="px-5 py-4 sm:px-6 text-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 overflow-hidden rounded-full">
                            <img
                              width={40}
                              height={40}
                              src={customer.passport_photo}
                              alt={customer.first_name}
                            />
                          </div>
                          <div>
                            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                              {customer.first_name} {customer.last_name}
                            </span>
                            <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                              {customer.occupation}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {customer.national_id}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                        {customer.address}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {customer.phone}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                        {customer.created_by_name}
                      </TableCell>
                      <TableCell className="overflow-auto text-gray-500 text-theme-sm dark:text-gray-400 text-center">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => {
                              localStorage.setItem(
                                "customerId",
                                customer.id.toString()
                              );
                              navigate("/loan-application");
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Add Loan"
                          >
                            <i className="fas fa-plus text-blue-500 hover:text-blue-700"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(customer)}
                            className="p-1 rounded hover:bg-gray-100"
                            title="Delete Customer"
                          >
                            <i className="fas fa-trash text-red-500 hover:text-red-700"></i>
                          </button>
                          <button
                            onClick={() => {
                              localStorage.setItem(
                                "customerId",
                                customer.id.toString()
                              );
                              navigate("/customer-details");
                            }}
                            className="p-1 rounded hover:bg-gray-100"
                            title="View Details"
                          >
                            <i className="fas fa-eye text-yellow-500 hover:text-yellow-700"></i>
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
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

const AuthenticatedCustomers = withAuth(Customers);

export default AuthenticatedCustomers;
