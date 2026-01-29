import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import CategoriesTable from "@/modules/categories/categories.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kategori",
};

export default function CategoriesTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Kategori" />
      <div className="space-y-6">
        <ComponentCard title="Jumlah Data" header={false}>
          <CategoriesTable />
        </ComponentCard>
      </div>
    </div>
  );
}