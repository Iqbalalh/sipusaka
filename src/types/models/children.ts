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
  homes?: {
    id: number;
    partnerId: number;
    employeeId: number;
    waliId: number | null;
    createdAt: string;
    regionId: number | null;
    postalCode: string | null;
    employees?: {
      id: number;
      nipNipp: string;
      employeeName: string;
      deathCause: string | null;
      lastPosition: string | null;
      regionId: number;
      notes: string | null;
      employeeGender: "M" | "F";
      isAccident: boolean;
      employeePict: string | null;
      createdAt: string;
      updatedAt: string;
    };
    partners?: {
      id: number;
      employeeId: number;
      partnerName: string;
      partnerJob: string | null;
      partnerNik: string | null;
      regionId: number;
      address: string;
      subdistrictName: string;
      postalCode: string;
      homeCoordinate: string;
      phoneNumber: string;
      phoneNumberAlt: string | null;
      isActive: boolean;
      isAlive: boolean;
      partnerPict: string | null;
      createdAt: string;
      updatedAt: string;
    };
    wali?: {
      id: number;
      waliName: string;
    } | null;
  };
}
