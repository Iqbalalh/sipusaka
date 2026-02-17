// Medical Equipment Options for Dropdown
// Values in Indonesian as requested
export const MEDICAL_EQUIPMENT_OPTIONS = [
  { value: "kursi roda", label: "Kursi Roda" },
  { value: "kursi sholat", label: "Kursi Sholat" },
  { value: "tongkat", label: "Tongkat" },
  { value: "pempers", label: "Pempers" },
] as const;

export type MedicalEquipmentType = typeof MEDICAL_EQUIPMENT_OPTIONS[number]["value"];
