export type LetterStatus = "draft" | "pending1" | "pending2" | "pending3" | "approved" | "published";

export interface LetterSigner {
  userId: number;
  username: string;
  staffName?: string | null;
  position?: string | null;
  signatureUrl?: string | null;
  parafUrl?: string | null;
}

export interface LetterApproval {
  id: number;
  letterId: number;
  signerId: number;
  signerLevel: number;
  action: string;
  actionNote?: string | null;
  actionAt: string;
  signatureUrl?: string | null;
  signaturePage?: number | null;
  signatureX?: number | null;
  signatureY?: number | null;
}

export interface Letter {
  id: number;
  letterType: string;
  letterTypeId?: number | null;
  letterNumber?: string | null;
  templateFieldData?: Record<string, string> | null;
  attachment?: string | null;
  subject: string;
  letterDate: string;
  destination: string;
  carbonCopy?: string | null;
  documentPath?: string | null;
  documentUrl?: string | null;
  signedDocumentPath?: string | null;
  signedDocumentUrl?: string | null;
  status: LetterStatus;
  notes?: string | null;
  signer1Id?: number | null;
  signer2Id?: number | null;
  signer3Id?: number | null;
  signer1?: LetterSigner | null;
  signer2?: LetterSigner | null;
  signer3?: LetterSigner | null;
  revisionNote?: string | null;
  letterApprovals?: LetterApproval[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number | null;
  editedBy?: number | null;
  verificationToken?: string | null;
  createdByName?: string | null;
  editedByName?: string | null;
}

export interface LetterFormData {
  letterType: string;
  letterNumber: string;
  attachment: string;
  subject: string;
  letterDate: string | null;
  destination: string;
  carbonCopy: string;
  signer1Id: number | null;
  signer2Id: number | null;
  signer3Id: number | null;
}
