export const valuationSummarySchema = {
  id: "valuationSummary",
  title: "Valuation Summary",
  showHeaderIfValuer: "k",

  fields: [
    { key: "ownerName", label: "OWNER NAME" },
    { key: "purchaserName", label: "PURCHASER NAME", multiline: true },
    { key: "propertyAddress", label: "PROPERTY ADDRESS", multiline: true },
    { key: "valuationDate", label: "DATE OF VALUATION", type: "date" },

    { key: "fairMarketValue", label: "FAIR MARKET VALUE" },
    { key: "realizableValue", label: "REALIZABLE VALUE" },
    { key: "distressValue", label: "DISTRESS VALUE" },
    { key: "jantriValue", label: "JANTRI VALUE" },
    { key: "insurableValue", label: "INSURABLE VALUE" },
  ],
};
