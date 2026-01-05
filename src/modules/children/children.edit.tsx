"use client";

import { useParams } from "next/navigation";
import ChildrenForm from "@/components/custom/form/ChildrenForm";

export default function UpdateChildren() {
  const { id } = useParams<{ id: string }>();
  return <ChildrenForm mode="edit" childrenId={id} />;
}