import { Region } from "@/types/models/region";
import { API_REGION } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import { ApiResponseList } from "@/types/generic/api-response";
import { apiClient } from "../fetch/apiClient";

export const getRegionsList = async (): Promise<Region[]> => {
  try {
    const json = await apiClient<ApiResponseList<Region>>(`${API_REGION}/list`);

    return camelcaseKeys(json.data, { deep: true }) as Region[];
  } catch (error) {
    throw error;
  }
};
