export interface BaseEmployee {
  id?: number;
  nipNipp: string;
  employeeName: string;
  deathCause: string;
  lastPosition?: string;
  regionId?: number | null;
  notes?: string | null;
  employeeGender: "M" | "F";
  isAccident: boolean;
  employeePict?: string | null;
  createdAt?: string | null; // Timestamp ISO
  updatedAt?: string | null; // Timestamp ISO
  createdBy?: number | null;
  editedBy?: number | null;
}

export interface Employee extends BaseEmployee {
  regionName: string;
  employeePictFile?: File | null;
}
