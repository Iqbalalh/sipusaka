export interface ApiResponseList<T> {
  message: string;
  data: T[];
}

export interface ApiResponseSingle<T> {
  message: string;
  data: T;
}