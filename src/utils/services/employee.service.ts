import { Employee } from "@/types/models/employee";
import {
  API_EMPLOYEE,
  API_EMPLOYEE_OPTIMIZED,
  API_EMPLOYEE_SUMMARY,
} from "@/constants/endpoint";
import { crudService, paginatedFetch, summaryFetch } from "./crud";

export interface EmployeeSummary {
  total: number;
  active: number;
  inactive: number;
}

export const {
  list: getEmployees,
  get: getEmployee,
  create: createEmployee,
  update: updateEmployee,
  remove: deleteEmployee,
} = crudService<Employee>(API_EMPLOYEE);

export const getEmployeesOptimized =
  paginatedFetch<Employee>(API_EMPLOYEE_OPTIMIZED);
export const getEmployeeSummary =
  summaryFetch<EmployeeSummary>(API_EMPLOYEE_SUMMARY);
