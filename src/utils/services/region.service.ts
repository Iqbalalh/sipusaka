import { Region } from "@/types/models/region";
import { API_REGION, API_REGION_STATS } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import { ApiResponseList } from "@/types/generic/api-response";
import { apiClient } from "../fetch/apiClient";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getRegionsList = async (): Promise<Region[]> => {
  try {
    const json = await apiClient<ApiResponseList<Region>>(`${API_REGION}/list`);
    return camelcaseKeys(json.data, { deep: true }) as Region[];
  } catch (error) {
    throw error;
  }
};

export interface RegionStat {
  regionId: number;
  regionName: string;
  families: number;
  children: {
    total: number;
    active: number;
    inactive: number;
    yatim: number;
    piatu: number;
    yatimPiatu: number;
    abk: number;
  };
  educationLevels: {
    TK: number;
    SD: number;
    SMP: number;
    SMA: number;
    Diploma: number;
    Sarjana: number;
    Magister: number;
    Doktor: number;
  };
  umkm: {
    total: number;
    active: number;
    inactive: number;
  };
  childAssistance: {
    total: number;
    totalAmount: number;
  };
  umkmVisits: {
    total: number;
    totalAmount: number;
  };
  socialAssistance: {
    total: number;
    totalAmount: number;
  };
}

export const getRegionStats = async (): Promise<RegionStat[]> => {
  try {
    const res = await fetchWithAuth(API_REGION_STATS);
    const json = await res.json();
    return camelcaseKeys(json.data ?? [], { deep: true }) as RegionStat[];
  } catch (error) {
    throw error;
  }
};
