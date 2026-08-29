import { Umkm } from "@/types/models/umkm";
import {
  API_UMKM,
  API_UMKM_OPTIMIZED,
  API_UMKM_TABLE_SUMMARY,
} from "@/constants/endpoint";
import { crudService, paginatedFetch, summaryFetch } from "./crud";

export interface UmkmSummary {
  total: number;
  active: number;
  inactive: number;
  totalDana?: number;
  totalDanaYP?: number;
  totalDanaUPZ?: number;
}

export const {
  list: getUmkmList,
  get: getUmkm,
  create: createUmkm,
  update: updateUmkm,
  remove: deleteUmkm,
} = crudService<Umkm>(API_UMKM);

export const getUmkmOptimized = paginatedFetch<Umkm>(API_UMKM_OPTIMIZED);
export const getUmkmSummary =
  summaryFetch<UmkmSummary>(API_UMKM_TABLE_SUMMARY);
