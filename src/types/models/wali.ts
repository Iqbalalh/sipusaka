import { Timestamp } from "next/dist/server/lib/cache-handlers/types";

export interface BaseWali {
  id?: number;
  employeeId?: number | null;
  waliName: string;
  relation?: string | null;
  waliAddress?: string | null;
  addressCoordinate?: string | null;
  waliPhone?: string | null;
  nik?: string | null;
  waliJob?: string | null;
  waliPict?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdBy?: number | null;
  editedBy?: number | null;
}

export interface Wali extends BaseWali {
  employeeName?: string | null;
  waliPictFile?: File | null;
}
