import { apiClient } from "../fetch/apiClient";
import { API_USERS } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export interface User {
  userId: number;
  username: string;
  staffId: number | null;
  role: string;
  staffName: string | null;
  staffPict: string | null;
  email: string | null;
}

export const getUsers = async (): Promise<User[]> => {
  try {
    const json = await apiClient<ApiResponseList<User>>(API_USERS);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as User[];
  } catch (error) {
    throw error;
  }
};

export const getUser = async (id: number | string): Promise<User> => {
  try {
    const json = await apiClient<ApiResponseSingle<User>>(`${API_USERS}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as User;
  } catch (error) {
    throw error;
  }
};

export interface CreateUserData {
  username: string;
  password: string;
  staffId: number;
  role?: string;
}

export const createUser = async (data: CreateUserData) => {
  console.log("createUser called with data:", data);
  const response = await fetchWithAuth(API_USERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  console.log("createUser response status:", response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("createUser error:", errorData);
    throw new Error(errorData.message || "Failed to create user");
  }
  
  const result = await response.json();
  console.log("createUser result:", result);
  return result;
};

export interface UpdateUserData {
  username?: string;
  password?: string;
  staffId?: number;
  role?: string;
}

export const updateUser = async (id: string | number, data: UpdateUserData) => {
  console.log("updateUser called with id:", id, "data:", data);
  const response = await fetchWithAuth(`${API_USERS}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  console.log("updateUser response status:", response.status);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("updateUser error:", errorData);
    throw new Error(errorData.message || "Failed to update user");
  }
  
  const result = await response.json();
  console.log("updateUser result:", result);
  return result;
};

export const deleteUser = async (id: number) => {
  try {
    return await deleteResource(`${API_USERS}/${id}`);
  } catch (error) {
    throw error;
  }
};
