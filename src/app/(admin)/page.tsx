import type { Metadata } from "next";
import { TableMetrics } from "@/components/dashboard/TableMetrics";
import { LetterNotifications } from "@/components/dashboard/LetterNotifications";
import WilayahPage from "@/modules/wilayah/WilayahPage";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <LetterNotifications />
        <TableMetrics />
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-5">Statistik per Wilayah</h2>
          <WilayahPage />
        </div>
      </div>
    </div>
  );
}
