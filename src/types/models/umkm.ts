import { Region } from "./region";

export interface Umkm {
  id: number;
  partnerId: number | null;
  ownerName: string;
  businessName: string;
  businessAddress: string | null;
  regionId: number | null;
  subdistrictName?: string | null;
  postalCode: string | null;
  umkmCoordinate: string | null;
  businessType: string | null;
  products: string | null;
  employeeId: number | null;
  createdAt: string; // ISO timestamp
  updatedAt: string;
  waliId: number | null;
  childrenId: number | null;
  umkmPict?: string | null;
  umkmPict2?: string | null;
  umkmPict3?: string | null;
  umkmPict4?: string | null;
  umkmPict5?: string | null;
  isActive: boolean;
  regions: Region

  // Non-native Field
  regionName?: string | null;
}
