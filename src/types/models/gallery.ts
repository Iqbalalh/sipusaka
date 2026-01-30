import { Timestamp } from "next/dist/server/lib/cache-handlers/types";
import { Region } from "./region";

export interface Category {
  id: number;
  name: string;
  slug: string;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdBy?: number | null;
  editedBy?: number | null;
}

export interface BaseGallery {
  id?: number;
  s3Path?: string | null;
  caption?: string | null;
  regionId?: number | null;
  regionName?: string | null;
  region?: Region | null;
  galleryDate?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  createdBy?: number | null;
  editedBy?: number | null;
}

export interface Gallery extends BaseGallery {
  categories?: Category[];
  imageFile?: File | null;
}