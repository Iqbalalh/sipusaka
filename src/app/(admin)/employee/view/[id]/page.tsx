import EmployeeView from "@/modules/employee/employee.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pegawai",
};

export default function ViewEmployee() {
  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Pegawai
        </h3>
        <div className="space-y-6">
          <EmployeeView/>
        </div>
      </div>
    </div>
  );
}
