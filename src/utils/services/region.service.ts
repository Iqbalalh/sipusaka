import { Region } from "@/types/models/region";
import { API_REGION, API_REGION_STATS, API_DASHBOARD } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import { ApiResponseList } from "@/types/generic/api-response";
import { apiClient } from "../fetch/apiClient";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getRegionsList = async (): Promise<Region[]> => {
  const json = await apiClient<ApiResponseList<Region>>(`${API_REGION}/list`);
  return camelcaseKeys(json.data, { deep: true }) as Region[];
};

// Full region records (with createdAt / audit) for the management table
export const getRegions = async (): Promise<Region[]> => {
  const json = await apiClient<ApiResponseList<Region>>(API_REGION);
  return camelcaseKeys(json.data, { deep: true }) as Region[];
};

export const createRegion = async (regionName: string) =>
  apiClient(API_REGION, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ regionName }),
  });

export const updateRegion = async (id: number, regionName: string) =>
  apiClient(`${API_REGION}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ regionName }),
  });

export const deleteRegion = async (id: number): Promise<void> => {
  await apiClient<void>(`${API_REGION}/${id}`, { method: "DELETE" });
};

export interface RegionStat {
  regionId: number;
  regionName: string;
  families: number;
  familiesActive: number;
  children: {
    total: number;
    active: number;
    inactive: number;
    yatim: number;
    piatu: number;
    yatimPiatu: number;
    abk: number;
  };
  educationLevels: Record<string, number>;
  umkm: {
    total: number;
    active: number;
    inactive: number;
  };
  childAssistance: {
    total: number;
    totalAmount: number;
    byYear?: Record<number, number>;
  };
  umkmVisits: {
    total: number;
    totalAmount: number;
    byYear?: Record<number, number>;
  };
  socialAssistance: {
    total: number;
    totalAmount: number;
  };
}

export const getRegionStats = async (): Promise<RegionStat[]> => {
  const res = await fetchWithAuth(API_REGION_STATS);
  const json = await res.json();
  return camelcaseKeys(json.data ?? [], { deep: true }) as RegionStat[];
};

export interface GlobalEducationLevels {
  TK: number;
  SD: number;
  SMP: number;
  SMA: number;
  Diploma: number;
  Sarjana: number;
  Magister: number;
  Doktor: number;
}

export const getGlobalEducationLevels = async (): Promise<GlobalEducationLevels> => {
  const res = await fetchWithAuth(API_DASHBOARD);
  const json = await res.json();
  const edu = json.data?.educationLevels ?? {};
  return camelcaseKeys(edu, { deep: false }) as GlobalEducationLevels;
};
