import { Gallery, Category } from "@/types/models/gallery";
import { API_GALLERIES } from "@/constants/endpoint";
import { apiClient } from "../fetch/apiClient";
import { crudService } from "./crud";

export const {
  list: getGalleries,
  get: getGallery,
  create: createGallery,
  update: updateGallery,
  remove: deleteGallery,
} = crudService<Gallery>(API_GALLERIES);

const categories = crudService<Category>(`${API_GALLERIES}/categories`);

export const getCategories = crudService<Category>(
  `${API_GALLERIES}/categories/all`
).list;
export const { get: getCategory, remove: deleteCategory } = categories;

// Categories are plain JSON, not multipart like the rest of the resources.
export const createCategory = (data: { name: string; slug: string }) =>
  apiClient(`${API_GALLERIES}/categories`, {
    method: "POST",
    body: data as never,
  });

export const updateCategory = (
  id: string | number,
  data: { name?: string; slug?: string }
) =>
  apiClient(`${API_GALLERIES}/categories/${id}`, {
    method: "PATCH",
    body: data as never,
  });
