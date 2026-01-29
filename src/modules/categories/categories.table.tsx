"use client";

import DataTable from "@/components/custom/table/DataTable";
import { Category } from "@/types/models/gallery";
import { getCategories, deleteCategory } from "@/utils/services/gallery.service";
import { getCategoryColumns } from "./categories.columns";

export default function CategoriesTable() {
  const columns = getCategoryColumns();

  return (
    <DataTable<Category>
      fetchData={getCategories}
      deleteItem={deleteCategory}
      columns={columns}
      rowKey="id"
      exportConfig={{
        filename: "data-kategori",
        sheetName: "Kategori",
      }}
      title="Jumlah Data"
      createPath="/categories/create"
      pageSize={20}
      scrollY={500}
      deleteConfirmTitle="Konfirmasi Hapus"
      deleteConfirmMessage="Apakah Anda yakin ingin menghapus kategori ini?"
      deleteSuccessMessage="Kategori berhasil dihapus"
    />
  );
}