export interface BaseWali {
  id?: number;
  employeeId?: number;
  waliName: string;
  relation: string | null;
  waliAddress?: string | null;
  addressCoordinate: string | null;
  waliPhone?: string | null;
  createdAt?: string; // ISO timestamp
  updatedAt?: string;
  waliPict?: string | null;
  nik?: string | null;
  waliJob?: string | null;
}

export interface Wali extends BaseWali {
  waliPictFile?: File | null;
}
