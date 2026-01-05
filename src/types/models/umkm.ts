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

  // Non-native Field
  regionName?: string | null;
}
