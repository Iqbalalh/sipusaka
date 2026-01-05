import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface BaseChildren {
  id?: number;
  employeeId?: number;
  partnerId?: number;
  homeId?: number | null;
  childrenName: string;
  isActive: boolean;
  childrenBirthdate?: string | null;
  childrenAddress?: string | null;
  childrenPhone?: string | null;
  notes?: string | null;
  isFatherAlive: boolean;
  isMotherAlive: boolean;
  childrenGender: "M" | "F";
  isCondition: boolean;
  childrenPict?: string | null;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  index?: number | null;
  nik?: string | null;
  childrenJob?: string | null;
}

export interface Children extends BaseChildren {
  childrenPictFile?: File | null;
  employeeName: string;
  partnerName: string;
  waliName: string;
  regionId: number;
}
