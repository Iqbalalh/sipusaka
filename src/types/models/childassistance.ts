export interface ChildAssistance {
  id: number;
  childrenId: number;
  assistanceNumber: number;
  assistanceDate: string;
  assistanceType: string;
  assistanceProvider: string;
  assistanceAmount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
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