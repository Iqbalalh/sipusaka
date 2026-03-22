import { LetterType, LetterStatus } from "@/utils/services/letter.service";

// Letter Type Options
export const LETTER_TYPE_OPTIONS: {
  value: LetterType;
  label: string;
  description: string;
}[] = [
  {
    value: "BANTUAN_PENDIDIKAN",
    label: "Bantuan Pendidikan",
    description: "Surat untuk bantuan pendidikan",
  },
  {
    value: "BANTUAN_SOSIAL",
    label: "Bantuan Sosial",
    description: "Surat untuk bantuan sosial",
  },
  {
    value: "SURAT_UNDANGAN",
    label: "Surat Undangan",
    description: "Surat undangan acara/kegiatan",
  },
  {
    value: "SURAT_PERMOHONAN",
    label: "Surat Permohonan",
    description: "Surat permohonan/permintaan",
  },
  {
    value: "SURAT_KEPUTUSAN",
    label: "Surat Keputusan",
    description: "Surat keputusan resmi",
  },
];

// Letter Status Options
export const LETTER_STATUS_OPTIONS: {
  value: LetterStatus;
  label: string;
  color: string;
  bgColor: string;
}[] = [
  {
    value: "DRAFT",
    label: "Draf",
    color: "text-gray-700",
    bgColor: "bg-gray-100",
  },
  {
    value: "PENDING_1",
    label: "Menunggu Persetujuan 1",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100",
  },
  {
    value: "PENDING_2",
    label: "Menunggu Persetujuan 2",
    color: "text-orange-700",
    bgColor: "bg-orange-100",
  },
  {
    value: "PENDING_3",
    label: "Menunggu Persetujuan 3",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
  },
  {
    value: "APPROVED",
    label: "Disetujui",
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  {
    value: "REJECTED",
    label: "Ditolak",
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  {
    value: "ARCHIVED",
    label: "Diarsipkan",
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
];

// Helper function to get letter type label
export const getLetterTypeLabel = (type: LetterType): string => {
  const option = LETTER_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.label || type;
};

// Helper function to get letter status info
export const getLetterStatusInfo = (
  status: LetterStatus
): { label: string; color: string; bgColor: string } => {
  const option = LETTER_STATUS_OPTIONS.find((opt) => opt.value === status);
  return (
    option || {
      label: status,
      color: "text-gray-700",
      bgColor: "bg-gray-100",
    }
  );
};
