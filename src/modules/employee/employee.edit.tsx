"use client";

import { useParams } from "next/navigation";
import EmployeeForm from "@/components/custom/form/EmployeeForm";

export default function UpdateEmployee() {
  const { id } = useParams<{ id: string }>();
  return <EmployeeForm mode="edit" employeeId={id} />;
}
