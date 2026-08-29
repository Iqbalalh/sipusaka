import { API_STAFF, API_STAFF_OPTIMIZED } from "@/constants/endpoint";
import { crudService, paginatedFetch } from "./crud";

export interface Staff {
  id: number;
  staffName: string;
  gender: "M" | "F";
  birthplace: string | null;
  birthdate: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  nik: string;
  roleId: number | null;
  position: string | null;
  isActive: boolean;
  staffPict: string | null;
  signaturePath: string | null;
  signatureUrl: string | null;
  parafPath: string | null;
}

export const {
  list: getStaffs,
  get: getStaff,
  create: createStaff,
  update: updateStaff,
  remove: deleteStaff,
} = crudService<Staff>(API_STAFF);

export const getStaffOptimized = paginatedFetch<Staff>(API_STAFF_OPTIMIZED);
