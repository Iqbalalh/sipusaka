import { Suspense } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import UserTable from "@/modules/user/user.table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User",
};

export default function UsersTables() {
  return (
    <div>
        <PageBreadcrumb pageTitle="User" />
        <div className="space-y-6">
          <ComponentCard title="Data User" header={false}>
            <Suspense>
              <UserTable />
            </Suspense>
          </ComponentCard>
        </div>
    </div>
  );
}
