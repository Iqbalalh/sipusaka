export type LetterStatus = 'draft' | 'pending1' | 'pending2' | 'pending3' | 'approved' | 'published';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface LetterApproval {
  id: number;
  letterId: number;
  signerId: number;
  signerLevel: number;
  action: string | null;
  actionNote: string | null;
  actionAt: string | null;
  signer?: User;
}

export interface Letter {
  id: number;
  letterType: string;
  letterNumber: string | null;
  attachment: string | null;
  subject: string;
  letterDate: string;
  destination: string;
  carbonCopy: string | null;
  documentPath: string | null;
  status: LetterStatus;
  signer1Id: number;
  signer2Id: number | null;
  signer3Id: number | null;
  revisionNote: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: number | null;
  editedBy: number | null;
  signer1?: User;
  signer2?: User | null;
  signer3?: User | null;
  approvals?: LetterApproval[];
  documentFile?: File | null;
}

export interface LetterFormData {
  letterType: string;
  letterNumber: string;
  attachment: string;
  subject: string;
  letterDate: string;
  destination: string;
  carbonCopy: string;
  signer1Id: number;
  signer2Id?: number | null;
  signer3Id?: number | null;
  documentFile?: File | null;
}

export interface LetterListResponse {
  data: Letter[];
  total: number;
}

export interface ApprovalActionData {
  actionNote?: string;
}
