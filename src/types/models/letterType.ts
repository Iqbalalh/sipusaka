export interface TemplateField {
  key: string;
  label: string;
  required?: boolean;
}

export interface LetterType {
  id: number;
  jenisSurat: string;
  perihal?: string | null;
  kodeSurat1: string;
  kodeSurat2?: string | null;
  currentCounter: number;
  templateFields: TemplateField[];
  templatePath?: string | null;
  templateUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
