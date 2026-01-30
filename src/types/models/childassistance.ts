export interface ChildAssistance {
  id: number;
  childrenId: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceProvider: string;
  assistanceAmount: number;
  educationLevel?: string | null;
  educationGrade?: string | null;
  schoolName?: string | null;
  age?: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: number | null;
  editedBy?: number | null;
  children?: {
    id: number;
    childrenName: string;
  };
  childAssistanceDocs?: ChildAssistanceDoc[];
}

export interface ChildAssistanceDoc {
  id: number;
  childAssistanceId: number;
  name: string;
  urlDoc: string;
  createdAt: string;
}