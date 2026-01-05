import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface BasePartner {
  id?: number;
  employeeId?: number | null;
  partnerName?: string;
  partnerJob?: string;
  partnerNik?: string;
  regionId: number | null;
  address: string | null;
  subdistrictName?: string | null;
  postalCode: string;
  homeCoordinate: string;
  phoneNumber?: string;
  phoneNumberAlt: string;
  isActive: boolean;
  isAlive: boolean;
  partnerPict?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface Partner extends BasePartner {
  isUmkm?: boolean;
  regionName?: string | null;
  partnerPictFile?: File | null;
}
