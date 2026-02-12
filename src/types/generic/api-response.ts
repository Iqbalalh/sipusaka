export interface ApiResponseList<T> {
  message: string;
  data: T[];
}

export interface ApiResponseSingle<T> {
  message: string;
  data: T;
}

export interface ApiResponsePaginated<T> {
  message: string;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}