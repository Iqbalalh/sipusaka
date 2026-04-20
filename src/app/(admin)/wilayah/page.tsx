import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import WilayahPage from "@/modules/wilayah/WilayahPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistik Wilayah",
};

export default function Wilayah() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Statistik Wilayah" />
      <WilayahPage />
    </div>
  );
}
