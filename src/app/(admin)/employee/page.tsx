import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import EmployeeTable from "@/modules/employee/employee.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pegawai",
};

export default function EmployeeTables() {
  return (
    <div>
        {" "}
        <PageBreadcrumb pageTitle="Pegawai" />
        <div className="space-y-6">
          <ComponentCard title="Data Pegawai" header={false}>
            <EmployeeTable />
          </ComponentCard>
        </div>
    </div>
  );
}
