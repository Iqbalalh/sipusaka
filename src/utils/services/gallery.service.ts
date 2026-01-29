import { Gallery, Category } from "@/types/models/gallery";
import { apiClient } from "../fetch/apiClient";
import { API_GALLERIES } from "@/constants/endpoint";
import camelcaseKeys from "camelcase-keys";
import {
  ApiResponseList,
  ApiResponseSingle,
} from "@/types/generic/api-response";
import { deleteResource } from "../fetch/deleteResource";
import { fetchWithAuth } from "../fetch/fetchWithAuth";

export const getGalleries = async (): Promise<Gallery[]> => {
  try {
    const json = await apiClient<ApiResponseList<Gallery>>(API_GALLERIES);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Gallery[];
  } catch (error) {
    throw error;
  }
};

export const getGallery = async (id: number | string): Promise<Gallery> => {
  try {
    const json = await apiClient<ApiResponseSingle<Gallery>>(`${API_GALLERIES}/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Gallery;
  } catch (error) {
    throw error;
  }
};

export const createGallery = async (fd: FormData) => {
  return await fetchWithAuth(API_GALLERIES, {
    method: "POST",
    body: fd,
  });
};

export const updateGallery = async (id: string | number, fd: FormData) => {
  return await fetchWithAuth(`${API_GALLERIES}/${id}`, {
    method: "PATCH",
    body: fd,
  });
};

export const deleteGallery = async (id: number) => {
  try {
    return await deleteResource(`${API_GALLERIES}/${id}`);
  } catch (error) {
    throw error;
  }
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const json = await apiClient<ApiResponseList<Category>>(`${API_GALLERIES}/categories/all`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Category[];
  } catch (error) {
    throw error;
  }
};

export const getCategory = async (id: number | string): Promise<Category> => {
  try {
    const json = await apiClient<ApiResponseSingle<Category>>(`${API_GALLERIES}/categories/${id}`);
    return camelcaseKeys(json.data ?? json, { deep: true }) as unknown as Category;
  } catch (error) {
    throw error;
  }
};

export const createCategory = async (data: { name: string; slug: string }) => {
  try {
    const response = await fetchWithAuth(`${API_GALLERIES}/categories`, {
      method: "POST",
      body: data as any,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to create category: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error in createCategory:', error);
    throw error;
  }
};

export const updateCategory = async (id: string | number, data: { name?: string; slug?: string }) => {
  try {
    const response = await fetchWithAuth(`${API_GALLERIES}/categories/${id}`, {
      method: "PATCH",
      body: data as any,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Failed to update category: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error in updateCategory:', error);
    throw error;
  }
};

export const deleteCategory = async (id: number) => {
  try {
    return await deleteResource(`${API_GALLERIES}/categories/${id}`);
  } catch (error) {
    throw error;
  }
};