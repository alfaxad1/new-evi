import { useCallback, useEffect, useState } from "react";
import withAuth from "../../utils/withAuth";
import axios from "axios";

interface Referee {
  name: string;
  relationship: string;
  phone_number: string;
}

interface Guarantor {
  name: string;
  relationship: string;
  phone_number: string;
  collaterals: Collateral[];
}
// Define the structure of a collateral
interface Collateral {
  item_name: string;
  item_count: number;
  additional_details: string;
}
interface Customer {
  customer: {
    first_name: string;
    last_name: string;
    phone: string;
    national_id: string;
    address: string;
    occupation: string;
    monthly_income: number;
    passport_photo: string;
    national_id_photo: string;
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
      <h1>Customer Details</h1>
      {customerDetails ? (
        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
          <div className="mt-7">
            <h5 className="font-bold">Personal Information</h5>

            <p>
              Name: {customerDetails.customer.first_name}{" "}
              {customerDetails.customer.last_name}
            </p>
            <p>Phone: {customerDetails.customer.phone}</p>
            <p>National ID: {customerDetails.customer.national_id}</p>
            <p>Address: {customerDetails.customer.address}</p>
            <p>Occupation: {customerDetails.customer.occupation}</p>
            <p>Monthly Income: {customerDetails.customer.monthly_income}</p>

            <div className="flex gap-4 m-4">
              <div className="w-36 h-40 overflow-hidden">
                <img
                  width={128}
                  height={128}
                  src={customerDetails.customer.passport_photo}
                  alt="Customer passport photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-64 h-40 overflow-hidden">
                <img
                  width={128}
                  height={128}
                  src={customerDetails.customer.national_id_photo}
                  alt="Customer national ID photo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <h5 className="font-bold mt-4">Collaterals</h5>
            {customerDetails.collaterals.length > 0 ? (
              customerDetails.collaterals.map(
                (collateral: Collateral, index: number) => (
                  <p key={index}>
                    {collateral.item_name} - {collateral.item_count} (
                    {collateral.additional_details})
                  </p>
                )
              )
            ) : (
              <p>No collaterals available.</p>
            )}
            <h5 className="font-bold mt-4">Referees</h5>
            {customerDetails?.referees.length > 0 ? (
              customerDetails.referees.map((referee, index) => (
                <p key={index}>
                  {referee.name} - {referee.relationship} (
                  {referee.phone_number})
                </p>
              ))
            ) : (
              <p>No referees available.</p>
            )}

            <h5 className="font-bold mt-4">Guarantors</h5>
            {customerDetails?.guarantors.length > 0 ? (
              customerDetails.guarantors.map((guarantor, index) => (
                <div key={index}>
                  <p>
                    {guarantor.name} - {guarantor.relationship} (
                    {guarantor.phone_number})
                  </p>
                  <h6 className="font-bold">Guarantor Collaterals</h6>
                  {guarantor.collaterals.length > 0 ? (
                    guarantor.collaterals.map((collateral, cIndex) => (
                      <p key={cIndex}>
                        {collateral.item_name} - {collateral.item_count} (
                        {collateral.additional_details})
                      </p>
                    ))
                  ) : (
                    <p>No collaterals available.</p>
                  )}
                </div>
              ))
            ) : (
              <p>No guarantors available.</p>
            )}
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
