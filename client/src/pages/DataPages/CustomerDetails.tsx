import { useCallback, useEffect, useState } from "react";
import withAuth from "../../utils/withAuth";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

interface Referee {
  name: string;
  relationship: string;
  phone_number: string;
  id_number: string;
}

interface Guarantor {
  name: string;
  id_number: string;
  relationship: string;
  phone_number: string;
  bussiness_location: string;
  residence_details: string;
  pass_photo: string;
  id_photo: string;
  collaterals: Collateral[];
}

interface Collateral {
  item_name: string;
  item_count: number;
  additional_details: string;
}
interface Customer {
  customer: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    phone: string;
    national_id: string;
    occupation: string;
    monthly_income: number;
    passport_photo: string;
    national_id_photo: string;
    date_of_birth: string;
    gender: string;
    address: string;
    county: string;
    business_name?: string;
    business_location?: string;
    residence_details?: string;
  };
  collaterals: Collateral[];
  referees: Referee[];
  guarantors: Guarantor[];
}

const CustomerDetails = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const customerId = localStorage.getItem("customerId");

  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null);

  const fetchCustomerDetails = useCallback(async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/api/customerNew/${customerId}`
      );
      setCustomerDetails(response.data);
      console.log("Customer details fetched successfully:", response.data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  }, [apiUrl, customerId]);
  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    } else {
      console.error("No customer ID found in local storage.");
    }
  }, [apiUrl, customerId, fetchCustomerDetails]);

  return (
    <div>
      <h1 className="text-gray-800 text-title-sm dark:text-white/90 text-center mb-4">
        Customer Details
      </h1>
      {customerDetails ? (
        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 ">
            <div className="border border-gray-400 rounded-xl dark:border-gray-800 p-4">
              <h3 className="text-gray-800 text-xl dark:text-white/90 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 mb-4">
                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Customer Name:
                  </h1>
                  <p>
                    {customerDetails.customer.first_name}{" "}
                    {customerDetails.customer.last_name}{" "}
                    {customerDetails.customer.middle_name}
                  </p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Phone Number:
                  </h1>
                  <p>{customerDetails.customer.phone}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    ID Number:
                  </h1>
                  <p>{customerDetails.customer.national_id}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Occupation:
                  </h1>
                  <p>{customerDetails.customer.occupation}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Monthly Income:
                  </h1>
                  <p>
                    Ksh.{" "}
                    {Math.floor(
                      customerDetails.customer.monthly_income
                    ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Address:
                  </h1>
                  <p>{customerDetails.customer.address}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Date of Birth:
                  </h1>
                  <p>{customerDetails.customer.date_of_birth}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Gender:
                  </h1>
                  <p>{customerDetails.customer.gender}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Bussiness Name:
                  </h1>
                  <p>{customerDetails.customer.business_name}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Business Location:
                  </h1>
                  <p>{customerDetails.customer.business_location}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    County:
                  </h1>
                  <p>{customerDetails.customer.county}</p>
                </div>

                <div>
                  <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                    Residence Details:
                  </h1>
                  <p>{customerDetails.customer.residence_details}</p>
                </div>
              </div>

              <h3 className="text-gray-800 text-xl dark:text-white/90 mt-6">
                Collaterals
              </h3>
              {customerDetails.collaterals.length > 0 ? (
                customerDetails.collaterals.map(
                  (collateral: Collateral, index: number) => (
                    <div key={index} className="mb-6">
                      <Table>
                        {/* Table Header */}
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                          <TableRow>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                            >
                              Item
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                            >
                              Number
                            </TableCell>
                            <TableCell
                              isHeader
                              className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                            >
                              Additional Details
                            </TableCell>
                          </TableRow>
                        </TableHeader>
                        {/* Table Body */}
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                          <TableRow key={index}>
                            <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                              {collateral.item_name}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                              {collateral.item_count}
                            </TableCell>
                            <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                              {collateral.additional_details || "-"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )
                )
              ) : (
                <p>No collaterals available.</p>
              )}

              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-36 h-40 overflow-hidden border border-gray-300 rounded-xl dark:border-gray-800">
                  <img
                    width={128}
                    height={128}
                    src={customerDetails.customer.passport_photo}
                    alt="Customer passport photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="w-64 h-40 overflow-hidden border border-gray-300 rounded-xl dark:border-gray-800">
                  <img
                    width={128}
                    height={128}
                    src={customerDetails.customer.national_id_photo}
                    alt="Customer national ID photo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="border border-gray-400 rounded-xl dark:border-gray-800 p-4">
              <h3 className="text-gray-800 text-xl dark:text-white/90 mt-4">
                Guarantors
              </h3>
              {customerDetails?.guarantors.length > 0 ? (
                customerDetails.guarantors.map((guarantor, index) => (
                  <div key={index}>
                    <div className="mb-4">
                      <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                        Name:
                      </h1>
                      <p>{guarantor.name}</p>
                    </div>

                    <div className="mb-4">
                      <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                        Relationship:
                      </h1>
                      <p>{guarantor.relationship}</p>
                    </div>

                    <div className="mb-4">
                      <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                        Phone Number:
                      </h1>
                      <p>{guarantor.phone_number}</p>
                    </div>

                    <div className="mb-4">
                      <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                        Residence Details:
                      </h1>
                      <p>{guarantor.residence_details || "-"}</p>
                    </div>

                    <div className="mb-4">
                      <h1 className="text-gray-800 text-md font-medium dark:text-white/90">
                        Business Location:
                      </h1>
                      <p>{guarantor.bussiness_location}</p>
                    </div>

                    <h6 className="text-gray-800 text-xl dark:text-white/90 mt-6">
                      Guarantor Collaterals
                    </h6>
                    {guarantor.collaterals.length > 0 ? (
                      guarantor.collaterals.map((collateral, cIndex) => (
                        <div key={cIndex} className="mb-4 mt-2">
                          <Table>
                            {/* Table Header */}
                            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                              <TableRow>
                                <TableCell
                                  isHeader
                                  className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                  Item
                                </TableCell>
                                <TableCell
                                  isHeader
                                  className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                  Number
                                </TableCell>
                                <TableCell
                                  isHeader
                                  className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                  Additional Details
                                </TableCell>
                              </TableRow>
                            </TableHeader>
                            {/* Table Body */}
                            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                              <TableRow key={cIndex}>
                                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                                  {collateral.item_name}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                  {collateral.item_count}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                  {collateral.additional_details || "-"}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      ))
                    ) : (
                      <p>No collaterals available.</p>
                    )}

                    <div className="flex flex-col sm:flex-row gap-5">
                      <div className="w-36 h-40 overflow-hidden border border-gray-300 rounded-xl dark:border-gray-800">
                        <img
                          width={128}
                          height={128}
                          src={guarantor.pass_photo}
                          alt="Gurantor passport photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="w-64 h-40 overflow-hidden border border-gray-300 rounded-xl dark:border-gray-800">
                        <img
                          width={128}
                          height={128}
                          src={guarantor.id_photo}
                          alt="Gurantor national ID photo"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No guarantors available.</p>
              )}
            </div>

            <div className="border border-gray-400 rounded-xl dark:border-gray-800 p-4">
              <h3 className="text-gray-800 text-xl dark:text-white/90 mb-4">
                Referees
              </h3>
              {customerDetails?.referees.length > 0 ? (
                customerDetails.referees.map((referee, index) => (
                  <div key={index} className="mb-4">
                    <Table>
                      {/* Table Header */}
                      <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                        <TableRow>
                          <TableCell
                            isHeader
                            className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                          >
                            Name
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                          >
                            ID Number
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                          >
                            Phone Number
                          </TableCell>
                          <TableCell
                            isHeader
                            className="px-5 py-3 font-medium text-grey-500 text-start text-theme-xs dark:text-gray-400"
                          >
                            Relationship
                          </TableCell>
                        </TableRow>
                      </TableHeader>
                      {/* Table Body */}
                      <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                        <TableRow key={index}>
                          <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                            {referee.name}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {referee.id_number}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {referee.phone_number}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                            {referee.relationship}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                ))
              ) : (
                <p>No referees available.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

const AuthenticatedCustomerDetails = withAuth(CustomerDetails);
export default AuthenticatedCustomerDetails;
