import { apiClient } from "./apiClient";

export const deleteResource = async (
  url: string
): Promise<void> => {
  await apiClient<void>(url, {
    method: "DELETE",
  });
};
