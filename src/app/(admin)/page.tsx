import type { Metadata } from "next";
import { TableMetrics } from "@/components/dashboard/TableMetrics";
import UmkmChart from "@/components/dashboard/UmkmChart";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function Ecommerce() {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-12">
        <TableMetrics />
        {/* <UmkmChart /> */}
      </div>
    </div>
  );
}
