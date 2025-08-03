interface ConfirmProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
  title?: string;
}

const Confirm: React.FC<ConfirmProps> = ({
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
  );
};

export default Confirm;
