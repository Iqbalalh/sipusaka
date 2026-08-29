import { API_USERS } from "@/constants/endpoint";
import { fetchWithAuth } from "../fetch/fetchWithAuth";
import { crudService } from "./crud";

export interface User {
  userId: number;
  username: string;
  staffId: number | null;
  role: string;
  staffName: string | null;
  staffPict: string | null;
  email: string | null;
}

export const {
  list: getUsers,
  get: getUser,
  remove: deleteUser,
} = crudService<User>(API_USERS);

export interface CreateUserData {
  username: string;
  password: string;
  staffId: number;
  role?: string;
}

export interface UpdateUserData {
  username?: string;
  password?: string;
  staffId?: number;
  role?: string;
}

// Users are created/updated as JSON with their own error copy, so they don't
// go through the shared FormData create/update.
const submitUser = async (
  url: string,
  method: "POST" | "PATCH",
  data: CreateUserData | UpdateUserData,
  errorMessage: string
) => {
  const response = await fetchWithAuth(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorMessage);
  }

  return response.json();
};

export const createUser = (data: CreateUserData) =>
  submitUser(API_USERS, "POST", data, "Gagal membuat user");

export const updateUser = (id: string | number, data: UpdateUserData) =>
  submitUser(`${API_USERS}/${id}`, "PATCH", data, "Gagal memperbarui user");
