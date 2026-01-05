export interface Staff {
  id?: number;
  staffName: string;
  gender: "M" | "F" | string;
  birthpalace?: string | null;
  birthdate?: string | null;
  address?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  nik?: string | null;
  roleId?: number | null;
  staffPict?: string | null;

  roleName?: string | null;
}
