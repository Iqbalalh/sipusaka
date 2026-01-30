import { UmkmSupportDoc } from "./umkm-support-doc";

export interface UmkmSupport {
  id: number;
  umkmId: number;
  visitCount: number;
  visitDate: string;

  supportType: string | null;
  supportItem: string | null;
  supportNominal: number | null;
  sourceOfFunds: string | null;
  valueNominal: number | null;

  documents: UmkmSupportDoc[]; // ⬅️ BANYAK

  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  editedBy?: number | null;
}
