import Input from "../../components/form/input/InputField";
import Label from "../../components/form/Label";
import { useCallback, useEffect, useState } from "react";
import Select from "../../components/form/Select";
import axios from "axios";
import Button from "../../components/ui/button/Button";
import withAuth from "../../utils/withAuth";
import { toast, ToastContainer } from "react-toastify";

interface LoanApplicationData {
  productId: number;
  amount: number;
  purpose: string;
  customerId: number;
  installmentType: string;
  officerId: number;
  applicationDate?: string;
}

const LoanApplication = () => {
  const apiUrl = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoanApplicationData>({
    amount: 0,
    purpose: "",
    productId: 0,
    customerId: 0,
    installmentType: "",
    officerId: 0,
    applicationDate: "",
  });
  const [options, setOptions] = useState<{ value: string; label: string }[]>(
    []
  );
  const fetchProducts = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/loanProducts`);
      const formattedOptions = response.data.map(
        (product: { id: string; name: string }) => ({
          value: product.id,
          label: product.name,
        })
      );
      setOptions(formattedOptions);
      console.log("Data fetched successfully:", formattedOptions);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [apiUrl]);
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      productId: parseInt(value),
    });
    console.log("Updated formData:", { ...formData, productId: value });
  };

  const handleInstallmentChange = (value: string) => {
    setFormData({
      ...formData,
      installmentType: value,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const customerId = localStorage.getItem("customerId");
  const userId = parseInt(localStorage.getItem("userId") || "0");

  console.log("User ID:", userId);

  useEffect(() => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      customerId: customerId ? parseInt(customerId) : 0,
      officerId: userId,
    }));
  }, [customerId, userId]);

  console.log("Form data:", formData);

  const resetForm = () => {
    setFormData({
      amount: 0,
      purpose: "",
      productId: 0,
      customerId: 0,
      installmentType: "",
      officerId: 0,
      applicationDate: "",
    });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/api/loansApplication`,
        formData
      );
      resetForm();
      console.log("Form submitted successfully:", response);
      toast.success(response.data.message);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      if (axios.isAxiosError(error)) {
        const axiosError = error.response?.data.errors[0].msg;
        toast.error(axiosError);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="bottom-right" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={(e) => save(e)}>
          <div className="space-y-6">
            <div>
              <Label htmlFor="product">Product</Label>
              <Select
                options={options}
                onChange={(selectedOption) =>
                  handleSelectChange(selectedOption)
                }
                placeholder="Select a product"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                value={formData.amount}
                type="number"
                placeholder="Amount"
                name="amount"
                onChange={(e) => handleChange(e)}
              />
            </div>
            <div>
              <Label htmlFor="installmentType">Installment Type</Label>
              <Select
                options={[
                  { value: "daily", label: "Daily" },
                  { value: "weekly", label: "Weekly" },
                ]}
                onChange={(selectedOption) =>
                  handleInstallmentChange(selectedOption)
                }
                placeholder="Select installment type"
              />
            </div>
            <div>
              <Label htmlFor="purpose">Purpose</Label>
              <Input
                value={formData.purpose}
                type="text"
                placeholder="Purpose"
                name="purpose"
                onChange={(e) => handleChange(e)}
              />
            </div>

            <div>
              <Label htmlFor="applicationDate">Application Date</Label>

              <Input
                value={formData.applicationDate}
                type="date"
                placeholder="Application Date"
                name="applicationDate"
                onChange={(e) => handleChange(e)}
              />
            </div>
          </div>
          <Button className="mt-6 w-md" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </div>
    </>
  );
};

const AuthenticatedLoanApplication = withAuth(LoanApplication);

export default AuthenticatedLoanApplication;
