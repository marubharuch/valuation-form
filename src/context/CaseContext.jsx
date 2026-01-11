export default function CaseDetails({ caseData, setCaseData, setPage }) {

  const next = () => {
    if (!caseData.buyerName || !caseData.address) {
      alert("Please enter buyer name and address");
      return;
    }
    setPage("add"); // go to next step (AddProperty / Documents later)
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-4">Case Received</h2>

      <label className="text-sm text-gray-600">Buyer / Owner Name</label>
      <input
        value={caseData.buyerName}
        onChange={(e) =>
          setCaseData({ ...caseData, buyerName: e.target.value })
        }
        className="w-full p-3 border rounded mb-4"
        placeholder="Enter buyer name"
      />

      <label className="text-sm text-gray-600">Property Address</label>
      <textarea
        rows={4}
        value={caseData.address}
        onChange={(e) =>
          setCaseData({ ...caseData, address: e.target.value })
        }
        className="w-full p-3 border rounded mb-6"
        placeholder="Enter full property address"
      />

      <button
        onClick={next}
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Next →
      </button>
    </div>
  );
}
