import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface BaseAlumni {
  id?: number;
  alumniName: string;
  alumniGender: "M" | "F";
  alumniBirthdate?: string | null;
  alumniAddress?: string | null;
  alumniPhone?: string | null;
  educationLevel?: string | null;
  alumniJob?: string | null;
  nik?: string | null;
  notes?: string | null;
  alumniPict?: string | null;
  age?: number | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: number | null;
  editedBy?: number | null;
}

export interface Alumni extends BaseAlumni {
  alumniPictFile?: File | null;
  createdByStaffName?: string | null;
  editedByStaffName?: string | null;
}
