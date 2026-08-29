import { Partner } from "@/types/models/partner";
import {
  API_PARTNER,
  API_PARTNER_OPTIMIZED,
  API_PARTNER_SUMMARY,
} from "@/constants/endpoint";
import { crudService, paginatedFetch, summaryFetch } from "./crud";

export interface PartnerSummary {
  total: number;
  active: number;
  inactive: number;
}

export const {
  list: getPartners,
  get: getPartner,
  create: createPartner,
  update: updatePartner,
  remove: deletePartner,
} = crudService<Partner>(API_PARTNER);

export const getPartnersOptimized =
  paginatedFetch<Partner>(API_PARTNER_OPTIMIZED);
export const getPartnerSummary =
  summaryFetch<PartnerSummary>(API_PARTNER_SUMMARY);
