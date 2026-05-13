// ==============================================
// CONSTANTS
// ==============================================

import { Option } from "@/types/generic/select-option";

export const EDUCATION_LEVEL_OPTIONS: { value: string; label: string }[] = [
  { value: "Pra Sekolah - TK", label: "Pra Sekolah - TK" },
  { value: "ABK", label: "ABK" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
  { value: "D1", label: "D1" },
  { value: "D2", label: "D2" },
  { value: "D3", label: "D3" },
  { value: "D4 - S1", label: "D4 - S1" },
  { value: "Kursus", label: "Kursus" },
];

export const PLH_OPTIONS: Option[] = [
  { value: true, label: "PLH" },
  { value: false, label: "Non-PLH" },
];

export const GENDER_OPTIONS: Option[] = [
  { value: "F", label: "Perempuan" },
  { value: "M", label: "Laki-laki" },
];