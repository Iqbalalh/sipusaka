import { Wali } from "@/types/models/wali";
import {
  API_WALI,
  API_WALI_OPTIMIZED,
  API_WALI_SUMMARY,
} from "@/constants/endpoint";
import { crudService, paginatedFetch, summaryFetch } from "./crud";

export interface WaliSummary {
  total: number;
}

export const {
  list: getWalis,
  get: getWali,
  create: createWali,
  update: updateWali,
  remove: deleteWali,
} = crudService<Wali>(API_WALI);

/** Trimmed-down list used to populate select dropdowns. */
export const getWaliList = crudService<Wali>(`${API_WALI}/list`).list;

export const getWaliOptimized = paginatedFetch<Wali>(API_WALI_OPTIMIZED);
export const getWaliSummary = summaryFetch<WaliSummary>(API_WALI_SUMMARY);
