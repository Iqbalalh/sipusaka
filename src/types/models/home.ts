import { BaseChildren } from "./children";
import { BaseEmployee } from "./employee";
import { Partner } from "./partner";
import { Wali } from "./wali";

export interface BaseHome {
  id: number | null;
  partnerId?: number | null;
  employeeId?: number | null;
  waliId?: number | null;
  createdAt?: string;
  regionId: number | null;
  postalCode: string | null;
}

export interface Home extends BaseHome {
  employee: BaseEmployee;
  partner: Partner;
  wali: Wali;
  childrens: BaseChildren[];
  selectedRegionName?: string | null;
  regions?: {
    id: number;
    regionName: string;
  } | null;
  _count?: {
    children: number;
  };
  isUmkm?: boolean;
}

// Type matching the API response structure for the table
export interface HomeTable {
  id: number;
  partnerId: number;
  employeeId: number;
  waliId: number | null;
  createdAt: string;
  regionId: number | null;
  postalCode: string | null;
  partners: {
    id: number;
    employeeId: number;
    partnerName: string;
    partnerJob: string | null;
    partnerNik: string | null;
    regionId: number;
    address: string;
    subdistrictName: string | null;
    postalCode: string | null;
    homeCoordinate: string;
    phoneNumber: string;
    phoneNumberAlt: string | null;
    isActive: boolean;
    isAlive: boolean | null;
    partnerPict: string | null;
    createdAt: string;
    updatedAt: string;
  };
  employees: {
    id: number;
    nipNipp: string;
    employeeName: string;
    deathCause: string | null;
    lastPosition: string | null;
    regionId: number;
    notes: string | null;
    employeeGender: string;
    isAccident: boolean;
    employeePict: string | null;
    createdAt: string;
    updatedAt: string;
  };
  wali: Wali | null;
  regions: {
    id: number;
    regionName: string;
  } | null;
  _count: {
    children: number;
  };
  isUmkm: boolean;
}
